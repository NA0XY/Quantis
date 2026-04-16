"use client";

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorPaneProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export function CodeEditorPane({ code, onChange }: CodeEditorPaneProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 border-r-4 border-ink bg-[#111]">
      <div className="h-12 bg-ink flex items-center px-4 space-x-1 shrink-0">
        <div className="h-full px-6 bg-primary border-x-4 border-t-4 border-ink translate-y-[4px] relative z-10 flex items-center space-x-2">
          <span className="text-ink font-black text-xs uppercase tracking-widest">algo.py</span>
          <div className="w-2 h-2 rounded-full bg-ink" />
        </div>
        <div className="h-full px-6 bg-ink/40 text-chalk/40 flex items-center space-x-2 grayscale cursor-not-allowed">
          <span className="text-xs font-black uppercase tracking-widest">config.json</span>
        </div>
      </div>
      
      <div className="flex-1 relative border-t-4 border-ink overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-full bg-primary/5 pointer-events-none z-10 border-l border-ink/20" />
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={onChange}
          theme="vs-dark"
          options={{
            fontSize: 16,
            fontFamily: 'JetBrains Mono',
            minimap: { enabled: false },
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
