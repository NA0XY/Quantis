"use client";

import React, { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Code, LineChart, Shield, Trophy } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Features() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
      }
    });

    tl.from(".feat-badge", { x: -20, opacity: 0, duration: 0.4 })
      .from(".feat-title", { y: 20, opacity: 0, duration: 0.6 }, "-=0.2")
      .from(".feat-item", { 
        x: -50, 
        opacity: 0, 
        stagger: 0.15, 
        duration: 0.6,
        ease: "back.out(1.7)" 
      }, "-=0.4")
      .from(".feat-card", { 
        rotateX: -15, 
        rotateY: 15, 
        scale: 0.9, 
        opacity: 0, 
        duration: 1, 
        ease: "expo.out" 
      }, "-=0.8");
  }, { scope: container });

  const features = [
    {
      icon: <Code size={24} className="text-ink" />,
      title: "Monaco Editor",
      desc: "Full Python IDE experience with syntax highlighting and auto-complete."
    },
    {
      icon: <LineChart size={24} className="text-ink" />,
      title: "Real Market Data",
      desc: "Live Binance candles, synced directly from verified exchange endpoints."
    },
    {
      icon: <Shield size={24} className="text-ink" />,
      title: "Sandboxed Execution",
      desc: "Your code runs safely — no network, no file access, deterministic limits."
    },
    {
      icon: <Trophy size={24} className="text-ink" />,
      title: "Leaderboard",
      desc: "Compete with traders globally. Purely on verified data performance."
    }
  ];

  return (
    <section id="features" ref={container} className="relative py-32 px-6 bg-sky border-y-4 border-ink overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="2"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 items-center">
        
        {/* Left Column - Features List */}
        <div className="flex flex-col space-y-10">
          <div>
            <Badge className="feat-badge mb-4 bg-primary text-ink border-4 border-ink shadow-[4px_4px_0_#111] font-black uppercase tracking-widest px-4 py-1">System Core</Badge>
            <h2 className="feat-title text-5xl font-black text-ink uppercase tracking-tighter leading-[0.9] mt-2">
              Everything you <br/> need to <span className="text-primary italic">dominate.</span>
            </h2>
          </div>
          
          <div className="space-y-8">
            {features.map((feature, i) => (
              <div key={i} className="feat-item flex space-x-6">
                <div className="shrink-0 flex items-center justify-center w-16 h-16 bg-primary border-4 border-ink shadow-[4px_4px_0_#111]">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-ex-black text-ink text-xl uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-ink/80 font-bold mt-1 text-lg leading-snug">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Column - Code Preview */}
        <div className="feat-card">
          <Card className="p-0 overflow-hidden bg-ink text-chalk border-4 border-ink shadow-[16px_16px_0_#000] h-[520px] flex flex-col relative">
            <div className="flex items-center space-x-2 px-4 py-4 border-b-4 border-ink bg-chalk">
              <div className="w-4 h-4 rounded-none bg-red-400 border-2 border-ink shadow-[2px_2px_0_#111]" />
              <div className="w-4 h-4 rounded-none bg-yellow-400 border-2 border-ink shadow-[2px_2px_0_#111]" />
              <div className="w-4 h-4 rounded-none bg-primary border-2 border-ink shadow-[2px_2px_0_#111]" />
              <span className="font-mono text-sm font-black text-ink ml-4 uppercase tracking-widest">algo_v2_final.py</span>
            </div>
            <div className="p-8 overflow-auto font-mono text-sm leading-relaxed text-[#d4d4d4] bg-[#0d0d0d] flex-1">
              <span className="text-primary">def</span> <span className="text-white">on_data</span>(historical_data, portfolio, symbol):<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-600"># historical_data: list of last 100 close prices</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;current_price = historical_data[-<span className="text-blue-300">1</span>]<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;sma_20 = <span className="text-blue-300">sum</span>(historical_data[-<span className="text-blue-300">20</span>:]) / <span className="text-blue-300">20</span><br/>
              <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-600"># Mechanical Execution Logic</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">if</span> current_price &gt; sma_20 * <span className="text-blue-300">1.02</span>:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">return</span> (<span className="text-green-400">&apos;BUY&apos;</span>, <span className="text-blue-300">0.5</span>)  <span className="text-gray-600"># Deploy capital</span><br/>
              <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">elif</span> current_price &lt; sma_20:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">return</span> (<span className="text-red-400">&apos;SELL&apos;</span>, <span className="text-blue-300">1.0</span>) <span className="text-gray-600"># Liquidation</span><br/>
              <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">return</span> (<span className="text-yellow-400">&apos;HOLD&apos;</span>, <span className="text-blue-300">0</span>)<br/>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
