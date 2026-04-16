"use client";

import React from 'react';
import { Play, Save, Share2, Zap } from 'lucide-react';


interface EditorToolbarProps {
  onRun?: () => void;
  onSave?: () => void;
  onToggleLive?: () => void;
  isExecuting?: boolean;
  isActive?: boolean;
  strategyName: string;
  onNameChange: (name: string) => void;
}

export function EditorToolbar({ 
  onRun, 
  onSave,
  onToggleLive,
  isExecuting, 
  isActive,
  strategyName, 
  onNameChange 
}: EditorToolbarProps) {
  return (
    <div className="h-16 bg-chalk border-b-4 border-ink flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 border-4 border-ink shadow-[2px_2px_0_#111] flex items-center justify-center transition-colors ${isActive ? 'bg-primary' : 'bg-chalk'}`}>
            <Zap className={`w-6 h-6 text-ink ${isActive ? 'fill-ink' : ''}`} />
          </div>
          <input
            type="text"
            value={strategyName}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-transparent border-4 border-transparent hover:border-ink/10 focus:border-ink focus:bg-sky/30 px-3 py-1 font-black text-xl text-ink outline-none uppercase tracking-tight transition-all lg:w-96"
          />
        </div>

        <div className="h-8 w-1 bg-ink/10" />

        <div className="flex items-center space-x-3">
          <div className={`inline-flex items-center space-x-2 border-4 border-ink shadow-[3px_3px_0_#111] px-4 py-1.5 transition-colors ${isActive ? 'bg-primary' : 'bg-chalk'}`}>
            <div className={`w-2.5 h-2.5 rounded-full bg-ink ${isActive ? 'animate-pulse' : 'opacity-20'}`} />
            <span className="text-xs font-black text-ink uppercase tracking-widest">
              {isActive ? 'Bot Live' : 'Draft Mode'}
            </span>
          </div>
          <span className="font-mono text-sm font-black text-ink/70 uppercase">v1.2.0</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex space-x-1 mr-4 bg-sky border-4 border-ink p-1">
          <button 
            onClick={onRun}
            disabled={isExecuting}
            className="flex items-center space-x-2 bg-chalk border-4 border-ink shadow-[2px_2px_0_#111] px-4 py-1.5 font-black uppercase text-xs tracking-widest hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isExecuting ? (
              <div className="w-4 h-4 border-2 border-ink border-t-transparent animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-ink" />
            )}
            <span>{isExecuting ? 'Executing...' : 'Run Test'}</span>
          </button>
          <button 
            onClick={onToggleLive}
            className={`flex items-center space-x-2 border-4 border-ink shadow-[2px_2px_0_#111] px-4 py-1.5 font-black uppercase text-xs tracking-widest hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${
              isActive ? 'bg-[#FF5C5C] text-chalk' : 'bg-primary text-ink'
            }`}
          >
            <Zap className={`w-4 h-4 ${isActive ? 'fill-chalk' : 'fill-ink'}`} />
            <span>{isActive ? 'Stop Bot' : 'Go Live'}</span>
          </button>
        </div>

        <button 
          onClick={onSave}
          className="p-3 bg-chalk border-4 border-ink shadow-[3px_3px_0_#111] hover:bg-sky transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          <Save className="w-5 h-5 text-ink" />
        </button>
        <button className="p-3 bg-chalk border-4 border-ink shadow-[3px_3px_0_#111] hover:bg-sky transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
          <Share2 className="w-5 h-5 text-ink" />
        </button>
      </div>
    </div>
  );
}
