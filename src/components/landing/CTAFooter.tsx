import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CTAFooter() {
  return (
    <footer className="bg-ink text-chalk py-32 px-6 text-center border-t-8 border-ink">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter text-chalk uppercase">
          Ready to prove your <span className="text-primary">strategy</span> works?
        </h2>
        
        <Link href="/signup">
          <Button variant="primary" size="lg" className="shadow-[8px_8px_0_#FF90E8] hover:shadow-[0px_0px_0_#FF90E8] hover:translate-x-2 hover:translate-y-2 transition-all duration-200 text-xl px-16 py-6 mb-8 uppercase tracking-widest font-black">
            Create Free Account
          </Button>
        </Link>
        
        <p className="text-chalk font-mono text-base mb-24 font-bold tracking-widest">
          No credit card. No real money. <span className="text-primary">Just data.</span>
        </p>

        <div className="flex items-center justify-center space-x-6 text-sm font-mono text-chalk/60 font-bold uppercase tracking-widest pt-8 border-t-2 border-chalk/20">
          <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
          <span>/</span>
          <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
          <span>/</span>
          <Link href="#" className="hover:text-primary transition-colors">GitHub</Link>
        </div>
      </div>
    </footer>
  );
}
