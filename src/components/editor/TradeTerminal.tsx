import React from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';


export function TradeTerminal() {
  const logs = [
    { time: '14:20:01', type: 'info', msg: 'Strategy TrendFollower started on BTC/USDT' },
    { time: '14:21:05', type: 'buy', msg: 'BUY 0.42 BTC at $67,432.10 (SMA Crossover)' },
    { time: '14:25:31', type: 'info', msg: 'Fetching latest market data pool (50 pairs)' },
    { time: '14:30:12', type: 'sell', msg: 'SELL 0.42 BTC at $67,891.20 (Profit Target Hit)' },
    { time: '14:30:12', type: 'result', msg: 'Trade PnL: +$192.82 (0.68%)' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] overflow-hidden">
      <div className="h-10 bg-ink border-b-4 border-ink flex items-center justify-between px-4 shrink-0 relative">
        <div className="flex items-center space-x-3">
          <TerminalIcon className="w-4 h-4 text-primary" />
          <span className="text-chalk/40 text-[10px] font-black uppercase tracking-widest">Execution Logs</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#00c853]">Worker Status: Active</div>
          <div className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2 custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="flex space-x-3 group">
            <span className="text-ink/60 shrink-0">[{log.time}]</span>
            <span className={`
              ${log.type === 'buy' ? 'text-primary' : ''}
              ${log.type === 'sell' ? 'text-[#ff1744]' : ''}
              ${log.type === 'result' ? 'text-[#00c853] font-black underline' : ''}
              ${log.type === 'info' ? 'text-[#b2f2bb]/60' : ''}
            `}>
              {log.msg}
            </span>
          </div>
        ))}
      </div>
      
      <div className="h-8 border-t border-ink/30 px-4 flex items-center bg-[#0a0a0a]">
        <span className="font-mono text-xs text-chalk/50 animate-pulse">Next run in: 14m 32s</span>
      </div>
    </div>
  );
}
