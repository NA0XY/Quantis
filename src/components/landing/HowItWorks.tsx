import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-chalk border-t-2 border-ink">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary text-ink border-2 border-ink shadow-[2px_2px_0_#111] font-bold uppercase tracking-widest">
            How it works
          </Badge>
          <h2 className="text-5xl md:text-6xl font-black text-ink uppercase tracking-tighter">
            Three steps from idea to live bot
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="flex flex-col h-full hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[10px_10px_0_#111] transition-all duration-200 border-4 bg-sky">
            <div className="font-mono text-7xl text-primary font-black mb-4 [text-shadow:4px_4px_0_#111] border-b-4 border-ink pb-4">
              01
            </div>
            <h3 className="text-2xl font-black text-ink mb-3 uppercase tracking-tight leading-none mt-2">
              Describe or write the logic
            </h3>
            <p className="text-ink font-medium leading-relaxed flex-grow text-lg">
              Start in Monaco or let the AI Strategy Generator draft code that already fits{" "}
              <code className="bg-primary px-1 py-0.5 border border-ink text-sm">on_candle(candle, portfolio)</code>.
            </p>
          </Card>

          <Card className="flex flex-col h-full hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[10px_10px_0_#111] transition-all duration-200 border-4 bg-sky">
            <div className="font-mono text-7xl text-primary font-black mb-4 [text-shadow:4px_4px_0_#111] border-b-4 border-ink pb-4">
              02
            </div>
            <h3 className="text-2xl font-black text-ink mb-3 uppercase tracking-tight leading-none mt-2">
              Coach it and scan the market
            </h3>
            <p className="text-ink font-medium leading-relaxed flex-grow text-lg">
              Use the AI Coach for critique and recommendations, then run the strategy across 41 tracked Binance USDT markets before you save.
            </p>
          </Card>

          <Card className="flex flex-col h-full hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[10px_10px_0_#111] transition-all duration-200 border-4 bg-sky">
            <div className="font-mono text-7xl text-primary font-black mb-4 [text-shadow:4px_4px_0_#111] border-b-4 border-ink pb-4">
              03
            </div>
            <h3 className="text-2xl font-black text-ink mb-3 uppercase tracking-tight leading-none mt-2">
              Go live deliberately
            </h3>
            <p className="text-ink font-medium leading-relaxed flex-grow text-lg">
              Save only the version you trust, then let the 5-minute cron loop rerun it while your simulated portfolio and leaderboard rank stay in sync.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
