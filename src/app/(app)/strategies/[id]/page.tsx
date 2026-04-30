"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { strategyService, StrategyStats } from '@/lib/services/strategy';
import { createClient } from '@/lib/supabase/client';
import { MARKET_SYMBOLS } from '@/lib/trading/markets';
import {
  formatScannerMoney,
  resolveSimulationWorkerUrl,
  scanMarkets,
  toUserSafeSimulationError
} from '@/lib/trading/marketScanner';
import { Badge } from '@/components/ui/Badge';
import { Loader2, ArrowLeft, Square, Activity, DollarSign, BarChart3, Radio, Code2, Play, Bot } from 'lucide-react';

function formatUsd(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

export default function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [stats, setStats] = useState<StrategyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const autoRunKey = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await strategyService.getStrategyStats(id);
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();

    const supabase = createClient();
    const channel = supabase
      .channel(`strategy-detail-${id}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'algorithms', filter: `id=eq.${id}` },
        fetchData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_history', filter: `algorithm_id=eq.${id}` },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, id]);

  const executeLiveCycle = useCallback(async () => {
    if (!stats?.strategy.is_active) return;

    const workerUrl = resolveSimulationWorkerUrl();

    setExecuting(true);
    setExecutionLogs([
      `LIVE CYCLE: Scanning ${MARKET_SYMBOLS.length} markets for ${stats.strategy.name}.`,
      'LIVE CYCLE: Markets with real trade signals are ranked before no-trade outcomes.'
    ]);

    try {
      const { best, ranked, failures } = await scanMarkets({
        code: stats.strategy.code,
        workerUrl,
        onBatch: (from, to, total) => {
          setExecutionLogs(prev => [...prev, `SCANNER: Testing markets ${from}-${to}/${total}...`]);
        }
      });

      const topMarkets = ranked.slice(0, 5).map((market, index) => (
        `#${index + 1} ${market.symbol}: ${formatScannerMoney(market.metrics.net_profit)} PnL, ${market.metrics.total_trades} trade(s)`
      ));

      setExecutionLogs(prev => [
        ...prev,
        failures.length > 0 ? `SCANNER: ${failures.length} market(s) skipped.` : 'SCANNER: Every market responded successfully.',
        `BEST MARKET: ${best.symbol} generated ${best.trades.length} trade(s).`,
        ...topMarkets
      ]);

      if (best.trades.length === 0) {
        setExecutionLogs(prev => [
          ...prev,
          'NO TRADE: Strategy executed successfully, but none of the tracked markets triggered buy/sell conditions.'
        ]);
        return;
      }

      await strategyService.logTrades(best.trades, stats.strategy.id);
      await strategyService.updatePortfolio(best.metrics.final_balance, best.metrics.final_assets);
      setExecutionLogs(prev => [...prev, 'SUCCESS: Trades linked to this strategy and portfolio updated.']);
      await fetchData();
    } catch (err) {
      const message = toUserSafeSimulationError(err);
      setExecutionLogs(prev => [...prev, `ERROR: ${message}`]);
    } finally {
      setExecuting(false);
    }
  }, [fetchData, stats]);

  useEffect(() => {
    if (!stats?.strategy.is_active || stats.trade_count > 0 || executing) return;
    if (autoRunKey.current === stats.strategy.id) return;
    if (!stats.strategy.id) return;

    autoRunKey.current = stats.strategy.id;
    executeLiveCycle();
  }, [executeLiveCycle, executing, stats]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky">
        <Loader2 className="w-16 h-16 animate-spin text-ink opacity-20" />
        <span className="mt-4 font-black uppercase text-ink/20 tracking-widest text-xl">Syncing Strategy Telemetry...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky px-6 text-center">
        <h1 className="text-4xl font-black text-ink mb-4 uppercase">Core Not Found</h1>
        <p className="text-ink/50 font-bold mb-6">{error || 'Strategy telemetry is unavailable.'}</p>
        <button onClick={() => router.back()} className="text-primary font-black uppercase hover:underline decoration-4">Return to Base</button>
      </div>
    );
  }

  const { strategy, trades } = stats;

  return (
    <div className="min-h-screen bg-sky p-6 lg:p-10 pb-32">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-ink/60 font-black uppercase tracking-widest text-sm mb-10 hover:text-ink transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Inspector</span>
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-10">
          <main className="space-y-8 min-w-0">
            <header className="bg-chalk border-8 border-ink shadow-[12px_12px_0_#111] p-6 lg:p-8 overflow-hidden">
              <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
                <div className="min-w-0 max-w-full">
                  <Badge className="mb-5 bg-ink text-primary border-2 border-primary shadow-[4px_4px_0_#000] uppercase tracking-widest font-black">
                    Strategy Analyst v1.0
                  </Badge>
                  <h1 className="text-[clamp(3rem,7vw,4.5rem)] font-black text-ink uppercase tracking-tighter leading-none break-words">
                    {strategy.name}
                  </h1>
                  <div className="mt-5 grid gap-2 font-mono text-[11px] font-black uppercase tracking-widest text-ink/50">
                    <span className="min-w-0 break-all leading-relaxed">UID: {strategy.id}</span>
                    <span className="min-w-0 break-all leading-relaxed">Owner: {stats.username}</span>
                  </div>
                </div>

                <div className="flex w-full max-w-[300px] flex-col items-stretch gap-3 2xl:justify-self-end">
                  <div className={`flex items-center justify-center space-x-3 px-5 py-3 border-4 border-ink shadow-[6px_6px_0_#111] font-black uppercase tracking-widest ${
                    strategy.is_active ? 'bg-primary text-ink' : 'bg-sky text-ink/50'
                  }`}>
                    {strategy.is_active ? <Radio size={20} className="animate-pulse" /> : <Square size={20} />}
                    <span>{strategy.is_active ? 'Executing Live' : 'Draft / Halted'}</span>
                  </div>
                  {strategy.is_active ? (
                    <button
                      type="button"
                      onClick={executeLiveCycle}
                      disabled={executing}
                      className="flex items-center justify-center gap-2 bg-ink text-chalk border-4 border-ink px-5 py-3 shadow-[6px_6px_0_#FF90E8] font-black uppercase tracking-widest text-xs transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {executing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-chalk" />}
                      <span>{executing ? 'Scanning Markets' : 'Run Live Tick'}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary border-8 border-ink p-7 shadow-[10px_10px_0_#111] min-w-0 overflow-hidden">
                <div className="flex items-center space-x-3 text-ink/40 mb-3">
                  <BarChart3 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Growth ROI</span>
                </div>
                <div className="text-[clamp(2.1rem,4.4vw,3.25rem)] leading-none font-black text-ink tabular-nums tracking-[-0.08em] whitespace-nowrap">{stats.roi >= 0 ? '+' : ''}{stats.roi}%</div>
              </div>

              <div className="bg-chalk border-8 border-ink p-7 shadow-[10px_10px_0_#111] min-w-0 overflow-hidden">
                <div className="flex items-center space-x-3 text-ink/40 mb-3">
                  <Activity size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sell Ratio</span>
                </div>
                <div className="text-[clamp(2.1rem,4.4vw,3.25rem)] leading-none font-black text-ink tabular-nums tracking-[-0.08em] whitespace-nowrap">{stats.success_rate}%</div>
              </div>

              <div className="bg-ink border-8 border-ink p-7 shadow-[10px_10px_0_#111] min-w-0 overflow-hidden">
                <div className="flex items-center space-x-3 text-primary/40 mb-3">
                  <DollarSign size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total PNL</span>
                </div>
                <div className="text-[clamp(1.85rem,3.9vw,3.25rem)] leading-none font-black text-primary tabular-nums tracking-[-0.08em] whitespace-nowrap">{formatUsd(stats.total_pnl)}</div>
              </div>
            </section>

            <section className="border-8 border-ink bg-[#0a0a0a] shadow-[12px_12px_0_#111] overflow-hidden">
              <div className="bg-ink p-4 border-b-4 border-ink flex justify-between items-center text-chalk/40 font-mono text-[10px] uppercase font-black">
                <span className="flex items-center gap-2"><Code2 size={14} /> Source Code</span>
                <span>{strategy.is_active ? 'Live / Persisted' : 'Draft / Persisted'}</span>
              </div>
              <pre className="p-8 text-primary/70 font-mono text-xs overflow-x-auto leading-relaxed">
                {strategy.code}
              </pre>
            </section>
          </main>

          <aside className="space-y-6">
            <div className="flex items-center space-x-4 border-b-8 border-ink pb-4">
              <Activity className="text-primary w-8 h-8" />
              <h2 className="text-3xl font-black text-ink uppercase tracking-tighter">Live Logs</h2>
            </div>

            <div className="bg-primary border-4 border-ink shadow-[8px_8px_0_#111] p-5">
              <div className="flex items-center gap-3 mb-3">
                <Bot size={20} className="text-ink" />
                <span className="font-black uppercase tracking-widest text-xs text-ink">AI Strategy Coach</span>
              </div>
              <p className="text-ink/70 font-bold text-sm mb-4">
                Get AI-powered analysis and recommendations for this strategy.
              </p>
              <Link
                href={`/coach?strategyId=${strategy.id}&mode=analyze`}
                className="flex items-center justify-center gap-2 bg-ink text-chalk border-4 border-ink shadow-[4px_4px_0_#FF90E8] px-4 py-3 font-black uppercase tracking-widest text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all w-full"
              >
                <Bot size={14} />
                Analyze with AI
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-chalk border-4 border-ink p-4 shadow-[4px_4px_0_#111]">
                <div className="text-[9px] font-black uppercase text-ink/40">Trades</div>
                <div className="text-2xl font-black">{stats.trade_count}</div>
              </div>
              <div className="bg-primary border-4 border-ink p-4 shadow-[4px_4px_0_#111]">
                <div className="text-[9px] font-black uppercase text-ink/40">Buys</div>
                <div className="text-2xl font-black">{stats.buy_count}</div>
              </div>
              <div className="bg-ink border-4 border-ink p-4 shadow-[4px_4px_0_#111]">
                <div className="text-[9px] font-black uppercase text-primary/40">Sells</div>
                <div className="text-2xl font-black text-primary">{stats.sell_count}</div>
              </div>
            </div>

            {executionLogs.length > 0 ? (
              <div className="bg-ink border-4 border-ink shadow-[8px_8px_0_#111] p-5">
                <div className="flex items-center justify-between border-b-2 border-primary/30 pb-3 mb-4">
                  <span className="text-primary font-black uppercase tracking-widest text-xs">Execution Feed</span>
                  {executing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : null}
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {executionLogs.map((line, index) => (
                    <p key={`${line}-${index}`} className="font-mono text-[11px] text-chalk/70 leading-relaxed">
                      <span className="text-primary">[{String(index + 1).padStart(2, '0')}]</span> {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {trades.length === 0 ? (
              <div className="bg-chalk border-4 border-ink shadow-[8px_8px_0_#111] p-8">
                <h3 className="font-black text-2xl uppercase tracking-tighter text-ink mb-3">No linked trades yet</h3>
                <p className="font-bold text-ink/60 mb-6">
                  Live strategies now scan all tracked markets from this page. If no rows appear, the execution feed will show whether the strategy produced signals.
                </p>
                <Link href={`/editor?id=${strategy.id}`} className="inline-flex bg-primary border-4 border-ink shadow-[4px_4px_0_#111] px-5 py-3 font-black uppercase tracking-widest text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                  Open Editor
                </Link>
              </div>
            ) : (
              <div className="bg-chalk border-4 border-ink shadow-[8px_8px_0_#111] overflow-hidden">
                {trades.map((trade) => (
                  <div key={trade.id} className="border-b-4 border-ink last:border-b-0 p-5 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`border-2 border-ink px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#111] ${
                        trade.action === 'BUY' ? 'bg-primary text-ink' : 'bg-[#FF5C5C] text-chalk'
                      }`}>
                        {trade.action}
                      </span>
                      <span className="font-mono text-[10px] text-ink/40 font-black">
                        {new Date(trade.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-xl font-black text-ink">{trade.symbol}</div>
                        <div className="text-xs font-mono font-bold text-ink/50">{trade.amount.toFixed(6)} units</div>
                      </div>
                      <div className="font-mono font-black text-right">
                        <div>{formatUsd(trade.price)}</div>
                        <div className="text-xs text-ink/40">{formatUsd(trade.price * trade.amount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
