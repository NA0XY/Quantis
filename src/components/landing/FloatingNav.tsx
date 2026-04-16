"use client";

import React, { useRef } from 'react';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function FloatingNav() {
  const container = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Entrance Animation
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });
    
    tl.from(".nav-bar", {
      y: -100,
      duration: 0.8,
      delay: 0.2
    })
    .from(".nav-item", {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.4
    }, "-=0.4");

    // Continuous Ticker Animation
    gsap.to(tickerRef.current, {
      xPercent: -50,
      duration: 20,
      ease: "none",
      repeat: -1
    });
  }, { scope: container });

  return (
    <div ref={container} className="sticky top-0 z-50 w-full">
      {/* Ticker Strip */}
      <div className="bg-ink text-primary/80 border-b-2 border-primary/20 overflow-hidden whitespace-nowrap py-1">
        <div ref={tickerRef} className="inline-block flex space-x-12 uppercase font-mono text-[10px] font-black tracking-[0.2em]">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <span>BTC/USDT 67,842.12 <span className="text-[#00c853]">+4.2%</span></span>
              <span>ETH/USDT 3,421.55 <span className="text-[#00c853]">+2.1%</span></span>
              <span>SOL/USDT 142.88 <span className="text-red-500">-1.4%</span></span>
              <span>DOGE/USDT 0.1642 <span className="text-[#00c853]">+8.4%</span></span>
              <span>PEPE/USDT 0.00000842 <span className="text-[#00c853]">+12.1%</span></span>
              <span>SHIB/USDT 0.00002714 <span className="text-red-500">-3.2%</span></span>
              <span>LINK/USDT 18.42 <span className="text-[#00c853]">+1.1%</span></span>
              <span>SYSTEM STATUS: OPERATIONAL</span>
              <span>MARKET LOAD: NOMINAL</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Nav Bar */}
      <nav className="nav-bar bg-chalk border-b-4 border-ink px-6 py-4 shadow-[0_4px_0_#000] flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="nav-item flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary border-4 border-ink shadow-[4px_4px_0_#111] group-hover:rotate-12 transition-transform duration-200" />
            <span className="font-ex-black text-ink tracking-tighter text-2xl uppercase">Quantis</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className="nav-item text-sm font-black uppercase tracking-tighter hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/discover" className="nav-item text-sm font-black uppercase tracking-tighter hover:text-primary transition-colors">Discover</Link>
            <Link href="/leaderboard" className="nav-item text-sm font-black uppercase tracking-tighter hover:text-primary transition-colors">Leaderboard</Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="nav-item text-sm font-black uppercase tracking-tighter hover:underline decoration-4 decoration-primary underline-offset-4 hidden sm:block">
            Login
          </Link>
          <Link href="/dashboard" className="nav-item">
            <Button variant="primary" size="lg" className="uppercase font-black text-sm px-8 border-4">Get Started</Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
