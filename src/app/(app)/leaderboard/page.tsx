"use client";

import React, { useRef, useState, useEffect } from 'react';
import { RankingTable } from '@/components/leaderboard/RankingTable';
import { YourRankBanner } from '@/components/leaderboard/YourRankBanner';
import { Badge } from '@/components/ui/Badge';
import { Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { leaderboardService, LeaderboardEntry, Timeframe } from '@/lib/services/leaderboard';

gsap.registerPlugin(ScrollTrigger);

export default function LeaderboardPage() {
  const container = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLearderboard = async () => {
    setLoading(true);
    try {
      const data = await leaderboardService.getLeaderboard(timeframe);
      setRankings(data);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearderboard();
  }, [timeframe]);

  useGSAP(() => {
    if (loading) return;
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    
    tl.from(".leaderboard-title span", {
      y: 100,
      rotateZ: -5,
      opacity: 0,
      stagger: 0.1,
      duration: 1
    })
    .from(".champion-card", {
      scale: 0.8,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: "back.out(2)"
    }, "-=0.6")
    .from(".ranking-section", {
      y: 50,
      opacity: 0,
      duration: 1
    }, "-=0.4");
  }, { scope: container, dependencies: [loading] });

  const topThree = rankings.slice(0, 3);
  // Reorder for podium: 2, 1, 3
  const podium = [
    topThree[1] || null,
    topThree[0] || null,
    topThree[2] || null
  ].filter(Boolean);

  const colors = ['bg-[#b2f2bb]', 'bg-primary', 'bg-[#ffd8a8]'];

  return (
    <div ref={container} className="min-h-screen pb-64 bg-sky relative overflow-x-hidden">
      {/* Mechanical Background Patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]">
        <div className="absolute top-[10%] right-[10%] rotate-45">
          <svg width="400" height="400" viewBox="0 0 100 100">
            <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M0 50 L100 50 M50 0 L50 100" stroke="currentColor" strokeWidth="0.2" />
          </svg>
        </div>
        <div className="absolute bottom-[5%] left-[5%]">
           <div className="w-96 h-96" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>
      </div>

      <div className="relative z-10 pt-8 pb-16 px-8 text-left">
        <div className="max-w-6xl mx-auto">
          <Badge className="mb-6 bg-chalk border-4 border-ink shadow-[4px_4px_0_#111] text-ink font-black uppercase tracking-[0.3em] text-sm py-2 px-6">
            Global High-Frequency Leaderboard
          </Badge>
          
          <h1 className="leaderboard-title text-6xl md:text-8xl font-black text-ink mb-8 uppercase tracking-tighter leading-[0.8] overflow-hidden">
            <span className="inline-block">The</span> <br className="md:hidden" />
            <span className="inline-block text-primary [text-shadow:6px_6px_0_#111]">Quantis</span> <br className="md:hidden" />
            <span className="inline-block underline decoration-[12px] decoration-ink underline-offset-[-8px]">Elite</span>
          </h1>

          {/* Champion Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-end min-h-[400px]">
            {!loading && podium.map((champ, i) => (
              <div 
                key={champ.id} 
                className={`champion-card relative group ${champ.rank === 1 ? 'order-first md:order-none z-20 md:-translate-y-4' : 'z-10'}`}
              >
                {/* Visual Rank Badge */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink text-chalk w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-chalk shadow-[4px_4px_0_#111] z-30">
                  {champ.rank}
                </div>
                
                <div className={`${colors[i % 3]} border-8 border-ink p-8 shadow-[12px_12px_0_#111] group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] group-hover:shadow-[16px_16px_0_#111] transition-all duration-200`}>
                  <div className="w-20 h-20 bg-chalk border-4 border-ink mx-auto mb-6 flex items-center justify-center text-4xl font-black text-ink shadow-[4px_4px_0_#111]">
                    {champ.username[0].toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-ink truncate">{champ.username}</h3>
                  <div className="flex flex-col space-y-1">
                    <span className="text-ink/60 font-mono text-xs uppercase font-black">Net Value</span>
                    <span className="text-3xl font-black text-ink">${champ.total_value.toLocaleString()}</span>
                    <div className="bg-ink text-primary inline-block px-3 py-1 font-mono font-black text-lg mt-2 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
                      {champ.roi > 0 ? '+' : ''}{champ.roi}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="col-span-3 py-20 bg-chalk/20 border-8 border-dashed border-ink flex flex-col justify-center items-center">
                <Loader2 className="w-16 h-16 animate-spin text-ink/20" />
                <span className="mt-4 font-black uppercase text-ink/20 tracking-widest text-xl">Recalculating Alpha...</span>
              </div>
            )}
          </div>

          <div className="ranking-section max-w-7xl mx-auto space-y-12 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center justify-between border-b-8 border-ink pb-8 gap-6">
              <div className="text-left">
                <h2 className="text-4xl font-black text-ink uppercase tracking-tighter">Ranking Protocol <span className="text-primary">v2.1</span></h2>
                <p className="text-ink font-bold opacity-60">Verified performance metrics synced at the edge.</p>
              </div>
              <div className="flex space-x-4">
                {(['24H', '7D', 'ALL'] as Timeframe[]).map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTimeframe(t)}
                    className={`px-6 py-2 border-4 border-ink font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_#111] transition-all hover:bg-primary active:translate-x-1 active:translate-y-1 active:shadow-none ${t === timeframe ? 'bg-primary' : 'bg-chalk'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <RankingTable rankings={rankings} loading={loading} />
          </div>
        </div>
      </div>

      <YourRankBanner isAuthenticated={true} />
    </div>
  );
}
