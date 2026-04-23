import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";
import { requestSchema } from "../schema";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);
const originalGroqKey = process.env.GROQ_API_KEY;
let requestId = 0;

function requestWithBody(body: unknown, headers: Record<string, string> = {}) {
  requestId += 1;

  return new Request("https://quantis.test/api/ai/coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": `198.51.100.${requestId}`,
      ...headers,
    },
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

function mockStreamingFetch() {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: {\"choices\":[{\"delta\":{\"content\":\"ok\"}}]}\n\n"));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
      { status: 200 }
    )
  );

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("POST /api/ai/coach", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GROQ_API_KEY = "test-groq-key";
    mockAuthenticatedUser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.GROQ_API_KEY = originalGroqKey;
  });

  it("returns 500 if GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;

    const response = await POST(requestWithBody({ mode: "chat", message: "hello" }) as never);

    expect(response.status).toBe(500);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "GROQ_API_KEY is not configured" });
  });

  it("returns 400 with Zod details for invalid request bodies", async () => {
    const response = await POST(requestWithBody({ mode: "chat", message: "x".repeat(4001) }) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request");
    expect(body.details.fieldErrors.message[0]).toContain("4000");
  });

  it("returns 400 if no content is provided", async () => {
    const response = await POST(requestWithBody({ mode: "chat", message: "   " }) as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "No content provided" });
  });

  it("builds chat messages with system prompt and user message", async () => {
    const fetchMock = mockStreamingFetch();

    const response = await POST(requestWithBody({ mode: "chat", message: "How do I reduce drawdown?" }) as never);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);

    expect(response.status).toBe(200);
    expect(payload.model).toBe("llama-3.3-70b-versatile");
    expect(payload.stream).toBe(true);
    expect(payload.messages).toHaveLength(2);
    expect(payload.messages[0]).toEqual(expect.objectContaining({
      role: "system",
      content: expect.stringContaining("Quantis AI Coach"),
    }));
    expect(payload.messages[1]).toEqual({ role: "user", content: "How do I reduce drawdown?" });
  });

  it("trims message input and strips null bytes before sending to Groq", async () => {
    const fetchMock = mockStreamingFetch();

    await POST(requestWithBody({ mode: "chat", message: "  Hello\u0000 coach  " }) as never);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);

    expect(payload.messages.at(-1).content).toBe("Hello coach");
  });

  it("formats analyze mode with fenced strategy code and additional context", async () => {
    const fetchMock = mockStreamingFetch();
    const strategy = "def on_candle(candle, portfolio):\n    portfolio.buy(1)";

    await POST(requestWithBody({
      mode: "analyze",
      strategy,
      message: "Focus on risk.",
    }) as never);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    const userMessage = payload.messages.at(-1).content;

    expect(payload.messages[0].content).toContain("## Strategy Overview");
    expect(userMessage).toContain("Please analyze this trading strategy:");
    expect(userMessage).toContain(`\`\`\`\n${strategy}\n\`\`\``);
    expect(userMessage).toContain("Additional context: Focus on risk.");
  });

  it("truncates strategy input to the first 200 lines for analysis", async () => {
    const fetchMock = mockStreamingFetch();
    const strategy = Array.from({ length: 201 }, (_, index) => `line-${index + 1}`).join("\n");

    await POST(requestWithBody({ mode: "analyze", strategy }) as never);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    const userMessage = payload.messages.at(-1).content;

    expect(userMessage).toContain("line-200");
    expect(userMessage).not.toContain("line-201");
    expect(userMessage).toContain("[truncated for analysis]");
  });

  it("serializes recommend portfolioData as JSON in user content", async () => {
    const fetchMock = mockStreamingFetch();

    await POST(requestWithBody({
      mode: "recommend",
      portfolioData: { totalReturn: "+12%", totalTrades: 8 },
      message: "Should I lower size?",
    }) as never);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    const userMessage = payload.messages.at(-1).content;

    expect(payload.messages[0].content).toContain("## Performance Summary");
    expect(userMessage).toContain("```json");
    expect(userMessage).toContain("\"totalTrades\": 8");
    expect(userMessage).toContain("Specific concern: Should I lower size?");
  });

  it("caps chat history at the last 10 messages", async () => {
    const fetchMock = mockStreamingFetch();
    const history = Array.from({ length: 15 }, (_, index) => ({
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: `message-${index}`,
    }));

    await POST(requestWithBody({ mode: "chat", message: "latest", history }) as never);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);

    expect(payload.messages).toHaveLength(12);
    expect(payload.messages[1].content).toBe("message-5");
    expect(payload.messages[10].content).toBe("message-14");
    expect(payload.messages[11].content).toBe("latest");
  });

  it("rate limits requests after 20 valid attempts per IP", async () => {
    const fetchMock = mockStreamingFetch();
    const headers = { "cf-connecting-ip": "203.0.113.10" };

    for (let index = 0; index < 20; index += 1) {
      const response = await POST(requestWithBody({ mode: "chat", message: `hello-${index}` }, headers) as never);
      expect(response.status).toBe(200);
    }

    const response = await POST(requestWithBody({ mode: "chat", message: "too much" }, headers) as never);

    expect(fetchMock).toHaveBeenCalledTimes(20);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "Too many requests. Please wait a moment." });
  });

  it("returns a streaming SSE response with the expected headers", async () => {
    mockStreamingFetch();

    const response = await POST(requestWithBody({ mode: "chat", message: "hello" }) as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.body).toBeInstanceOf(ReadableStream);
  });
});

describe("requestSchema", () => {
  it("defaults missing optional mode and history", () => {
    const result = requestSchema.parse({ message: "hello" });

    expect(result.mode).toBe("chat");
    expect(result.history).toEqual([]);
  });

  it("rejects history longer than 20 messages", () => {
    const result = requestSchema.safeParse({
      message: "hello",
      history: Array.from({ length: 21 }, () => ({ role: "user", content: "x" })),
    });

    expect(result.success).toBe(false);
  });
});
