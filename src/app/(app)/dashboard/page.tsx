"use client";

import React, { useEffect, useState } from 'react';
import { PortfolioSnapshot } from '@/components/dashboard/PortfolioSnapshot';
import { AssetsTable } from '@/components/dashboard/AssetsTable';
import { TradeHistoryFeed } from '@/components/dashboard/TradeHistoryFeed';
import { StrategyList } from '@/components/dashboard/StrategyList';
import { dashboardService, UserSnapshot, TradeRecord } from '@/lib/services/dashboard';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<UserSnapshot>({
    portfolio_usd: 0,
    portfolio_assets: {},
    starting_balance: 0
  });
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [activeBots, setActiveBots] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      const [newSnapshot, newTrades, newActiveBots] = await Promise.all([
        dashboardService.getUserSnapshot(),
        dashboardService.getTradeHistory(),
        dashboardService.getActiveBotsCount(),
      ]);

      if (newSnapshot) {
        setSnapshot(newSnapshot);
        // Fetch prices for held assets
        const assets = newSnapshot.portfolio_assets as Record<string, number>;
        const symbols = Object.keys(assets).filter(s => assets[s] > 0);
        if (symbols.length > 0) {
          const newPrices = await dashboardService.getMarketPrices(symbols);
          setPrices(newPrices);
        }
      }
      
      setTrades(newTrades);
      setActiveBots(newActiveBots);
    } catch (error) {
      console.error("Dashboard refresh error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrices = React.useCallback(async () => {
    if (snapshot) {
      const assets = snapshot.portfolio_assets as Record<string, number>;
      const symbols = Object.keys(assets).filter(s => assets[s] > 0);
      if (symbols.length > 0) {
        const newPrices = await dashboardService.getMarketPrices(symbols);
        setPrices(prev => ({ ...prev, ...newPrices }));
      }
    }
  }, [snapshot]);

  useEffect(() => {
    fetchData();

    // 30s Price Refresh
    const priceInterval = setInterval(refreshPrices, 30000);

    // Supabase Realtime Subscription
    const supabase = createClient();
    const tradeSubscription = supabase
      .channel('trade-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trade_history' }, () => {
        console.log("Realtime: New trade detected, refreshing dashboard...");
        fetchData();
      })
      .subscribe();

    return () => {
      clearInterval(priceInterval);
      supabase.removeChannel(tradeSubscription);
    };
  }, [fetchData, refreshPrices]);


  if (loading) {
    return (
      <div className="flex-1 p-8 lg:p-12 bg-sky flex items-center justify-center min-h-screen">
        <div className="text-2xl font-black text-ink animate-bounce uppercase tracking-tighter">
          Loading Quantis Intelligence...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 lg:p-12 bg-sky overflow-y-auto min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-6xl font-black text-ink uppercase tracking-tighter [text-shadow:4px_4px_0_#FF90E8]">
            Operations Room
          </h1>
          <p className="text-xl font-bold text-ink/70 mt-2 uppercase tracking-wide">
            Real-time Algorithmic Strategy Monitoring
          </p>
        </header>

        <PortfolioSnapshot 
          snapshot={snapshot} 
          prices={prices} 
          activeBots={activeBots} 
        />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2">
            <h2 className="font-black text-ink mb-6 text-3xl uppercase tracking-tighter italic">Portfolio Holdings</h2>
            <AssetsTable assets={snapshot.portfolio_assets} prices={prices} />
            <TradeHistoryFeed trades={trades} />
          </div>
          
          <div className="xl:col-span-1">
            <h2 className="font-black text-ink mb-6 text-3xl uppercase tracking-tighter italic">My Strategies</h2>
            <StrategyList />
          </div>
        </div>
      </div>
    </div>
  );
}
