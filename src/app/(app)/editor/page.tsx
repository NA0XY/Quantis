"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { CodeEditorPane } from '@/components/editor/CodeEditorPane';
import { ChartPane } from '@/components/editor/ChartPane';
import { Terminal } from '@/components/editor/Terminal';
import { strategyService } from '@/lib/services/strategy';
import { useSearchParams } from 'next/navigation';

const DEFAULT_STRATEGY = `# Quantis High-Frequency Strategy v2.1

def on_candle(candle, portfolio):
    # candle format: [timestamp, open, high, low, close, volume]
    close = float(candle[4])
    
    # Simple logic: Buy if price is below 10-period manual average
    # (Just an example placeholder)
    
    if portfolio['cash'] > 0 and close < 64000:
        print(f"Signal Detected: Price {close} < threshold. Initiating BUY.")
        portfolio['buy'](amount=1.0)
        
    elif portfolio['position'] > 0 and close > 65000:
        print(f"Profit Target Hit: Price {close} > threshold. Initiating SELL.")
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

function EditorContent() {
  const searchParams = useSearchParams();
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState("UNNAMED_STRATEGY");
  const [code, setCode] = useState(DEFAULT_STRATEGY);
  const [isExecuting, setIsExecuting] = useState(false);
  const [rawChartData, setRawChartData] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  const [isActive, setIsActive] = useState(false);

  // Load strategy from Supabase if ID exists in URL
  useEffect(() => {
    const id = searchParams.get('id');
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
        } catch (err: any) {
          setLogs(prev => [...prev, `ERROR: Failed to load strategy - ${err.message}`]);
        }
      };
      loadStrategy();
    }
  }, [searchParams]);

  const handleSave = async () => {
    try {
      setLogs(prev => [...prev, "Saving strategy to Quantis Secure Cloud..."]);
      const result = await strategyService.saveStrategy({
        id: strategyId || undefined,
        name: strategyName,
        code: code,
        is_active: isActive
      });
      setStrategyId(result.id);
      setLogs(prev => [...prev, `SUCCESS: Strategy "${strategyName}" saved!`]);
    } catch (err: any) {
      setLogs(prev => [...prev, `ERROR: Failed to save strategy - ${err.message}`]);
    }
  };

  const handleToggleLive = async () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    setLogs(prev => [...prev, nextActive ? "ACTIVATING STRATEGY: System is now tracking live trades." : "DEACTIVATING STRATEGY: System is now in Draft mode."]);
    
    if (strategyId) {
      try {
        await strategyService.saveStrategy({
          id: strategyId,
          name: strategyName,
          code: code,
          is_active: nextActive
        });
      } catch (err: any) {
        setLogs(prev => [...prev, `ERROR: Failed to update live status - ${err.message}`]);
      }
    }
  };

  const handleDataLoaded = useCallback((data: any[]) => {
    setRawChartData(data);
  }, []);

  const handleRun = async () => {
    setIsExecuting(true);
    setLogs([]);
    setBacktestResults(null);
    setMarkers([]);

    try {
      setLogs(prev => [...prev, "Initializing Simulation Engine...", "Connecting to Pyodide Worker..."]);
      
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          data: rawChartData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setLogs(prev => [...prev, ...result.logs]);
        setBacktestResults({
          success: true,
          metrics: result.metrics
        });

        // PERSISTENCE: Only log if strategy is ACTIVE
        if (isActive) {
          setLogs(prev => [...prev, "SYSTEM: Strategy is ACTIVE. Persisting results to Supabase..."]);
          await strategyService.logTrades(result.trades);
          await strategyService.updatePortfolio(
            result.metrics.final_balance,
            result.metrics.final_assets
          );
          setLogs(prev => [...prev, "SUCCESS: Ledger and Portfolio synchronized."]);
        }

        // Convert trades to chart markers
        const tradeMarkers = result.trades.map((t: any) => ({
          time: t.time / 1000,
          position: t.action === 'BUY' ? 'belowBar' : 'aboveBar',
          color: t.action === 'BUY' ? '#FF90E8' : '#fff',
          shape: t.action === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: t.action
        }));
        setMarkers(tradeMarkers);
      } else {
        setBacktestResults({
          success: false,
          error: result.error
        });
        if (result.logs) setLogs(prev => [...prev, ...result.logs]);
      }
    } catch (error: any) {
      setBacktestResults({
        success: false,
        error: "Failed to connect to simulation worker. Is wrangler running?"
      });
      setLogs(prev => [...prev, `ERROR: ${error.message}`]);
    } finally {
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
        strategyName={strategyName}
        onNameChange={setStrategyName}
      />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <CodeEditorPane code={code} onChange={(val) => setCode(val || "")} />
        <div className="w-full lg:w-[45%] h-full flex flex-col">
          <ChartPane 
            onDataLoaded={handleDataLoaded} 
            markers={markers}
          />
          <Terminal logs={logs} results={backtestResults} />
        </div>
      </div>
    </div>
  );
}
