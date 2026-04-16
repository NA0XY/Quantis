import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-chalk px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-ink uppercase tracking-tighter">Welcome Back</h1>
          <p className="mt-4 text-ink font-mono text-lg font-bold">Sign in to your Quantis account</p>
        </div>

        <Card className="p-8 border-4 bg-sky border-ink shadow-[10px_10px_0_#111]">
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-black text-ink uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-chalk border-4 border-ink text-ink font-mono focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_#FF90E8] transition-shadow placeholder:text-ink/40 font-bold"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-black text-ink uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-chalk border-4 border-ink text-ink font-mono focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_#FF90E8] transition-shadow placeholder:text-ink/40 font-bold"
                required
              />
            </div>

            <Button type="button" variant="primary" className="w-full py-4 text-lg font-black uppercase tracking-widest shadow-[4px_4px_0_#111] hover:shadow-[0px_0px_0_#111] hover:translate-x-1 hover:translate-y-1 mt-4">
              Sign In
            </Button>
            
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t-4 border-ink"></div>
              <div className="text-ink/40 text-xs font-black uppercase tracking-widest mb-1 italic">Trader&apos;s choice</div>
              <div className="flex-grow border-t-4 border-ink"></div>
            </div>
            
            <Button type="button" className="w-full py-4 text-lg font-black uppercase tracking-widest bg-chalk text-ink border-4 border-ink shadow-[4px_4px_0_#111] hover:bg-sky hover:shadow-[0px_0px_0_#111] hover:translate-x-1 hover:translate-y-1">
              Send Magic Link
            </Button>
          </form>
        </Card>

        <p className="text-center mt-10 text-ink font-mono font-bold">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-black uppercase tracking-wider hover:underline decoration-4 underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
