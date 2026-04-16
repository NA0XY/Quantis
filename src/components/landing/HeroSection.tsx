"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function HeroSection() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.from(".hero-badge", { y: -20, opacity: 0, duration: 0.6 })
      .from(".hero-title span", { 
        y: 60, 
        rotateX: -45, 
        opacity: 0, 
        stagger: 0.1, 
        duration: 0.8 
      }, "-=0.4")
      .from(".hero-desc", { y: 20, opacity: 0, duration: 0.6 }, "-=0.6")
      .from(".hero-cta", { 
        y: 20,
        opacity: 0, 
        stagger: 0.15, 
        duration: 0.6,
        ease: "back.out(2)" 
      }, "-=0.4")
      .from(".dashboard-peek", {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "expo.out"
      }, "-=0.4");

    // Subtle float for patterns
    gsap.to(".bg-pattern", {
      y: 30,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.5
    });
  }, { scope: container });

  return (
    <section ref={container} className="relative min-h-screen flex flex-col items-center justify-start pt-12 px-4 bg-sky overflow-hidden">
      {/* High-Energy Background Patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#111 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
        
        <div className="absolute top-[15%] left-[5%] bg-pattern">
          <svg width="150" height="150" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="10" y="10" width="180" height="180" />
            <path d="M10 10 L190 190 M10 190 L190 10" />
            <circle cx="100" cy="100" r="40" />
          </svg>
        </div>
        
        <div className="absolute top-[40%] right-[5%] bg-pattern">
          <svg width="120" height="120" viewBox="0 0 150 150" fill="none" stroke="currentColor" strokeWidth="1">
            {[...Array(8)].map((_, i) => (
              <line key={i} x1="0" y1={i * 20} x2="150" y2={i * 20} />
            ))}
            <rect x="40" y="0" width="40" height="150" fill="currentColor" opacity="0.2" />
          </svg>
        </div>
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        <Badge className="hero-badge mb-4 bg-chalk border-4 border-ink text-ink shadow-[4px_4px_0_#111] uppercase tracking-[0.2em] font-black px-4 py-1">
          System Initialized / v0.42.0
        </Badge>
        
        <h1 className="hero-title text-6xl md:text-8xl font-black text-ink leading-[0.85] tracking-tighter mb-6 max-w-4xl uppercase overflow-hidden">
          <span className="inline-block">Your trading</span> <br/>
          <span className="inline-block text-primary [text-shadow:6px_6px_0_#000]">strategy.</span> <br/>
          <span className="inline-block underline decoration-[12px] decoration-ink underline-offset-[-12px]">Proven by data.</span>
        </h1>
        
        <p className="hero-desc text-lg md:text-xl text-ink font-bold max-w-2xl mx-auto mb-6 leading-snug">
          The only simulator with <span className="underline decoration-4 decoration-primary underline-offset-4 font-black">zero latency</span> batch execution. 
          Write Python. Scale fast. Lose nothing.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
          <Link href="/dashboard" className="hero-cta">
            <Button variant="primary" size="lg" className="shadow-[8px_8px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0_#000] text-xl uppercase font-black py-8 px-12 border-4 group">
              Start Building <span className="inline-block ml-2 group-hover:translate-x-2 transition-transform">→</span>
            </Button>
          </Link>
          <Link href="/leaderboard" className="hero-cta">
            <Button variant="secondary" size="lg" className="shadow-[8px_8px_0_#000] text-xl uppercase font-black py-8 px-12 border-4 bg-chalk hover:bg-chalk/80">
              Leaderboard
            </Button>
          </Link>
        </div>

        {/* Reintegrated Dashboard Peek with "Strategy Pulse" Content */}
        <div className="dashboard-peek w-full max-w-5xl relative">
          <div className="w-full bg-chalk border-t-8 border-l-8 border-r-8 border-ink rounded-t-[40px] shadow-[20px_0_0_#000] overflow-hidden">
            {/* Window Header */}
            <div className="w-full h-12 bg-ink flex items-center justify-between px-8">
              <div className="flex space-x-3">
                <div className="w-4 h-4 bg-red-400 border-2 border-chalk/20" />
                <div className="w-4 h-4 bg-yellow-400 border-2 border-chalk/20" />
                <div className="w-4 h-4 bg-green-400 border-2 border-chalk/20" />
              </div>
              <div className="text-chalk/40 font-mono text-[10px] uppercase font-black tracking-[0.4em]">
                Live Workspace / strategy_test_v2.py
              </div>
              <div className="w-20 h-2 bg-chalk/10" />
            </div>

            {/* Strategy Pulse Content (No longer empty) */}
            <div className="p-8 grid grid-cols-[1fr_2fr] gap-8 bg-sky/20">
              <div className="space-y-4">
                <div className="h-20 bg-primary border-4 border-ink shadow-[8px_8px_0_#000] p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-ink/40">Portfolio Value</span>
                  <span className="text-2xl font-black text-ink">$142,842.12</span>
                </div>
                <div className="h-20 bg-chalk border-4 border-ink shadow-[8px_8px_0_#000] p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-ink/40">Active Alpha</span>
                  <span className="text-2xl font-black text-[#00c853]">+14.2%</span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 h-8 bg-ink" />
                  <div className="flex-1 h-8 bg-ink/20 border-2 border-ink" />
                </div>
              </div>
              
              <div className="relative h-44 bg-[#0a0a0a] border-4 border-ink shadow-[8px_8px_0_#000] overflow-hidden">
                {/* Mock Chart Visual */}
                <div className="absolute inset-0 flex items-end px-4 pb-4 space-x-2">
                  {[40, 60, 45, 80, 55, 90, 70, 100, 85, 110].map((h, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 ${i === 9 ? 'bg-primary' : 'bg-chalk/20'} border-2 border-ink`} 
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none" />
                <div className="absolute top-4 left-4 font-mono text-[10px] text-primary font-black uppercase">Executing...</div>
              </div>
            </div>
            
            {/* Bottom Fade to blend into the fold */}
            <div className="h-10 bg-gradient-to-t from-sky to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
