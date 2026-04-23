import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestSchema, type CoachRequestBody } from "./schema";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const RATE_LIMIT = 20;
const WINDOW_MS = 60000;

type CoachMode = "chat" | "analyze" | "recommend";

const SYSTEM_PROMPTS: Record<CoachMode, string> = {
  chat: "You are Quantis AI Coach, an expert in algorithmic crypto trading. Help users understand, refine, and optimize their trading strategies. Be concise, practical, and technically precise. Use markdown for structure. Always mention risk management implications when relevant.",
  analyze: "You are a quantitative analyst specializing in crypto algorithmic trading. Analyze the provided trading strategy thoroughly. Structure your response with these exact markdown headers: ## Strategy Overview, ## Logic & Approach, ## Risk Management Assessment, ## Potential Weaknesses & Edge Cases, ## Suggested Improvements (ranked by impact), ## Verdict. Be specific, actionable, and technically rigorous.",
  recommend: "You are a portfolio performance advisor for crypto algo-trading. Given metrics, provide prioritized recommendations. Structure with: ## Performance Summary, ## Top 3 Immediate Actions, ## Parameter Optimization Suggestions, ## Risk Adjustments, ## Long-Term Strategy Evolution. Quantify every suggestion where possible.",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
};

function jsonResponse(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: {
      ...securityHeaders,
      ...headers,
    },
  });
}

function getRateLimitKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return request.headers.get("cf-connecting-ip")
    ?? forwardedFor
    ?? request.headers.get("x-real-ip")
    ?? "anonymous";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimitMap.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  current.count += 1;
  return current.count <= RATE_LIMIT;
}

function sanitizeString(value?: string) {
  return value?.replace(/\x00/g, "").trim();
}

function truncateStrategy(strategy?: string) {
  if (!strategy) return strategy;

  const lines = strategy.split("\n");
  if (lines.length <= 200) return strategy;

  return `${lines.slice(0, 200).join("\n")}\n[truncated for analysis]`;
}

function sanitizeRequestBody(body: CoachRequestBody): CoachRequestBody {
  return {
    ...body,
    message: sanitizeString(body.message),
    strategy: truncateStrategy(sanitizeString(body.strategy)),
    history: body.history.map((message) => ({
      role: message.role,
      content: sanitizeString(message.content) ?? "",
    })),
  };
}

function buildUserContent(body: CoachRequestBody) {
  const message = body.message;

  if (body.mode === "analyze") {
    const strategy = body.strategy;
    const base = strategy ? `Please analyze this trading strategy:\n\n\`\`\`\n${strategy}\n\`\`\`` : "";
    return message ? `${base}\n\nAdditional context: ${message}`.trim() : base;
  }

  if (body.mode === "recommend") {
    const metrics = body.portfolioData && Object.keys(body.portfolioData).length > 0
      ? `Please provide recommendations based on these metrics:\n\n\`\`\`json\n${JSON.stringify(body.portfolioData, null, 2)}\n\`\`\``
      : "";

    return message ? `${metrics}\n\nSpecific concern: ${message}`.trim() : metrics;
  }

  return message ?? "";
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

    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return jsonResponse(
        { error: "Too many requests. Please wait a moment." },
        429,
        { "Retry-After": "60" }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return jsonResponse({ error: "GROQ_API_KEY is not configured" }, 500);
    }

    const body = sanitizeRequestBody(result.data);
    const userContent = buildUserContent(body);

    if (!userContent.trim()) {
      return jsonResponse({ error: "No content provided" }, 400);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPTS[body.mode] },
      ...body.history.slice(-10),
      { role: "user" as const, content: userContent },
    ];

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        max_tokens: 1500,
        temperature: 0.65,
      }),
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error("Groq API error", {
        status: groqResponse.status,
        body: errorBody,
      });

      return Response.json(
        { error: `Groq API error: ${groqResponse.status}` },
        {
          status: groqResponse.status,
          headers: securityHeaders,
        }
      );
    }

    if (!groqResponse.body) {
      return jsonResponse({ error: "Groq API returned an empty stream" }, 502);
    }

    return new Response(groqResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        ...securityHeaders,
      },
    });
  } catch (error) {
    console.error("AI Coach route failed", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
