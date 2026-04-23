"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Copy, Loader2, Wand2 } from "lucide-react";

type RiskLevel = "low" | "medium" | "high";

interface GenerateStrategyResponse {
  code: string;
  strategyName: string;
}

interface ErrorResponse {
  error?: string;
}

export interface StrategyGeneratorProps {
  onOpenInEditor: (code: string, name: string) => void;
  className?: string;
}

interface StrategyGeneratorBridgeProps {
  className?: string;
}

const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_DESCRIPTION_LENGTH = 20;
const indicatorOptions = ["RSI", "MACD", "Bollinger Bands", "EMA", "SMA", "Volume", "ATR"];
const riskLevels: RiskLevel[] = ["low", "medium", "high"];

export function StrategyGeneratorEditorBridge({ className = "" }: StrategyGeneratorBridgeProps) {
  const router = useRouter();

  const handleOpenInEditor = (code: string, name: string) => {
    window.localStorage.setItem(
      "quantis_generated_strategy",
      JSON.stringify({ code, name })
    );
    router.push("/editor?generated=true");
  };

  return <StrategyGenerator onOpenInEditor={handleOpenInEditor} className={className} />;
}

export function StrategyGenerator({ onOpenInEditor, className = "" }: StrategyGeneratorProps) {
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("medium");
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedName, setGeneratedName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const remainingChars = MAX_DESCRIPTION_LENGTH - description.length;
  const canGenerate = description.trim().length >= MIN_DESCRIPTION_LENGTH && !loading;

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators((current) => {
      if (current.includes(indicator)) {
        return current.filter((item) => item !== indicator);
      }

      if (current.length >= 3) return current;
      return [...current, indicator];
    });
  };

  const handleGenerate = async () => {
    const prompt = description.trim();
    if (prompt.length < MIN_DESCRIPTION_LENGTH || loading) return;

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/ai/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: prompt,
          riskLevel,
          preferredIndicators: selectedIndicators,
        }),
      });

      const payload = await response.json() as GenerateStrategyResponse | ErrorResponse;
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Strategy generation failed.");
      }

      const result = payload as GenerateStrategyResponse;
      setGeneratedCode(result.code);
      setGeneratedName(result.strategyName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate a strategy right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;

    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access failed. Select the code manually and copy it.");
    }
  };

  return (
    <div className={`bg-chalk border-8 border-ink shadow-[12px_12px_0_#111] ${className}`}>
      <div className="bg-ink p-4 border-b-8 border-ink flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Wand2 className="text-primary" size={22} />
          <div>
            <h2 className="text-primary font-black uppercase tracking-widest text-sm">
              AI Strategy Generator
            </h2>
            <p className="text-chalk/40 font-mono text-[10px] uppercase tracking-widest">
              Describe your idea -&gt; get runnable Python code
            </p>
          </div>
        </div>
        <span className="sm:ml-auto w-fit bg-primary text-ink border-2 border-primary px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-[3px_3px_0_#fff]">
          Human Review Required
        </span>
      </div>

      <div className="bg-chalk p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between gap-4 mb-1">
            <label htmlFor="strategy-description" className="text-[9px] font-black uppercase tracking-widest text-ink/50">
              Describe Your Strategy
            </label>
            <span className={`font-mono text-[10px] font-black ${remainingChars < 100 ? "text-primary" : "text-ink/30"}`}>
              {remainingChars} chars left
            </span>
          </div>
          <textarea
            id="strategy-description"
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
            placeholder="e.g. Buy when RSI drops below 30 and the 24h volume spike is above average. Sell when price rises 5% from entry or RSI exceeds 70."
            className="w-full min-h-[100px] border-4 border-ink bg-white resize-none font-mono text-sm text-ink p-4 focus:outline-none focus:shadow-[5px_5px_0_#FF90E8] transition-shadow placeholder:text-ink/30"
          />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-ink/50 mb-2">
            Risk Level
          </p>
          <div className="grid grid-cols-3 gap-3">
            {riskLevels.map((level) => {
              const isActive = riskLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRiskLevel(level)}
                  aria-pressed={isActive}
                  className={`border-4 border-ink px-3 py-3 font-black uppercase tracking-widest text-xs transition-all ${
                    isActive
                      ? "bg-ink text-chalk shadow-[4px_4px_0_#FF90E8]"
                      : "bg-chalk text-ink/50 hover:bg-sky hover:text-ink hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0_#111]"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-ink/50">
              Preferred Indicators <span className="text-ink/30">(optional)</span>
            </p>
            <span className="font-mono text-[10px] font-black text-ink/30">
              {selectedIndicators.length}/3 selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {indicatorOptions.map((indicator) => {
              const isActive = selectedIndicators.includes(indicator);
              const isDisabled = !isActive && selectedIndicators.length >= 3;
              return (
                <button
                  key={indicator}
                  type="button"
                  onClick={() => toggleIndicator(indicator)}
                  disabled={isDisabled}
                  aria-pressed={isActive}
                  className={`border-2 border-ink px-3 py-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-primary text-ink shadow-[3px_3px_0_#111]"
                      : "bg-chalk text-ink/50 hover:bg-sky hover:text-ink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none shadow-[3px_3px_0_#111]"
                  }`}
                >
                  {indicator}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="bg-[#FF5C5C] border-4 border-ink p-3 text-ink font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_#111]">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full bg-primary border-4 border-ink shadow-[6px_6px_0_#111] text-ink font-black uppercase tracking-widest px-6 py-4 flex items-center justify-center gap-3 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
          {loading ? "Generating..." : "Generate Strategy"}
        </button>

        {generatedCode ? (
          <div className="pt-3">
            <div className="bg-ink p-3 text-primary font-black uppercase text-xs border-4 border-ink border-b-0 flex items-center gap-2">
              <Code2 size={16} />
              <span>{generatedName}</span>
            </div>
            <pre className="bg-[#0a0a0a] border-4 border-ink p-5 font-mono text-xs text-primary/80 overflow-x-auto max-h-[400px] overflow-y-auto shadow-[8px_8px_0_#111] whitespace-pre">
              <code>{generatedCode}</code>
            </pre>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-chalk border-4 border-ink shadow-[4px_4px_0_#111] text-ink font-black uppercase tracking-widest px-4 py-3 flex items-center justify-center gap-2 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                <Copy size={16} />
                {copied ? "Copied!" : "Copy Code"}
              </button>
              <button
                type="button"
                onClick={() => onOpenInEditor(generatedCode, generatedName)}
                className="bg-primary border-4 border-ink shadow-[4px_4px_0_#111] text-ink font-black uppercase tracking-widest px-4 py-3 flex items-center justify-center gap-2 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                <Wand2 size={16} />
                Open in Editor
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
