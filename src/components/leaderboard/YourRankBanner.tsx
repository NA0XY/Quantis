"use client";

import React, { useEffect, useState } from 'react';
import { leaderboardService, LeaderboardEntry } from '@/lib/services/leaderboard';
import Link from 'next/link';

interface YourRankBannerProps {
  isAuthenticated: boolean;
}

export function YourRankBanner({ isAuthenticated }: YourRankBannerProps) {
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchRank = async () => {
      try {
        const stats = await leaderboardService.getMyRank();
        setMyRank(stats);
      } catch (err) {
        console.error("Failed to fetch my rank:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, [isAuthenticated]);

  if (!isAuthenticated || loading || !myRank) return null;

  return (
    <div className="fixed bottom-0 left-64 right-0 bg-ink border-t-8 border-primary z-40">
      <div className="w-full px-8 pr-16 h-28 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {/* Rank Module */}
          <div className="flex flex-col flex-shrink-0">
            <span className="text-primary/70 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Global_Rank_Index</span>
            <div className="flex items-baseline space-x-2">
               <span className="text-chalk text-4xl font-black uppercase tracking-tighter">#{myRank.rank}</span>
               <span className="text-primary/40 font-mono text-[10px] font-bold">TOP {((myRank.rank || 0) / 10).toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="h-12 w-[2px] bg-chalk/10" />
 
          {/* Metrics Module */}
          <div className="flex space-x-8 xl:space-x-12">
            <div className="flex flex-col flex-shrink-0">
              <span className="text-primary/70 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Account_Equity</span>
              <span className="text-chalk text-2xl font-black font-mono tracking-tight">${myRank.total_value.toLocaleString()}</span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-primary/70 text-[10px] font-black uppercase tracking-[0.3em] mb-1">All_Time_ROI</span>
              <span className={`${myRank.roi >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'} text-2xl font-black font-mono tracking-tight`}>
                {myRank.roi > 0 ? '+' : ''}{myRank.roi}%
              </span>
            </div>
          </div>
        </div>
 
        <div className="flex items-center space-x-6 flex-shrink-0">
           <div className="hidden lg:block text-right">
              <div className="text-[9px] font-black text-primary/40 uppercase tracking-widest">ENCRYPTED_NODE</div>
              <div className="text-[9px] font-mono font-bold text-chalk/20">{myRank.id.slice(0, 12)}</div>
           </div>
          <Link href="/dashboard" className="bg-primary text-ink border-4 border-ink shadow-[4px_4px_0_#000] px-6 py-3 font-black uppercase tracking-widest text-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95 group">
            Dashboard <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
      
      {/* Bottom accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/20 to-primary" />
    </div>
  );
}
