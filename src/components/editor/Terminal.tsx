"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Log {
  type: 'info' | 'error' | 'success' | 'warn';
  message: string;
  timestamp: string;
}

interface TerminalProps {
  logs: string[];
  results?: {
    success: boolean;
    final_value?: number;
    trades_count?: number;
    error?: string;
    metrics?: {
      max_drawdown: number;
      win_rate: number;
      total_trades: number;
      net_profit: number;
    };
  } | null;
}

export function Terminal({ logs, results }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-ink border-4 border-ink shadow-[4px_4px_0_#111] overflow-hidden font-mono">
      {/* Terminal Header */}
      <div className="bg-ink border-b-4 border-ink px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-primary" />
          <span className="text-chalk/60 text-[10px] font-black uppercase tracking-widest">Execution_Logs_v1.0</span>
        </div>
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
      </div>

      {/* Main Terminal Output */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-1 custom-scrollbar"
      >
        {logs.length === 0 && !results && (
          <div className="text-chalk/20 text-xs italic">
            Waiting for strategy execution...
          </div>
        )}

        {logs.map((log, i) => (
          <div key={i} className="text-chalk/80 text-xs flex space-x-3">
            <span className="text-primary/40 flex-shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className="break-all">{log}</span>
          </div>
        ))}

        {results && (
          <div className={`mt-4 p-3 border-2 ${results.success ? 'border-[#00c853]/30 bg-[#00c853]/5' : 'border-red-500/30 bg-red-500/5'} rounded`}>
            {results.success ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#00c853]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-black text-sm uppercase">Strategy Executed Successfully</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[10px] text-chalk/40 uppercase">Net Profit</div>
                    <div className={`font-black text-lg ${results.metrics?.net_profit && results.metrics.net_profit >= 0 ? 'text-[#00c853]' : 'text-red-500'}`}>
                      ${results.metrics?.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-chalk/40 uppercase">Max Drawdown</div>
                    <div className="text-chalk font-black text-lg">
                      {(results.metrics?.max_drawdown ? results.metrics.max_drawdown * 100 : 0).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-chalk/40 uppercase">Win Rate</div>
                    <div className="text-chalk font-black text-lg">
                      {(results.metrics?.win_rate ? results.metrics.win_rate * 100 : 0).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-chalk/40 uppercase">Total Trades</div>
                    <div className="text-chalk font-black text-lg">{results.metrics?.total_trades}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-black text-sm uppercase">Execution Failed</span>
                </div>
                <div className="text-red-400 text-xs break-words">{results.error}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="bg-chalk/5 px-4 py-1 flex items-center justify-between text-[9px] font-bold">
        <div className="flex items-center space-x-4">
          <span className="text-primary uppercase tracking-tighter">Runtime: Python 3.12 (Pyodide)</span>
          <span className="text-chalk/30 uppercase tracking-tighter">Memory: 64MB</span>
        </div>
        <div className="flex items-center space-x-2 text-chalk/40">
          <Cpu className="w-3 h-3" />
          <span className="uppercase">Core_Active</span>
        </div>
      </div>
    </div>
  );
}
