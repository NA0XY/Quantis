"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAuthCallbackUrl } from '@/lib/auth/redirect';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    setError(null);

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAuthCallbackUrl() },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-chalk px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-ink uppercase tracking-tighter">Start Building</h1>
          <p className="mt-4 text-ink font-mono text-lg font-bold">Create your free Quantis account</p>
        </div>

        <Card className="p-8 border-4 bg-primary border-ink shadow-[10px_10px_0_#111]">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleSignUp();
            }}
          >
            {error && (
              <div className="bg-[#FF5C5C] border-4 border-ink p-3 text-ink font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_#111]">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[#b2f2bb] border-4 border-ink p-4 text-ink font-black text-sm uppercase tracking-wide shadow-[4px_4px_0_#111]">
                Account created! Check your email to confirm, then{' '}
                <Link href="/login" className="underline decoration-2">sign in</Link>.
              </div>
            )}

            {!success && (
              <>
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-black text-ink uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="algo_wizard"
                    className="w-full px-4 py-3 bg-chalk border-4 border-ink text-ink font-mono focus:outline-none focus:shadow-[4px_4px_0_#fff] transition-shadow placeholder:text-ink/40 font-bold"
                  />
                </div>

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
                    className="w-full px-4 py-3 bg-chalk border-4 border-ink text-ink font-mono focus:outline-none focus:shadow-[4px_4px_0_#fff] transition-shadow placeholder:text-ink/40 font-bold"
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
                    className="w-full px-4 py-3 bg-chalk border-4 border-ink text-ink font-mono focus:outline-none focus:shadow-[4px_4px_0_#fff] transition-shadow placeholder:text-ink/40 font-bold"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-lg font-black uppercase tracking-widest bg-ink text-chalk shadow-[4px_4px_0_#fff] hover:shadow-[0px_0px_0_#fff] hover:translate-x-1 hover:translate-y-1 mt-4 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t-4 border-ink" />
                  <span className="shrink-0 mx-4 text-ink font-black uppercase tracking-widest text-sm">OR</span>
                  <div className="flex-grow border-t-4 border-ink" />
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading}
                  className="w-full py-4 text-lg font-black uppercase tracking-widest bg-chalk text-ink border-4 border-ink shadow-[4px_4px_0_#111] hover:bg-sky hover:shadow-[0px_0px_0_#111] hover:translate-x-1 hover:translate-y-1 disabled:opacity-60"
                >
                  {googleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {googleLoading ? 'Redirecting...' : 'Sign Up with Google'}
                </Button>
              </>
            )}
          </form>
        </Card>

        <p className="text-center mt-10 text-ink font-mono font-bold">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-black uppercase tracking-wider hover:underline decoration-4 underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
