"use client";

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { strategyService, Strategy } from '@/lib/services/strategy';
import { dashboardService } from '@/lib/services/dashboard';
import { Badge } from '@/components/ui/Badge';

import { TradeHistoryFeed } from '@/components/dashboard/TradeHistoryFeed';
import { Loader2, ArrowLeft, Square, Activity, DollarSign, BarChart3 } from 'lucide-react';


export default function StrategyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, we'd fetch specific strategy history. 
        // For MVP, we'll fetch the strategy and its current owner's snapshot
        const data = await strategyService.getStrategies();
        const found = data.find(s => s.id === id);
        if (found) {
          setStrategy(found);
          await dashboardService.getMarketPrices(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
        }

      } catch (err) {
        console.error("Fetch strategy detail failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky">
        <Loader2 className="w-16 h-16 animate-spin text-ink opacity-20" />
        <span className="mt-4 font-black uppercase text-ink/20 tracking-widest text-xl">Decompressing Core Data...</span>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky">
        <h1 className="text-4xl font-black text-ink mb-4 uppercase">Core Not Found</h1>
        <button onClick={() => router.back()} className="text-primary font-black uppercase hover:underline">Return to Base</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-ink/60 font-black uppercase tracking-widest text-sm mb-12 hover:text-ink transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Inspector</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Header & Status */}
          <div className="lg:col-span-2 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
              <div>
                <Badge className="mb-4 bg-ink text-primary border-2 border-primary shadow-[4px_4px_0_#000] uppercase tracking-widest font-black">Strategy Analyst v1.0</Badge>
                <h1 className="text-5xl md:text-7xl font-black text-ink uppercase tracking-tighter leading-none">{strategy.name}</h1>
                <p className="mt-4 font-mono text-sm text-ink/40 font-bold uppercase">UID: {strategy.id}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {strategy.is_active ? (
                  <div className="flex items-center space-x-3 bg-ink text-primary px-6 py-3 border-4 border-ink shadow-[8px_8px_0_#000] font-black uppercase tracking-widest animate-pulse">
                    <Activity size={20} />
                    <span>Executing Live</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 bg-chalk border-4 border-ink shadow-[8px_8px_0_#000] font-black uppercase tracking-widest text-ink/30">
                    <Square size={20} />
                    <span>Halted</span>
                  </div>
                )}
              </div>
            </header>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-primary border-8 border-ink p-8 shadow-[12px_12px_0_#111]">
                <div className="flex items-center space-x-3 text-ink/40 mb-2">
                  <BarChart3 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Growth ROI</span>
                </div>
                <div className="text-5xl font-black text-ink">+34.2%</div>
              </div>
              <div className="bg-chalk border-8 border-ink p-8 shadow-[12px_12px_0_#111]">
                <div className="flex items-center space-x-3 text-ink/40 mb-2">
                  <Activity size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Success Rate</span>
                </div>
                <div className="text-5xl font-black text-ink">68%</div>
              </div>
              <div className="bg-ink border-8 border-ink p-8 shadow-[12px_12px_0_#111]">
                <div className="flex items-center space-x-3 text-primary/40 mb-2">
                  <DollarSign size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total PNL</span>
                </div>
                <div className="text-5xl font-black text-primary">+$4.2k</div>
              </div>
            </div>

            {/* Source Code View (Mock) */}
            <div className="border-8 border-ink bg-[#0a0a0a] shadow-[12px_12px_0_#111] overflow-hidden">
               <div className="bg-ink p-4 border-b-4 border-ink flex justify-between items-center text-chalk/40 font-mono text-[10px] uppercase font-black">
                 <span>Source Code</span>
                 <span>Locked / AES-256</span>
               </div>
               <pre className="p-8 text-primary/60 font-mono text-xs overflow-x-auto">
                 {strategy.code}
               </pre>
            </div>
          </div>

          {/* Activity Feed Sidebar */}
          <div className="space-y-12">
            <div className="flex items-center space-x-4 border-b-8 border-ink pb-4">
              <Activity className="text-primary w-8 h-8" />
              <h2 className="text-3xl font-black text-ink uppercase tracking-tighter">Live Logs</h2>
            </div>
            
            {/* We'll use the existing TradeHistoryFeed but scoped to strategy if needed */}
            <div className="max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
              <TradeHistoryFeed trades={[]} />
              <div className="text-center py-12 border-4 border-dashed border-ink/10">
                <p className="text-ink/20 font-black uppercase tracking-widest text-xs">Awaiting System Execution...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
