"use client";

import React, { useEffect, useState } from 'react';
import { strategyService, Strategy } from '@/lib/services/strategy';
import { StrategyCard } from './StrategyCard';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

interface StrategyListProps {
  className?: string;
}

export function StrategyList({ className = "grid grid-cols-1 gap-8" }: StrategyListProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrategies = async () => {
    try {
      const data = await strategyService.getStrategies();
      setStrategies(data);
    } catch (err) {
      console.error("Failed to fetch strategies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await strategyService.toggleStrategy(id, active);
      setStrategies(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;
    
    try {
      await strategyService.deleteStrategy(id);
      setStrategies(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-chalk/5 border-4 border-dashed border-ink/20">
        <Loader2 className="w-12 h-12 text-ink/20 animate-spin mb-4" />
        <span className="text-sm font-black text-ink/20 uppercase tracking-widest">Accessing Secure Vault...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {strategies.map((s) => (
        <StrategyCard 
          key={s.id}
          id={s.id!}
          name={s.name}
          isActive={s.is_active || false}
          lastRun={s.last_run_at}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}

      {/* New Strategy CTA */}
      <Link 
        href="/editor" 
        className="flex flex-col items-center justify-center border-4 border-dashed border-ink/20 p-6 min-h-[180px] hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden"
      >
        <div className="w-12 h-12 rounded-full border-4 border-dashed border-ink/20 flex items-center justify-center mb-4 group-hover:border-primary group-hover:bg-primary transition-all shrink-0">
          <Plus className="w-6 h-6 text-ink/20 group-hover:text-ink transition-all" />
        </div>
        <span className="text-xs font-black text-ink/20 group-hover:text-ink uppercase tracking-widest text-center break-words max-w-full">
          Initialize New<br/>Algorithmic Core
        </span>
      </Link>
    </div>
  );
}
