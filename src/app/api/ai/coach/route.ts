import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

type CoachMode = "chat" | "analyze" | "recommend";

interface RequestBody {
  mode?: CoachMode;
  message?: string;
  strategy?: string;
  portfolioData?: Record<string, unknown>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

const SYSTEM_PROMPTS: Record<CoachMode, string> = {
  chat: "You are Quantis AI Coach, an expert in algorithmic crypto trading. Help users understand, refine, and optimize their trading strategies. Be concise, practical, and technically precise. Use markdown for structure. Always mention risk management implications when relevant.",
  analyze: "You are a quantitative analyst specializing in crypto algorithmic trading. Analyze the provided trading strategy thoroughly. Structure your response with these exact markdown headers: ## Strategy Overview, ## Logic & Approach, ## Risk Management Assessment, ## Potential Weaknesses & Edge Cases, ## Suggested Improvements (ranked by impact), ## Verdict. Be specific, actionable, and technically rigorous.",
  recommend: "You are a portfolio performance advisor for crypto algo-trading. Given metrics, provide prioritized recommendations. Structure with: ## Performance Summary, ## Top 3 Immediate Actions, ## Parameter Optimization Suggestions, ## Risk Adjustments, ## Long-Term Strategy Evolution. Quantify every suggestion where possible.",
};

function isCoachMode(value: unknown): value is CoachMode {
  return value === "chat" || value === "analyze" || value === "recommend";
}

function buildUserContent(body: RequestBody, mode: CoachMode) {
  const message = body.message?.trim();

  if (mode === "analyze") {
    const strategy = body.strategy?.trim();
    const base = strategy ? `Please analyze this trading strategy:\n\n\`\`\`\n${strategy}\n\`\`\`` : "";
    return message ? `${base}\n\nAdditional context: ${message}`.trim() : base;
  }

  if (mode === "recommend") {
    const metrics = body.portfolioData && Object.keys(body.portfolioData).length > 0
      ? `Please provide recommendations based on these metrics:\n\n\`\`\`json\n${JSON.stringify(body.portfolioData, null, 2)}\n\`\`\``
      : "";

    return message ? `${metrics}\n\nSpecific concern: ${message}`.trim() : metrics;
  }

  return message ?? "";
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json() as RequestBody;
    const mode = isCoachMode(body.mode) ? body.mode : "chat";
    const userContent = buildUserContent(body, mode);

    if (!userContent.trim()) {
      return Response.json({ error: "No content provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPTS[mode] },
      ...(body.history ?? []).slice(-10),
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
        { status: groqResponse.status }
      );
    }

    if (!groqResponse.body) {
      return Response.json({ error: "Groq API returned an empty stream" }, { status: 502 });
    }

    return new Response(groqResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("AI Coach route failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
