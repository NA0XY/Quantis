import React from 'react';

interface AssetsTableProps {
  assets: Record<string, number>;
  prices: Record<string, number>;
  portfolioUsd: number;
  hasTrades: boolean;
}

export function AssetsTable({ assets, prices, portfolioUsd, hasTrades }: AssetsTableProps) {
  const assetEntries = Object.entries(assets)
    .map(([symbol, qty]) => [symbol, Number(qty)] as const)
    .filter(([, qty]) => Number.isFinite(qty) && Math.abs(qty) > 1e-10);


  if (assetEntries.length === 0) {
    return (
      <div className="border-4 border-ink bg-chalk p-8 shadow-[4px_4px_0_#111] mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-black text-ink uppercase tracking-wider">
              {hasTrades ? 'No open coin positions right now.' : 'No open coin positions yet.'}
            </p>
            <p className="font-bold text-ink/50 mt-2">
              {hasTrades
                ? 'Recent strategy runs have closed exposure back into portfolio equity.'
                : 'Run or activate a strategy to create simulated holdings.'}
            </p>
          </div>
          <div className="bg-primary border-4 border-ink px-5 py-3 shadow-[4px_4px_0_#111]">
            <div className="text-[10px] font-black uppercase tracking-widest text-ink/50">Portfolio Equity</div>
            <div className="font-mono text-2xl font-black text-ink">
              ${portfolioUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-4 border-ink overflow-hidden shadow-[8px_8px_0_#111] mb-12 bg-chalk">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-ink text-chalk font-mono text-sm uppercase tracking-widest border-b-4 border-ink">
            <th className="px-6 py-4 font-black">Symbol</th>
            <th className="px-6 py-4 font-black">Qty Held</th>
            <th className="px-6 py-4 font-black">Current Price</th>
            <th className="px-6 py-4 font-black">Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          {assetEntries.map(([symbol, qty], i) => {
            const price = prices[symbol] || 0;
            const value = qty * price;
            
            return (
              <tr key={symbol} className={`border-t-4 border-ink transition-colors hover:bg-primary/20 ${i % 2 === 0 ? 'bg-chalk' : 'bg-sky'}`}>
                <td className="px-6 py-4 font-black text-ink text-lg">{symbol}</td>
                <td className="px-6 py-4 font-mono font-bold text-ink">{qty.toLocaleString()}</td>
                <td className="px-6 py-4 font-mono font-bold text-ink">
                  {price > 0 
                    ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
                    : 'Fetching...'
                  }
                </td>
                <td className="px-6 py-4 font-mono font-black text-ink text-lg">
                  {value > 0 
                    ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '-'
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
