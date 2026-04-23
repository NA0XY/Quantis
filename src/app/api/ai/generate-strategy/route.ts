import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const requestSchema = z.object({
  description: z.string().trim().min(1).max(1000),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  preferredIndicators: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
});

const QUANTIS_STRATEGY_INTERFACE = `
Define exactly one required top-level function:
def on_candle(candle, portfolio):

Runtime inputs:
- candle is [timestamp, open, high, low, close, volume]
- open, high, low, close, and volume may arrive as strings or numbers, so cast them safely with float(...)
- portfolio is a mutable dict with:
  - portfolio["cash"]: available simulated USD cash
  - portfolio["position"]: current base-asset quantity for the active symbol
  - portfolio["buy"](amount=0.0 to 1.0): buys using that fraction of available cash
  - portfolio["sell"](amount=0.0 to 1.0): sells that fraction of the current position

Execution behavior:
- on_candle is called once per candle and should not return anything
- trades are created only by calling portfolio["buy"](...) or portfolio["sell"](...)
- use module-level lists/dicts for rolling indicator state because custom portfolio keys are not persisted between candles
- print concise logs when a signal is triggered
`;

const SYSTEM_PROMPT = `You are an expert quantitative analyst and Python developer specializing in crypto algorithmic trading. Generate a complete, executable Python trading strategy for the Quantis platform.

STRICT REQUIREMENTS:
- The strategy MUST implement exactly this interface: ${QUANTIS_STRATEGY_INTERFACE}
- Use only built-in Python features and the already available math module. numpy and pandas are not available in this worker.
- The strategy must handle edge cases: not enough data, zero prices, missing fields
- Code must be clean, well-commented, and production-ready
- Do NOT include any markdown formatting, code fences, or explanatory text - return ONLY pure Python code
- Include a top-level docstring describing the strategy logic
- Include inline comments explaining key decisions`;

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
};

const forbiddenCodePatterns = [
  /(^|\n)\s*import\s+[^#\n]*(?:os|subprocess|sys)\b/i,
  /(^|\n)\s*from\s+(?:os|subprocess|sys)\s+import\b/i,
  /__import__/i,
  /\bopen\s*\(/i,
  /\bwrite\s*\(/i,
  /\bexec\s*\(/i,
];

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: securityHeaders,
  });
}

function buildUserMessage(input: z.infer<typeof requestSchema>) {
  const indicatorText = input.preferredIndicators.length > 0
    ? ` Preferred technical indicators: ${input.preferredIndicators.join(", ")}.`
    : "";

  return `Generate a Python trading strategy with these requirements: ${input.description}. Risk level: ${input.riskLevel}.${indicatorText}`;
}

function titleCaseWord(word: string) {
  if (word.length <= 4 && word === word.toUpperCase()) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

function createStrategyName(description: string) {
  const words = description
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map(titleCaseWord);

  return words.length > 0 ? words.join(" ") : "AI Generated Strategy";
}

function stripCodeFences(code: string) {
  const trimmed = code.trim();
  const fenced = trimmed.match(/^```(?:python)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTextContent(value: unknown): string | null {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    const text = value
      .map((item) => (isRecord(item) && typeof item.text === "string" ? item.text : ""))
      .join("");
    return text || null;
  }

  return null;
}

function extractGeneratedCode(data: unknown) {
  if (!isRecord(data)) return "";

  const choices = data.choices;
  if (Array.isArray(choices) && isRecord(choices[0])) {
    const message = choices[0].message;
    if (isRecord(message)) {
      const content = extractTextContent(message.content);
      if (content) return stripCodeFences(content);
    }
  }

  const content = extractTextContent(data.content);
  return content ? stripCodeFences(content) : "";
}

function isGeneratedCodeSafe(code: string) {
  if (!code.includes("def ")) return false;
  if (!/def\s+on_candle\s*\(\s*candle\s*,\s*portfolio\s*\)\s*:/.test(code)) return false;

  return !forbiddenCodePatterns.some((pattern) => pattern.test(code));
}

export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    const result = requestSchema.safeParse(rawBody);
    if (!result.success) {
      return jsonResponse(
        { error: "Invalid request", details: result.error.flatten() },
        400
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return jsonResponse({ error: "GROQ_API_KEY is not configured" }, 500);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(result.data) },
        ],
        stream: false,
        max_tokens: 2000,
        temperature: 0.4,
      }),
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error("Groq strategy generation error", {
        status: groqResponse.status,
        body: errorBody,
      });

      return jsonResponse({ error: `Groq API error: ${groqResponse.status}` }, groqResponse.status);
    }

    const data = await groqResponse.json();
    const code = extractGeneratedCode(data);

    if (!isGeneratedCodeSafe(code)) {
      return jsonResponse({ error: "Generated code failed safety check" }, 422);
    }

    return Response.json(
      {
        code,
        strategyName: createStrategyName(result.data.description),
      },
      {
        status: 200,
        headers: securityHeaders,
      }
    );
  } catch (error) {
    console.error("AI strategy generation route failed", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
