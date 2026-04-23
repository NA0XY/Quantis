"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Code2,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

export interface PortfolioSnapshot {
  strategyName?: string;
  totalReturn?: string;
  sharpeRatio?: number;
  maxDrawdown?: string;
  winRate?: string;
  totalTrades?: number;
  avgProfitPerTrade?: string;
  bestTrade?: string;
  worstTrade?: string;
  period?: string;
}

interface AIStrategyCoachProps {
  portfolioData?: PortfolioSnapshot;
  defaultStrategy?: string;
  defaultStrategyName?: string;
  initialTab?: ActiveTab;
  className?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ActiveTab = "chat" | "analyze" | "recommend";

const tabs: Array<{ id: ActiveTab; label: string; Icon: typeof MessageSquare }> = [
  { id: "chat", label: "AI Coach", Icon: MessageSquare },
  { id: "analyze", label: "Analyze Strategy", Icon: Code2 },
  { id: "recommend", label: "Get Recommendations", Icon: TrendingUp },
];

async function streamGroqResponse(
  body: object,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
) {
  try {
    const response = await fetch("/api/ai/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      onError(payload?.error ?? `AI Coach request failed with status ${response.status}`);
      return;
    }

    if (!response.body) {
      onError("AI Coach returned an empty stream.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    let completed = false;
    const complete = () => {
      if (!completed) {
        completed = true;
        onDone();
      }
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (pending.trim()) {
          processSseLines(pending, onChunk, complete, onError);
        }
        complete();
        break;
      }

      pending += decoder.decode(value, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      processSseLines(lines.join("\n"), onChunk, complete, onError);
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : "Unable to reach AI Coach.");
  }
}

function processSseLines(
  chunk: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
) {
  chunk.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line.startsWith("data: ")) return;

    const data = line.slice(6);
    if (data === "[DONE]") {
      onDone();
      return;
    }

    try {
      const parsed = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) onChunk(text);
    } catch {
      onError("AI stream returned an unreadable chunk.");
    }
  });
}

function inlineFormat(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-black text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${part}-${index}`} className="px-1 bg-ink text-primary font-mono text-[11px] border border-ink">
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, index) => {
    const key = `${line}-${index}`;

    if (line.startsWith("## ")) {
      return (
        <h3 key={key} className="mt-5 first:mt-0 text-primary font-black uppercase tracking-tight text-xl">
          {inlineFormat(line.slice(3))}
        </h3>
      );
    }

    if (line.startsWith("### ")) {
      return (
        <h4 key={key} className="mt-4 text-ink/70 font-bold uppercase tracking-widest text-sm">
          {inlineFormat(line.slice(4))}
        </h4>
      );
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={key} className="ml-4 list-disc text-sm leading-relaxed font-bold text-ink/70">
          {inlineFormat(line.slice(2))}
        </li>
      );
    }

    if (/^\d+\. /.test(line)) {
      return (
        <li key={key} className="ml-4 list-decimal text-sm leading-relaxed font-bold text-ink/70">
          {inlineFormat(line.replace(/^\d+\. /, ""))}
        </li>
      );
    }

    if (!line.trim()) {
      return <div key={key} className="h-2" />;
    }

    return (
      <p key={key} className="text-sm leading-relaxed font-bold text-ink/70">
        {inlineFormat(line)}
      </p>
    );
  });
}

function StreamingDots() {
  return (
    <span className="inline-flex gap-0.5 items-center">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function AIStrategyCoach({
  portfolioData,
  defaultStrategy,
  defaultStrategyName,
  initialTab = "chat",
  className = "",
}: AIStrategyCoachProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Quantis AI Coach. Ask me anything about your trading strategies - risk management, entry/exit signals, backtesting, or optimizing your edge.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [strategy, setStrategy] = useState(defaultStrategy ?? "");
  const [analysisResult, setAnalysisResult] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [portfolioInput, setPortfolioInput] = useState("");
  const [specificConcern, setSpecificConcern] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [recommending, setRecommending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamBuffer]);

  const handleSendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || streaming) return;

    const previousMessages = messages;
    const nextUserMessage: Message = { role: "user", content: prompt };
    let assistantContent = "";

    setMessages([...previousMessages, nextUserMessage]);
    setInput("");
    setStreamBuffer("");
    setStreaming(true);

    await streamGroqResponse(
      {
        mode: "chat",
        message: prompt,
        history: previousMessages.map(({ role, content }) => ({ role, content })),
      },
      (chunk) => {
        assistantContent += chunk;
        setStreamBuffer(assistantContent);
      },
      () => {
        if (assistantContent) {
          setMessages([...previousMessages, nextUserMessage, { role: "assistant", content: assistantContent }]);
        }
        setStreamBuffer("");
        setStreaming(false);
      },
      (message) => {
        setMessages([
          ...previousMessages,
          nextUserMessage,
          { role: "assistant", content: `Error: ${message}` },
        ]);
        setStreamBuffer("");
        setStreaming(false);
      }
    );
  };

  const handleAnalyze = async () => {
    const strategyText = strategy.trim();
    if (!strategyText || analyzing) {
      setAnalysisResult("Error: Paste a strategy before requesting analysis.");
      return;
    }

    let nextResult = "";
    setAnalysisResult("");
    setAnalyzing(true);

    await streamGroqResponse(
      { mode: "analyze", strategy: strategyText },
      (chunk) => {
        nextResult += chunk;
        setAnalysisResult(nextResult);
      },
      () => setAnalyzing(false),
      (message) => {
        setAnalysisResult(`Error: ${message}`);
        setAnalyzing(false);
      }
    );
  };

  const handleRecommend = async () => {
    if (recommending) return;

    const manualMetrics = portfolioInput.trim();
    const concern = specificConcern.trim();

    if (!portfolioData && !manualMetrics && !concern) {
      setRecommendation("Error: Add metrics, backtest results, or a specific question first.");
      return;
    }

    let nextRecommendation = "";
    setRecommendation("");
    setRecommending(true);

    await streamGroqResponse(
      {
        mode: "recommend",
        portfolioData,
        message: portfolioData ? concern : [manualMetrics, concern].filter(Boolean).join("\n\n"),
      },
      (chunk) => {
        nextRecommendation += chunk;
        setRecommendation(nextRecommendation);
      },
      () => setRecommending(false),
      (message) => {
        setRecommendation(`Error: ${message}`);
        setRecommending(false);
      }
    );
  };

  return (
    <section className={`bg-chalk border-8 border-ink shadow-[12px_12px_0_#111] ${className}`}>
      <div className="bg-ink p-4 border-b-8 border-ink flex items-center gap-3">
        <Bot className="text-primary w-6 h-6" />
        <h2 className="text-primary font-black uppercase tracking-widest text-sm">AI Strategy Coach</h2>
        <span className="ml-auto hidden md:inline font-mono text-[10px] uppercase tracking-widest text-chalk/40">
          Powered by Groq / Llama 3.3 70B
        </span>
      </div>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 uppercase tracking-widest text-xs transition-all ${
                  isActive
                    ? "bg-primary border-4 border-ink shadow-[4px_4px_0_#111] text-ink font-black"
                    : "border-4 border-ink bg-chalk text-ink/50 font-black hover:bg-sky hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {activeTab === "chat" ? (
          <div className="space-y-4">
            <div ref={scrollRef} className="h-80 overflow-y-auto bg-sky border-4 border-ink p-4 space-y-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] border-4 border-ink p-4 ${
                      message.role === "user"
                        ? "bg-ink text-chalk shadow-[4px_4px_0_#FF90E8]"
                        : "bg-chalk text-ink shadow-[4px_4px_0_#111]"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="space-y-1">{renderMarkdown(message.content)}</div>
                    ) : (
                      <p className="font-bold text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {streaming ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-chalk text-ink border-4 border-ink shadow-[4px_4px_0_#111] p-4">
                    {streamBuffer ? <div className="space-y-1">{renderMarkdown(streamBuffer)}</div> : null}
                    <div className="mt-2">
                      <StreamingDots />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_96px] gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about entries, exits, drawdown, overfitting, or market selection..."
                className="min-h-24 border-4 border-ink bg-chalk p-4 text-ink font-bold resize-none focus:outline-none focus:shadow-[4px_4px_0_#FF90E8]"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={streaming || !input.trim()}
                className="flex items-center justify-center gap-2 bg-ink text-chalk border-4 border-ink shadow-[4px_4px_0_#FF90E8] px-4 py-3 font-black uppercase tracking-widest text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "analyze" ? (
          <div className="space-y-5">
            {defaultStrategy ? (
              <span className="inline-flex bg-primary border-2 border-ink text-ink px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_#111]">
                Pre-filled: {defaultStrategyName ?? "Latest active strategy"}
              </span>
            ) : null}

            <textarea
              value={strategy}
              onChange={(event) => setStrategy(event.target.value)}
              placeholder="Paste your strategy code or description here..."
              className="w-full min-h-[180px] border-4 border-ink bg-[#0a0a0a] text-primary p-5 font-mono text-sm resize-y focus:outline-none focus:shadow-[6px_6px_0_#FF90E8]"
            />

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !strategy.trim()}
              className="w-full flex items-center justify-center gap-2 bg-ink text-chalk border-4 border-ink shadow-[6px_6px_0_#FF90E8] px-5 py-4 font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={18} className="text-primary" />
              {analyzing ? "Analyzing Strategy" : "Analyze Strategy"}
            </button>

            {analysisResult ? (
              <div className="bg-chalk border-4 border-ink shadow-[8px_8px_0_#111] overflow-hidden">
                <div className="bg-ink text-primary font-black uppercase text-xs p-3 border-b-4 border-ink tracking-widest">
                  AI Analysis
                </div>
                <div className="p-6 space-y-1">{renderMarkdown(analysisResult)}</div>
              </div>
            ) : null}

            {analyzing ? (
              <div className="font-black uppercase tracking-widest text-xs text-ink/50 flex items-center gap-2">
                Streaming analysis <StreamingDots />
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "recommend" ? (
          <div className="space-y-5">
            {portfolioData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(portfolioData).map(([key, value]) => (
                    <div key={key} className="bg-chalk border-4 border-ink shadow-[4px_4px_0_#111] p-4">
                      <div className="text-[9px] font-black uppercase tracking-widest text-ink/40">
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>
                      <div className="text-xl font-black text-ink truncate">{String(value)}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-ink/40">
                  Portfolio data pre-loaded from your dashboard
                </p>
              </div>
            ) : (
              <textarea
                value={portfolioInput}
                onChange={(event) => setPortfolioInput(event.target.value)}
                placeholder="Paste your backtest results, key metrics, or describe your portfolio performance..."
                className="w-full min-h-[160px] border-4 border-ink bg-chalk p-5 font-bold text-ink resize-y focus:outline-none focus:shadow-[6px_6px_0_#FF90E8]"
              />
            )}

            <input
              value={specificConcern}
              onChange={(event) => setSpecificConcern(event.target.value)}
              placeholder="Any specific concern? (optional)"
              className="w-full border-4 border-ink bg-chalk p-4 font-bold text-ink focus:outline-none focus:shadow-[4px_4px_0_#FF90E8]"
            />

            <button
              type="button"
              onClick={handleRecommend}
              disabled={recommending}
              className="w-full flex items-center justify-center gap-2 bg-primary border-4 border-ink shadow-[6px_6px_0_#111] text-ink px-5 py-4 font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={18} />
              {recommending ? "Building Recommendations" : "Get Recommendations"}
            </button>

            {recommendation ? (
              <div className="bg-chalk border-4 border-ink shadow-[8px_8px_0_#111] overflow-hidden">
                <div className="bg-ink text-primary font-black uppercase text-xs p-3 border-b-4 border-ink tracking-widest">
                  AI Recommendations
                </div>
                <div className="p-6 space-y-1">{renderMarkdown(recommendation)}</div>
              </div>
            ) : null}

            {recommending ? (
              <div className="font-black uppercase tracking-widest text-xs text-ink/50 flex items-center gap-2">
                Streaming recommendations <StreamingDots />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
