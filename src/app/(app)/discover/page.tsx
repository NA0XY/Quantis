"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Loader2, TrendingUp, Zap, Users, ArrowUpRight } from 'lucide-react';
import { discoverService, PublicStrategy } from '@/lib/services/discover';
import Link from 'next/link';
import gsap from 'gsap';

export default function DiscoverPage() {
  const [trending, setTrending] = useState<PublicStrategy[]>([]);
  const [market, setMarket] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [strategies, marketData] = await Promise.all([
          discoverService.getTrendingStrategies(),
          discoverService.getMarketStats()
        ]);
        setTrending(strategies);
        setMarket(marketData);
      } catch (err) {
        console.error("Discover fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-sky">
        <Loader2 className="w-16 h-16 animate-spin text-ink opacity-20" />
        <span className="mt-4 font-black uppercase text-ink/20 tracking-[0.3em]">Scanning Global Nodes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <Badge className="mb-4 bg-primary text-ink border-2 border-ink shadow-[4px_4px_0_#111] uppercase tracking-widest font-black">Market Discovery</Badge>
          <h1 className="text-6xl md:text-8xl font-black text-ink uppercase tracking-tighter leading-none">
            Find the <span className="text-primary underline decoration-ink underline-offset-[-4px]">Edge.</span>
          </h1>
          <p className="mt-6 text-xl text-ink/60 font-bold max-w-2xl">Explore live strategies from the Quantis community and find high-alpha performers to study.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center space-x-4 border-b-8 border-ink pb-4">
              <TrendingUp className="text-primary w-8 h-8" />
              <h2 className="text-3xl font-black text-ink uppercase tracking-tighter">Trending Alphas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {trending.map((s) => (
                <Card key={s.id} className="p-8 border-4 border-ink shadow-[12px_12px_00_#111] hover:shadow-[16px_16px_0_#111] hover:-translate-y-1 transition-all group bg-chalk">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-sky border-4 border-ink flex items-center justify-center font-black text-ink text-xl">
                      {s.name[0]}
                    </div>
                    {s.is_active && (
                      <div className="flex items-center space-x-2 bg-ink text-primary px-3 py-1 font-black text-[10px] uppercase">
                        <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                        <span>Live</span>
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/strategies/${s.id}`} className="block">
                    <h3 className="text-2xl font-black text-ink uppercase tracking-tight group-hover:text-primary transition-colors">{s.name}</h3>
                  </Link>
                  <p className="font-mono text-xs text-ink/60 font-bold mb-6">CREATED_BY: <span className="text-ink">{s.username}</span></p>
                  
                  <div className="mt-auto border-t-4 border-ink pt-6 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Performance</span>
                      <span className="text-4xl font-black text-ink">{s.roi_all_time > 0 ? '+' : ''}{s.roi_all_time}%</span>
                    </div>
                    <Link href={`/strategies/${s.id}`}>
                      <button className="bg-primary border-4 border-ink p-2 shadow-[4px_4px_0_#111] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
                        <ArrowUpRight className="w-6 h-6 text-ink" />
                      </button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar / Market Data */}
          <div className="space-y-12">
            <div className="flex items-center space-x-4 border-b-8 border-ink pb-4">
              <Zap className="text-primary w-8 h-8" />
              <h2 className="text-3xl font-black text-ink uppercase tracking-tighter">Live Pulse</h2>
            </div>

            <div className="bg-ink p-8 shadow-[12px_12px_0_#111] space-y-6">
              {market.slice(0, 5).map((m: any) => (
                <div key={m.symbol} className="flex items-center justify-between border-b-2 border-chalk/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-chalk font-black uppercase tracking-tight text-lg">{m.symbol.replace('USDT', '')} <span className="text-chalk/40 text-xs">/ USDT</span></span>
                    <span className="text-primary font-mono text-sm">${Number(m.lastPrice).toLocaleString()}</span>
                  </div>
                  <div className={`text-right font-black font-mono ${Number(m.priceChangePercent) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                    {Number(m.priceChangePercent) > 0 ? '+' : ''}{m.priceChangePercent}%
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="bg-primary border-8 border-ink p-8 shadow-[12px_12px_0_#111]">
              <div className="flex items-center space-x-4 mb-4">
                <Users className="text-ink w-6 h-6" />
                <span className="font-black uppercase tracking-widest text-ink text-sm">Network Activity</span>
              </div>
              <div className="text-5xl font-black text-ink tracking-tighter mb-2">102.4k</div>
              <p className="text-ink/60 font-bold uppercase text-[10px] tracking-widest">Simulations Processed (24H)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
