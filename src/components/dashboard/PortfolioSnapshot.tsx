import React from 'react';
import { Card } from '@/components/ui/Card';
import { UserSnapshot } from '@/lib/services/dashboard';

interface PortfolioSnapshotProps {
  snapshot: UserSnapshot;
  prices: Record<string, number>;
  activeBots: number;
}

export function PortfolioSnapshot({ snapshot, prices, activeBots }: PortfolioSnapshotProps) {
  // Calculate total asset value
  const assetsValue = Object.entries(snapshot.portfolio_assets).reduce((acc, [symbol, qty]) => {
    const price = prices[symbol] || 0;
    return acc + (qty * price);
  }, 0);

  const totalValue = snapshot.portfolio_usd + assetsValue;
  const FIXED_BASE = 10000;
  const totalReturn = ((totalValue - FIXED_BASE) / FIXED_BASE) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      <Card className="border-4 bg-sky hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_#111] transition-all">
        <div className="font-mono text-4xl font-black text-ink mb-2">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm uppercase tracking-widest text-ink font-bold border-t-4 border-ink pt-2">Total Value</div>
      </Card>
      
      <Card className="border-4 bg-[#b2f2bb] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_#111] transition-all">
        <div className="font-mono text-4xl font-black text-ink mb-2">
          ${snapshot.portfolio_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm uppercase tracking-widest text-ink font-bold border-t-4 border-ink pt-2">Cash Balance</div>
      </Card>
      
      <Card className="border-4 bg-[#ffd8a8] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_#111] transition-all">
        <div className="font-mono text-4xl font-black text-ink mb-2">
          {activeBots}
        </div>
        <div className="text-sm uppercase tracking-widest text-ink font-bold border-t-4 border-ink pt-2">Active Bots</div>
      </Card>
      
      <Card className="border-4 bg-chalk hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_#111] transition-all">
        <div className={`font-mono text-5xl font-black mb-2 ${totalReturn >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'} [text-shadow:2px_2px_0_#111]`}>
          {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
        </div>
        <div className="text-sm uppercase tracking-widest text-ink font-bold border-t-4 border-ink pt-2">Total Return</div>
      </Card>
    </div>
  );
}
