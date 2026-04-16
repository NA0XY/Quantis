"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Code2, Trophy, LogOut, Compass } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/editor', label: 'Editor', icon: Code2 },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="w-64 h-screen flex flex-col bg-chalk border-r-4 border-ink fixed left-0 top-0 z-50">
      <div className="p-6 border-b-4 border-ink flex items-center space-x-3 bg-sky">
        <div className="w-6 h-6 border-4 border-ink bg-primary shadow-[2px_2px_0_#111]" />
        <span className="font-black text-ink tracking-widest uppercase text-xl mt-1">Quantis</span>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-4 overflow-y-auto bg-chalk">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-4 px-4 py-3 font-black uppercase tracking-wider text-sm transition-all border-4 ${
                isActive 
                  ? 'bg-primary text-ink border-ink shadow-[4px_4px_0_#111] translate-x-1' 
                  : 'bg-chalk text-ink border-transparent hover:border-ink hover:shadow-[4px_4px_0_#111] hover:bg-sky hover:translate-x-1'
              }`}
            >
              <Icon size={20} className={isActive ? "text-ink" : "text-ink/60"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t-4 border-ink bg-sky">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 bg-primary border-4 border-ink shadow-[2px_2px_0_#111] flex items-center justify-center font-black text-ink text-xl">
            U
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-black text-ink truncate uppercase tracking-widest text-sm">user123</p>
          </div>
        </div>
        <button className="flex items-center space-x-3 px-4 py-3 text-ink font-black uppercase tracking-wider bg-chalk border-4 border-ink hover:bg-primary shadow-[4px_4px_0_#111] hover:shadow-[0px_0px_0_#111] hover:translate-y-1 hover:translate-x-1 w-full transition-all text-sm">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
