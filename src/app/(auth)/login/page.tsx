'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(data.redirect);
      } else {
        setError(data.error ?? 'Invalid credentials');
      }
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full flex flex-col items-center"
    >
      <div className="flex flex-col items-center gap-2 mb-10">
        <div
          className="w-14 h-14 rounded-[18px] flex items-center justify-center"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
          }}
        >
          <div
            className="w-6 h-6 rounded-lg"
            style={{ background: 'var(--accent2)' }}
          />
        </div>
        <p className="font-display text-xl font-bold text-primary tracking-tight">
          CalTrack
        </p>
        <p className="text-xs text-muted">Your nutrition coach</p>
      </div>

      <div
        className="w-full rounded-[28px] p-7 space-y-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted mt-1">Sign in to your account</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9.5px] font-bold tracking-[0.16em] uppercase text-muted block">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="your_username"
            className="w-full h-12 rounded-xl px-4 text-sm text-primary outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent2)';
              e.target.style.boxShadow =
                '0 0 0 3px rgba(124,110,248,0.12)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9.5px] font-bold tracking-[0.16em] uppercase text-muted block">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="••••••••"
            className="w-full h-12 rounded-xl px-4 text-sm text-primary outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent2)';
              e.target.style.boxShadow =
                '0 0 0 3px rgba(124,110,248,0.12)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-center"
            style={{ color: 'var(--danger)' }}
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading || !username || !password}
          className="w-full h-12 rounded-full font-display font-bold text-sm text-white transition-opacity disabled:opacity-50"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 4px 24px var(--accent-glow)',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </motion.button>

        <p className="text-sm text-muted text-center">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: 'var(--accent2)' }}
          >
            Request access
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
