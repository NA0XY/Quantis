import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);
const originalGroqKey = process.env.GROQ_API_KEY;

function requestWithBody(body: unknown) {
  return new Request("https://quantis.test/api/ai/generate-strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockAuthenticatedUser() {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
  } as never);
}

function mockGroqFetch(content: string) {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      choices: [
        {
          message: {
            content,
          },
        },
      ],
    })
  );

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("POST /api/ai/generate-strategy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GROQ_API_KEY = "test-groq-key";
    mockAuthenticatedUser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.GROQ_API_KEY = originalGroqKey;
  });

  it("returns 400 for invalid request bodies", async () => {
    const response = await POST(requestWithBody({
      description: "x".repeat(1001),
      preferredIndicators: ["RSI", "MACD", "EMA", "SMA", "ATR", "Volume"],
    }) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request");
    expect(body.details.fieldErrors.description[0]).toContain("1000");
    expect(body.details.fieldErrors.preferredIndicators[0]).toContain("5");
  });

  it("returns 500 when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;

    const response = await POST(requestWithBody({
      description: "Buy pullbacks when volume confirms trend continuation.",
    }) as never);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "GROQ_API_KEY is not configured" });
  });

  it("returns 401 when the user is not authenticated", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const response = await POST(requestWithBody({
      description: "Buy RSI dips and sell into strength.",
    }) as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("builds a Groq request using the real Quantis strategy interface", async () => {
    const code = "\"\"\"Momentum strategy.\"\"\"\n\ndef on_candle(candle, portfolio):\n    portfolio['buy'](amount=0.1)";
    const fetchMock = mockGroqFetch(code);

    const response = await POST(requestWithBody({
      description: "buy strong green candles with volume and sell bearish reversals",
      riskLevel: "low",
      preferredIndicators: ["Volume", "EMA"],
    }) as never);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(payload.model).toBe("llama-3.3-70b-versatile");
    expect(payload.stream).toBe(false);
    expect(payload.temperature).toBe(0.4);
    expect(payload.messages[0].content).toContain("def on_candle(candle, portfolio):");
    expect(payload.messages[0].content).toContain("[timestamp, open, high, low, close, volume]");
    expect(payload.messages[1].content).toContain("Risk level: low");
    expect(payload.messages[1].content).toContain("Preferred technical indicators: Volume, EMA");
    expect(body).toEqual({
      code,
      strategyName: "Buy Strong Green Candles With",
    });
  });

  it("extracts text from Groq content array responses", async () => {
    const code = "\"\"\"RSI mean reversion.\"\"\"\n\ndef on_candle(candle, portfolio):\n    portfolio['sell'](amount=1.0)";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      Response.json({
        content: [{ text: code }],
      })
    ));

    const response = await POST(requestWithBody({
      description: "sell when momentum fades after an overbought move",
    }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code,
      strategyName: "Sell When Momentum Fades After",
    });
  });

  it("rejects generated code that does not implement on_candle", async () => {
    mockGroqFetch("def helper():\n    return 'not runnable'");

    const response = await POST(requestWithBody({
      description: "make a helper only strategy",
    }) as never);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: "Generated code failed safety check" });
  });

  it("rejects generated code containing dangerous operations", async () => {
    mockGroqFetch("\"\"\"Bad strategy.\"\"\"\nimport os\n\ndef on_candle(candle, portfolio):\n    portfolio['buy'](amount=1.0)");

    const response = await POST(requestWithBody({
      description: "buy every candle aggressively",
    }) as never);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: "Generated code failed safety check" });
  });
});
