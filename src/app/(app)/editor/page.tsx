"use client";

import React, { useState, useEffect } from 'react';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { CodeEditorPane } from '@/components/editor/CodeEditorPane';
import { ChartPane } from '@/components/editor/ChartPane';
import { Terminal } from '@/components/editor/Terminal';
import { strategyService } from '@/lib/services/strategy';
import { MARKET_SYMBOLS } from '@/lib/trading/markets';
import { formatScannerMoney, scanMarkets } from '@/lib/trading/marketScanner';
import { useRouter, useSearchParams } from 'next/navigation';
import { Time, SeriesMarker } from 'lightweight-charts';



const DEFAULT_STRATEGY = `# Quantis Momentum Scalper v3.0

def on_candle(candle, portfolio):
    # candle format: [timestamp, open, high, low, close, volume]
    open_price = float(candle[1])
    high = float(candle[2])
    low = float(candle[3])
    close = float(candle[4])
    volume = float(candle[5])
    
    candle_range = max(high - low, 0.01)
    body_strength = (close - open_price) / candle_range
    
    # Momentum entry: green candle with meaningful body and volume.
    if portfolio['cash'] > 0 and close > open_price and body_strength > 0.18 and volume > 0:
        print(f"Momentum BUY: close={close:.2f}, strength={body_strength:.2f}")
        portfolio['buy'](amount=0.5)
        
    # Exit on bearish reversal.
    elif portfolio['position'] > 0 and close < open_price and body_strength < -0.12:
        print(f"Reversal SELL: close={close:.2f}, strength={body_strength:.2f}")
        portfolio['sell'](amount=1.0)
`;

export default function EditorPage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen bg-sky flex items-center justify-center font-black uppercase tracking-widest text-ink/20 animate-pulse">
        Initializing Quantum Core...
      </div>
    }>
      <EditorContent />
    </React.Suspense>
  );
}

interface SimulationResult {
  success: boolean;
  metrics?: {
    final_balance: number;
    final_assets: Record<string, number>;
    max_drawdown: number;
    win_rate: number;
    total_trades: number;
    net_profit: number;
  };
  error?: string;
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState("UNNAMED_STRATEGY");
  const [code, setCode] = useState(DEFAULT_STRATEGY);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [logs, setLogs] = useState<string[]>([]);


  const [backtestResults, setBacktestResults] = useState<SimulationResult | null>(null);
  const [markers, setMarkers] = useState<SeriesMarker<Time>[]>([]);



  const [isActive, setIsActive] = useState(false);

  // Load strategy from Supabase if ID exists in URL
  useEffect(() => {
    const id = searchParams.get('id');
    const isNewStrategy = searchParams.get('new') === '1';

    if (id) {
      setLogs(prev => [...prev, `Loading algorithm config [${id}]...`]);
      const loadStrategy = async () => {
        try {
          const data = await strategyService.getStrategyById(id);
          
          if (data) {
            setStrategyId(data.id);
            setStrategyName(data.name);
            setCode(data.code);
            setIsActive(data.is_active);
            setLogs(prev => [...prev, `SUCCESS: Loaded "${data.name}" configuration.`]);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          setLogs(prev => [...prev, `ERROR: Failed to load strategy - ${message}`]);
        }

      };
      loadStrategy();
      return;
    }

    if (!isNewStrategy) {
      const lastStrategyId = window.localStorage.getItem('quantis:lastStrategyId');
      if (lastStrategyId) {
        router.replace(`/editor?id=${lastStrategyId}`);
      }
    }
  }, [router, searchParams]);

  const persistStrategy = async (nextActive = isActive) => {
    const result = await strategyService.saveStrategy({
      id: strategyId || undefined,
      name: strategyName.trim() || 'UNNAMED_STRATEGY',
      code: code,
      is_active: nextActive
    });

    setStrategyId(result.id);
    setStrategyName(result.name);
    setIsActive(result.is_active ?? nextActive);
    window.localStorage.setItem('quantis:lastStrategyId', result.id);

    if (!strategyId) {
      router.replace(`/editor?id=${result.id}`);
    }

    return result;
  };

  const handleSave = async () => {
    try {
      setLogs(prev => [...prev, "Saving strategy to Quantis Secure Cloud..."]);
      const result = await persistStrategy(isActive);
      setLogs(prev => [...prev, `SUCCESS: Strategy "${strategyName}" saved!`]);
      if (result.is_active) {
        setLogs(prev => [...prev, "LIVE STATE: Bot live status is persisted."]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLogs(prev => [...prev, `ERROR: Failed to save strategy - ${message}`]);
    }

  };

  const handleToggleLive = async () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    setLogs(prev => [...prev, nextActive ? "ACTIVATING STRATEGY: System is now tracking live trades." : "DEACTIVATING STRATEGY: System is now in Draft mode."]);

    try {
      const result = await persistStrategy(nextActive);
      setLogs(prev => [...prev, `SUCCESS: "${result.name}" is now ${nextActive ? 'LIVE' : 'DRAFT'} and saved to Supabase.`]);
    } catch (err: unknown) {
      setIsActive(!nextActive);
      const message = err instanceof Error ? err.message : String(err);
      setLogs(prev => [...prev, `ERROR: Failed to update live status - ${message}`]);
    }
  };

  const handleRun = async () => {
    setIsExecuting(true);
    setLogs([]);
    setBacktestResults(null);
    setMarkers([]);

    try {
      setLogs(prev => [
        ...prev,
        "Initializing Simulation Engine...",
        "Connecting to Pyodide Worker...",
        `SCANNER: Searching ${MARKET_SYMBOLS.length} tracked USDT markets for the strongest setup.`
      ]);
      
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
      if (!workerUrl) {
        setBacktestResults({
          success: false,
          error: 'NEXT_PUBLIC_WORKER_URL is not set. Run `wrangler dev --config wrangler.worker.toml` and add it to .env.local'
        });
        setLogs(prev => [...prev, 'ERROR: NEXT_PUBLIC_WORKER_URL is not configured.']);
        setIsExecuting(false);
        return;
      }

      const { best: result, ranked, failures } = await scanMarkets({
        code,
        workerUrl,
        onBatch: (from, to, total) => {
          setLogs(prev => [...prev, `SCANNER: Testing markets ${from}-${to}/${total}...`]);
        }
      });
      
      if (result.success) {
        const topMarkets = ranked.slice(0, 5).map((market, index) => (
          `#${index + 1} ${market.symbol}: ${formatScannerMoney(market.metrics.net_profit)} PnL, ${market.metrics.total_trades} trade(s)`
        ));

        setSelectedSymbol(result.symbol);
        setLogs(prev => [
          ...prev,
          failures.length > 0 ? `SCANNER: ${failures.length} market(s) skipped because Binance/worker rejected the symbol.` : "SCANNER: Every market responded successfully.",
          `BEST MARKET: ${result.symbol} won with ${formatScannerMoney(result.metrics.net_profit)} net PnL.`,
          ...topMarkets,
          ...result.logs,
          result.trades.length === 0 ? "NO SIGNAL: Strategy ran successfully, but no buy/sell conditions were met for the loaded candles." : `SIGNALS: ${result.trades.length} trade(s) generated.`
        ]);
        setBacktestResults({
          success: true,
          metrics: result.metrics
        });

        // PERSISTENCE: Only log if strategy is ACTIVE
        if (isActive) {
          let activeStrategyId = strategyId;
          if (!activeStrategyId) {
            const saved = await persistStrategy(true);
            activeStrategyId = saved.id;
          }

          setLogs(prev => [...prev, "SYSTEM: Strategy is ACTIVE. Persisting results to Supabase..."]);
          await strategyService.logTrades(result.trades, activeStrategyId);
          await strategyService.updatePortfolio(
            result.metrics.final_balance,
            result.metrics.final_assets
          );
          setLogs(prev => [...prev, "SUCCESS: Ledger and Portfolio synchronized."]);
        }

        // Convert trades to chart markers
        const tradeMarkers: SeriesMarker<Time>[] = result.trades.map((trade) => ({
          time: (trade.time > 100000000000 ? trade.time / 1000 : trade.time) as Time,
          position: trade.action === 'BUY' ? 'belowBar' : 'aboveBar',
          color: trade.action === 'BUY' ? '#FF90E8' : '#fff',
          shape: trade.action === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: trade.action
        }));
        setMarkers(tradeMarkers);

      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setBacktestResults({
        success: false,
        error: "Failed to connect to simulation worker. Is wrangler running?"
      });
      setLogs(prev => [...prev, `ERROR: ${message}`]);
    }
 finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-sky overflow-hidden">
      <EditorToolbar 
        onRun={handleRun} 
        onSave={handleSave}
        onToggleLive={handleToggleLive}
        isExecuting={isExecuting} 
        isActive={isActive}
        marketScanCount={MARKET_SYMBOLS.length}
        strategyName={strategyName}
        onNameChange={setStrategyName}
      />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <CodeEditorPane code={code} onChange={(val) => setCode(val || "")} />
        <div className="w-full lg:w-[45%] h-full flex flex-col">
          <ChartPane 
            markers={markers}
            selectedSymbol={selectedSymbol}
          />
          <Terminal logs={logs} results={backtestResults} />
        </div>
      </div>
    </div>
  );
}
