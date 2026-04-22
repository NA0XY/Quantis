"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const callbackError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.push(redirectTo);
      router.refresh();
    }

    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setMagicLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Magic link sent! Check your email.');
    }

    setMagicLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above first.');
      return;
    }

    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Password reset link sent! Check your email.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-chalk px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-ink uppercase tracking-tighter">Welcome Back</h1>
          <p className="mt-4 text-ink font-mono text-lg font-bold">Sign in to your Quantis account</p>
        </div>

        <Card className="p-8 border-4 bg-sky border-ink shadow-[10px_10px_0_#111]">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleSignIn();
            }}
          >
            {error && (
              <div className="bg-[#FF5C5C] border-4 border-ink p-3 text-ink font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_#111]">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-[#b2f2bb] border-4 border-ink p-3 text-ink font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_#111]">
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-black text-ink uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-chalk border-4 border-ink text-ink font-mono focus:outline-none focus:shadow-[4px_4px_0_#FF90E8] transition-shadow placeholder:text-ink/40 font-bold"
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-chalk border-4 border-ink text-ink font-mono focus:outline-none focus:shadow-[4px_4px_0_#FF90E8] transition-shadow placeholder:text-ink/40 font-bold"
                required
              />
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-black text-ink/40 hover:text-primary uppercase tracking-widest transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-4 text-lg font-black uppercase tracking-widest shadow-[4px_4px_0_#111] hover:shadow-[0px_0px_0_#111] hover:translate-x-1 hover:translate-y-1 mt-4 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t-4 border-ink" />
              <span className="mx-4 text-ink/40 text-xs font-black uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t-4 border-ink" />
            </div>

            <Button
              type="button"
              onClick={handleMagicLink}
              disabled={magicLoading}
              className="w-full py-4 text-lg font-black uppercase tracking-widest bg-chalk text-ink border-4 border-ink shadow-[4px_4px_0_#111] hover:bg-sky hover:shadow-[0px_0px_0_#111] hover:translate-x-1 hover:translate-y-1 disabled:opacity-60"
            >
              {magicLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {magicLoading ? 'Sending...' : 'Send Magic Link'}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] bg-chalk" />}>
      <LoginForm />
    </Suspense>
  );
}
