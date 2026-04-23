import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function SocialProof() {
  const proofPoints = [
    {
      quote: "Generate a first pass from plain English, then open the code directly in the editor as a review-only draft.",
      name: "AI Strategy Generator",
      handle: "Natural language -> runnable Python",
      rotate: "rotate-2",
    },
    {
      quote: "Use the Groq-powered coach to chat, analyze code, and request concrete portfolio recommendations while you iterate.",
      name: "AI Strategy Coach",
      handle: "Streaming chat, analyze, recommend",
      rotate: "-rotate-2",
    },
    {
      quote: "Scan 41 tracked USDT markets, inspect the best result, and only then decide whether the 5-minute cron loop should run it live.",
      name: "Execution Loop",
      handle: "Review first, then activate",
      rotate: "rotate-1",
    },
  ];

  return (
    <section className="py-24 px-6 bg-sky border-b-4 border-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 flex flex-col items-center">
          <Badge className="mb-4 bg-primary text-ink border-2 border-ink shadow-[2px_2px_0_#111] font-bold uppercase tracking-widest">
            Why it clicks
          </Badge>
          <h2 className="text-5xl md:text-6xl font-black text-ink uppercase tracking-tighter">
            A tighter build-test-live loop
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {proofPoints.map((item, i) => (
            <Card
              key={i}
              className={`flex flex-col h-full hover:rotate-0 hover:-translate-y-2 hover:shadow-[10px_10px_0_#111] transition-all duration-300 border-4 ${item.rotate}`}
            >
              <p className="font-medium text-ink flex-grow mb-8 text-xl leading-relaxed">
                {item.quote}
              </p>
              <div className="flex items-center space-x-4 border-t-4 border-ink pt-6">
                <div className="w-12 h-12 rounded-full bg-primary border-4 border-ink shadow-[2px_2px_0_#111] flex items-center justify-center font-black text-ink text-lg">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-ink font-mono text-base uppercase tracking-tight">
                    {item.name}
                  </h4>
                  <p className="text-sm font-mono text-ink/80 font-bold">{item.handle}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
