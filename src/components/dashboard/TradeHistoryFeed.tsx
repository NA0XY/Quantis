import React from 'react';
import { TradeRecord } from '@/lib/services/dashboard';

interface TradeHistoryFeedProps {
  trades: TradeRecord[];
}

export function TradeHistoryFeed({ trades }: TradeHistoryFeedProps) {
  if (trades.length === 0) {
    return (
      <div className="border-4 border-ink bg-chalk p-8 text-center shadow-[4px_4px_0_#111]">
        <p className="font-bold text-ink uppercase tracking-wider">No trades yet. Activate an algorithm in the Editor.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="font-black text-ink mb-6 text-2xl uppercase tracking-tighter">Recent Trades</h3>
      <div className="w-full border-4 border-ink overflow-auto shadow-[8px_8px_0_#111] bg-chalk max-h-[600px]">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-ink text-chalk font-mono text-sm uppercase tracking-widest sticky top-0 z-10">
              <th className="px-6 py-4 font-black">Time</th>
              <th className="px-6 py-4 font-black">Symbol</th>
              <th className="px-6 py-4 font-black">Action</th>
              <th className="px-6 py-4 font-black">Price</th>
              <th className="px-6 py-4 font-black">Amount</th>
              <th className="px-6 py-4 font-black text-right">Total USD</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => {
              const date = new Date(trade.timestamp);
              const formattedTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              const total = trade.price * trade.amount;
              
              return (
                <tr key={trade.id || i} className={`border-t-4 border-ink transition-colors ${i % 2 === 0 ? 'bg-chalk' : 'bg-sky'} hover:bg-primary/20`}>
                  <td className="px-6 py-4 font-mono text-sm font-bold text-ink/70 whitespace-nowrap">{formattedTime}</td>
                  <td className="px-6 py-4 font-black text-ink text-lg">{trade.symbol}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 border-2 border-ink text-ink text-sm font-black uppercase tracking-widest shadow-[2px_2px_0_#111] ${
                      trade.action === 'BUY' ? 'bg-primary' : 'bg-[#FF5C5C]'
                    }`}>
                      {trade.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-ink">
                    ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-ink">{trade.amount}</td>
                  <td className="px-6 py-4 font-mono font-black text-ink text-right">
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
