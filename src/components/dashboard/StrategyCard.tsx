import React from 'react';
import { Code, Trash2, Activity, Clock } from 'lucide-react';

import Link from 'next/link';

interface StrategyCardProps {
  id: string;
  name: string;
  isActive: boolean;
  lastRun?: string;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function StrategyCard({ id, name, isActive, lastRun, onToggle, onDelete }: StrategyCardProps) {
  return (
    <div className="bg-chalk border-4 border-ink shadow-[8px_8px_0_#111] p-6 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_#111] transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-black text-ink uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-ink/40 uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            <span>Updated: {lastRun ? new Date(lastRun).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>
        <div 
          onClick={() => onToggle(id, !isActive)}
          className={`cursor-pointer px-3 py-1 border-2 border-ink font-black text-[10px] uppercase tracking-widest transition-all ${
            isActive ? 'bg-[#00c853] text-white shadow-[2px_2px_0_#111]' : 'bg-chalk text-ink/30 grayscale opacity-50'
          }`}
        >
          {isActive ? 'Live' : 'Draft'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t-2 border-ink/10">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-ink/30 uppercase mb-1">Status</span>
          <div className="flex items-center space-x-2">
            <Activity className={`w-3 h-3 ${isActive ? 'text-[#00c853] animate-pulse' : 'text-ink/20'}`} />
            <span className="text-xs font-bold uppercase">{isActive ? 'Simulating' : 'Idle'}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-ink/30 uppercase mb-1">Environment</span>
          <span className="text-xs font-bold uppercase">Simulation_V1</span>
        </div>
      </div>

      <div className="flex space-x-2 mt-auto">
        <Link 
          href={`/editor?id=${id}`}
          className="flex-1 flex items-center justify-center space-x-2 bg-ink text-chalk py-2 font-black text-xs uppercase tracking-widest border-2 border-ink hover:bg-primary hover:text-ink transition-all"
        >
          <Code className="w-4 h-4" />
          <span>Edit Script</span>
        </Link>
        <button 
          onClick={() => onDelete(id)}
          className="p-2 border-2 border-ink hover:bg-red-500 hover:text-white transition-all text-ink/40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
