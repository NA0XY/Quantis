"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LeaderboardEntry } from '@/lib/services/leaderboard';

gsap.registerPlugin(ScrollTrigger);

export function RankingTable({ rankings }: { rankings: LeaderboardEntry[], loading?: boolean }) {

  const tableRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Simple reveal animation - avoiding complex transform properties that might hide content
    gsap.from(".ranking-row-content", {
      opacity: 0,
      y: 10,
      stagger: 0.1,
      duration: 0.4,
      ease: "power2.out",
      scrollTrigger: {
        trigger: tableRef.current,
        start: "top 95%",
      }
    });
  }, { scope: tableRef });

  return (
    <div ref={tableRef} className="w-full border-8 border-ink overflow-x-auto shadow-[20px_20px_0_#111] bg-chalk mb-32 relative">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-ink text-chalk font-mono text-sm uppercase tracking-[0.2em]">
            <th className="px-6 py-4 font-black text-center w-24 border-b-8 border-ink">Rank</th>
            <th className="px-6 py-4 font-black border-b-8 border-ink border-l-8 border-ink">Entity</th>
            <th className="px-6 py-4 font-black text-center border-b-8 border-ink border-l-8 border-ink">Status</th>
            <th className="px-6 py-4 font-black text-right border-b-8 border-ink border-l-8 border-ink">Portfolio</th>
            <th className="px-6 py-4 font-black text-right border-b-8 border-ink border-l-8 border-ink">Return</th>
            <th className="px-6 py-4 font-black text-right border-b-8 border-ink border-l-8 border-ink">Hash</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r, i) => {
            const rowBg = i % 2 === 0 ? "bg-chalk" : "bg-sky/20";
            let rankStyle = "font-black text-xl text-ink";
            
            if (r.rank === 1) rankStyle = "bg-primary border-4 border-ink shadow-[2px_2px_0_#111] mx-auto flex items-center justify-center w-10 h-10 font-black text-xl text-ink";
            else if (r.rank === 2) rankStyle = "bg-[#b2f2bb] border-4 border-ink shadow-[2px_2px_0_#111] mx-auto flex items-center justify-center w-10 h-10 font-black text-xl text-ink";
            else if (r.rank === 3) rankStyle = "bg-[#ffd8a8] border-4 border-ink shadow-[2px_2px_0_#111] mx-auto flex items-center justify-center w-10 h-10 font-black text-xl text-ink";

            
            return (
              <tr key={r.id} className={`${rowBg} transition-all hover:bg-primary/20 group`}>
                <td className="px-6 py-6 text-center border-b-8 border-ink">
                  <div className="ranking-row-content">
                    <div className={rankStyle}>{r.rank}</div>
                  </div>
                </td>
                
                <td className="px-6 py-6 border-b-8 border-ink border-l-8 border-ink">
                  <div className="ranking-row-content flex items-center space-x-4">
                    <div className="w-10 h-10 border-4 border-ink bg-chalk flex items-center justify-center font-black text-ink text-lg shadow-[2px_2px_0_#111]">
                      {r.username[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-ink text-lg uppercase tracking-tight">{r.username}</span>
                      <span className="font-mono text-[9px] text-ink/40 font-bold uppercase truncate max-w-[100px]">{r.id}</span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-6 text-center border-b-8 border-ink border-l-8 border-ink">
                  <div className="ranking-row-content">
                    {r.has_active_bot ? (
                      <div className="inline-flex items-center space-x-2 bg-ink text-primary px-3 py-1 font-black text-[10px] uppercase">
                        <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                        <span>Live</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-2 bg-chalk border-2 border-ink/20 px-3 py-1 font-black text-[10px] uppercase text-ink/30">
                        <span>Idle</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-6 font-mono font-black text-ink text-xl text-right border-b-8 border-ink border-l-8 border-ink">
                  <div className="ranking-row-content">
                    ${r.total_value.toLocaleString()}
                  </div>
                </td>

                <td className={`px-6 py-6 font-mono font-black text-2xl text-right border-b-8 border-ink border-l-8 border-ink ${r.roi >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                  <div className="ranking-row-content">
                    {r.roi > 0 ? '+' : ''}{r.roi}%
                  </div>
                </td>

                <td className="px-6 py-6 border-b-8 border-ink border-l-8 border-ink text-right">
                  <div className="ranking-row-content font-mono text-[10px] text-ink/30 uppercase">
                    {r.id.slice(0, 8)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
