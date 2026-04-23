"use client";

import React, { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bot, LineChart, Shield, Wand2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Features() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    });

    tl.from(".feat-badge", { x: -20, opacity: 0, duration: 0.4 })
      .from(".feat-title", { y: 20, opacity: 0, duration: 0.6 }, "-=0.2")
      .from(
        ".feat-item",
        {
          x: -50,
          opacity: 0,
          stagger: 0.15,
          duration: 0.6,
          ease: "back.out(1.7)",
        },
        "-=0.4"
      )
      .from(
        ".feat-card",
        {
          rotateX: -15,
          rotateY: 15,
          scale: 0.9,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
        },
        "-=0.8"
      );
  }, { scope: container });

  const features = [
    {
      icon: <Wand2 size={24} className="text-ink" />,
      title: "AI Strategy Generator",
      desc: "Turn a plain-English idea into runnable Quantis Python and open it directly in the editor as a draft.",
    },
    {
      icon: <Bot size={24} className="text-ink" />,
      title: "Streaming AI Coach",
      desc: "Chat, analyze code, and request concrete portfolio recommendations from Groq while you iterate.",
    },
    {
      icon: <LineChart size={24} className="text-ink" />,
      title: "41-Market Scanner",
      desc: "Run one strategy across tracked Binance USDT markets, rank the best outcome, and inspect logs and markers.",
    },
    {
      icon: <Shield size={24} className="text-ink" />,
      title: "Review-First Runtime",
      desc: "Generated code is never auto-live. You review, backtest, save, and then choose whether to activate the cron loop.",
    },
  ];

  return (
    <section id="features" ref={container} className="relative py-32 px-6 bg-sky border-y-4 border-ink overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="2" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 items-center">
        <div className="flex flex-col space-y-10">
          <div>
            <Badge className="feat-badge mb-4 bg-primary text-ink border-4 border-ink shadow-[4px_4px_0_#111] font-black uppercase tracking-widest px-4 py-1">
              System Core
            </Badge>
            <h2 className="feat-title text-5xl font-black text-ink uppercase tracking-tighter leading-[0.9] mt-2">
              Everything you
              <br />
              need to <span className="text-primary italic">iterate faster.</span>
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

        <div className="feat-card">
          <Card className="p-0 overflow-hidden bg-ink text-chalk border-4 border-ink shadow-[16px_16px_0_#000] h-[520px] flex flex-col relative">
            <div className="flex items-center space-x-2 px-4 py-4 border-b-4 border-ink bg-chalk">
              <div className="w-4 h-4 rounded-none bg-red-400 border-2 border-ink shadow-[2px_2px_0_#111]" />
              <div className="w-4 h-4 rounded-none bg-yellow-400 border-2 border-ink shadow-[2px_2px_0_#111]" />
              <div className="w-4 h-4 rounded-none bg-primary border-2 border-ink shadow-[2px_2px_0_#111]" />
              <span className="font-mono text-sm font-black text-ink ml-4 uppercase tracking-widest">
                ai_quantis_signal.py
              </span>
            </div>
            <div className="p-8 overflow-auto font-mono text-sm leading-relaxed text-[#d4d4d4] bg-[#0d0d0d] flex-1">
              <span className="text-gray-600">&quot;&quot;&quot;AI drafted momentum pullback logic.&quot;&quot;&quot;</span>
              <br />
              closes = []
              <br />
              <br />
              <span className="text-primary">def</span> <span className="text-white">on_candle</span>(candle, portfolio):
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;close = <span className="text-blue-300">float</span>(candle[<span className="text-blue-300">4</span>])
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;volume = <span className="text-blue-300">float</span>(candle[<span className="text-blue-300">5</span>])
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;closes.<span className="text-white">append</span>(close)
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">if</span> <span className="text-blue-300">len</span>(closes) &lt; <span className="text-blue-300">14</span>:
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">return</span>
              <br />
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;fast = <span className="text-blue-300">sum</span>(closes[-<span className="text-blue-300">5</span>:]) / <span className="text-blue-300">5</span>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;slow = <span className="text-blue-300">sum</span>(closes[-<span className="text-blue-300">14</span>:]) / <span className="text-blue-300">14</span>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">if</span> fast &gt; slow <span className="text-primary">and</span> volume &gt; <span className="text-blue-300">0</span> <span className="text-primary">and</span> portfolio[<span className="text-green-400">&quot;cash&quot;</span>] &gt; <span className="text-blue-300">0</span>:
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;portfolio[<span className="text-green-400">&quot;buy&quot;</span>](amount=<span className="text-blue-300">0.35</span>)
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">elif</span> fast &lt; slow <span className="text-primary">and</span> portfolio[<span className="text-green-400">&quot;position&quot;</span>] &gt; <span className="text-blue-300">0</span>:
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;portfolio[<span className="text-green-400">&quot;sell&quot;</span>](amount=<span className="text-blue-300">1.0</span>)
              <br />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
