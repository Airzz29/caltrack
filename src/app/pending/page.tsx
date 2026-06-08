'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Atmosphere from '@/components/Atmosphere';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

export default function PendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(8);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user?.status === 'approved') {
        if (data.user.onboarding_completed) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding/profile');
        }
      }
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkStatus();

    const pollInterval = setInterval(() => {
      checkStatus();
      setSecondsLeft(8);
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [checkStatus]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center relative overflow-hidden px-5 py-12">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-[390px] flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-8"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-dim), transparent)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <Clock className="w-9 h-9" style={{ color: 'var(--accent2)' }} />
          </motion.div>

          <h1 className="font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] text-primary mb-3">
            You&apos;re on
            <br />
            <span style={{ color: 'var(--accent2)' }}>the list.</span>
          </h1>
          <p className="text-sm text-secondary leading-relaxed mb-8">
            Your account is waiting for approval. We&apos;ll check automatically
            every few seconds.
          </p>

          <div
            className="rounded-[18px] border px-5 py-4 mb-6 w-full"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary">Checking status</p>
              <div className="flex items-center gap-2">
                {checking ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <RefreshCw
                      className="w-4 h-4"
                      style={{ color: 'var(--accent2)' }}
                    />
                  </motion.div>
                ) : (
                  <p className="font-mono text-xs text-muted">
                    in {secondsLeft}s
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                key={secondsLeft}
                initial={{
                  width: `${((8 - secondsLeft) / 8) * 100}%`,
                }}
                animate={{
                  width: `${((8 - secondsLeft + 1) / 8) * 100}%`,
                }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{ background: 'var(--accent2)' }}
              />
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={checkStatus}
            disabled={checking}
            className="w-full h-12 rounded-full font-bold text-sm text-white mb-3 disabled:opacity-50 transition-all"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 4px 20px var(--accent-glow)',
            }}
          >
            {checking ? 'Checking…' : 'Check now'}
          </motion.button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted mx-auto hover:opacity-70 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
