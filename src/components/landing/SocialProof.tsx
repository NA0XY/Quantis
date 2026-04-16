import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function SocialProof() {
  const testimonials = [
    {
      quote: "I used to test my algos locally by downloading CSVs. Now I just write my logic and let Quantis run it 24/7. So much easier to prove it works.",
      name: "Alex M.",
      handle: "@algotrader22",
      rotate: "rotate-2"
    },
    {
      quote: "The restrictive environment is actually a blessing. It forces you to write clean, vectorized-style python without relying on heavy external libs.",
      name: "Sarah K.",
      handle: "@sarah_quants",
      rotate: "-rotate-2"
    },
    {
      quote: "Finally hit the top 10 on the leaderboard after tweaking my moving average crossover strategy for 2 weeks. The live data feed makes all the difference.",
      name: "David T.",
      handle: "@dt_trades",
      rotate: "rotate-1"
    }
  ];

  return (
    <section className="py-24 px-6 bg-sky border-b-4 border-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 flex flex-col items-center">
          <Badge className="mb-4 bg-primary text-ink border-2 border-ink shadow-[2px_2px_0_#111] font-bold uppercase tracking-widest">Community</Badge>
          <h2 className="text-5xl md:text-6xl font-black text-ink uppercase tracking-tighter">What traders are saying</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((t, i) => (
            <Card key={i} className={`flex flex-col h-full hover:rotate-0 hover:-translate-y-2 hover:shadow-[10px_10px_0_#111] transition-all duration-300 border-4 ${t.rotate}`}>
              <p className="font-medium text-ink flex-grow mb-8 text-xl leading-relaxed">
                &quot;{t.quote}&quot;
              </p>
              <div className="flex items-center space-x-4 border-t-4 border-ink pt-6">
                <div className="w-12 h-12 rounded-full bg-primary border-4 border-ink shadow-[2px_2px_0_#111] flex items-center justify-center font-black text-ink text-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-ink font-mono text-base uppercase tracking-tight">{t.name}</h4>
                  <p className="text-sm font-mono text-ink/80 font-bold">{t.handle}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
