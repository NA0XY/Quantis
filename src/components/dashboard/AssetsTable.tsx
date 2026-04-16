import React from 'react';

interface AssetsTableProps {
  assets: Record<string, number>;
  prices: Record<string, number>;
}

export function AssetsTable({ assets, prices }: AssetsTableProps) {
  const assetEntries = Object.entries(assets).filter(([, qty]) => qty > 0);


  if (assetEntries.length === 0) {
    return (
      <div className="border-4 border-ink bg-chalk p-8 text-center shadow-[4px_4px_0_#111]">
        <p className="font-bold text-ink uppercase tracking-wider">Your portfolio is empty. Time to allocate capital.</p>
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
            <th className="px-6 py-4 font-black text-right">Market Cap Rank</th>
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
                <td className={`px-6 py-4 font-mono font-black text-xl text-right text-ink/20 italic`}>
                  #--
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
