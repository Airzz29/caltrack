'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Atmosphere from '@/components/Atmosphere';
import { CheckCircle } from 'lucide-react';

interface NutritionPlan {
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  rationale: string;
  weekly_plan_summary: string;
}

export default function OnboardingAIPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [stage, setStage] = useState<'loading' | 'reveal' | 'error'>('loading');
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch('/api/ai/plan', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.plan) {
          setPlan(data.plan);
          setTimeout(() => setStage('reveal'), 600);
        } else {
          setStage('error');
          setError(data.error ?? 'Something went wrong');
        }
      } catch {
        setStage('error');
        setError('Something went wrong');
      }
    }
    fetchPlan();
  }, []);

  async function handleAccept() {
    if (!plan) return;
    setAccepting(true);
    try {
      const res = await fetch('/api/onboarding/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_calories: plan.daily_calories,
          daily_protein_g: plan.daily_protein_g,
          daily_carbs_g: plan.daily_carbs_g,
          daily_fat_g: plan.daily_fat_g,
          use_ai_plan: true,
        }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong');
        setAccepting(false);
      }
    } catch {
      setError('Something went wrong');
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center relative overflow-hidden px-5">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-[390px]">
        <AnimatePresence mode="wait">
          {stage === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 py-20"
            >
              <div className="relative w-20 h-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{
                    borderTopColor: 'var(--accent2)',
                    borderRightColor: 'rgba(124,110,248,0.3)',
                  }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute inset-2 rounded-full border-2 border-transparent"
                  style={{
                    borderTopColor: 'rgba(124,110,248,0.6)',
                    borderLeftColor: 'rgba(124,110,248,0.2)',
                  }}
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: 'var(--accent2)' }}
                  />
                </motion.div>
              </div>

              <div className="text-center space-y-2">
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="font-display text-lg font-bold text-primary"
                >
                  Building your plan
                </motion.p>
                <p className="text-sm text-muted">
                  Claude AI is calculating your targets
                </p>
              </div>

              {[
                'Analysing your profile…',
                'Calculating BMR + TDEE…',
                'Optimising for your goal…',
              ].map((text, i) => (
                <motion.p
                  key={text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 1.2, duration: 0.4 }}
                  className="text-[11px] text-muted flex items-center gap-2"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 1.2 + 0.3 }}
                  >
                    <CheckCircle
                      className="w-3 h-3"
                      style={{ color: 'var(--accent2)' }}
                    />
                  </motion.span>
                  {text}
                </motion.p>
              ))}
            </motion.div>
          )}

          {stage === 'reveal' && plan && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-5 py-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted mb-2">
                  Your plan is ready
                </p>
                <h2 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-primary">
                  Here are your
                  <br />
                  <span style={{ color: 'var(--accent2)' }}>
                    daily targets.
                  </span>
                </h2>
                {plan.weekly_plan_summary && (
                  <p className="text-sm text-secondary mt-2 leading-relaxed">
                    {plan.weekly_plan_summary}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  delay: 0.1,
                  type: 'spring',
                  stiffness: 250,
                }}
                className="rounded-[24px] border p-7 text-center relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent-dim) 0%, transparent 60%)',
                  borderColor: 'var(--accent-border)',
                }}
              >
                <p className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-muted mb-2">
                  Daily calories
                </p>
                <motion.p
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className="font-mono text-[64px] font-medium text-primary leading-none"
                >
                  {plan.daily_calories.toLocaleString()}
                </motion.p>
                <p className="font-mono text-sm text-muted mt-1">kcal per day</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  {
                    label: 'Protein',
                    value: plan.daily_protein_g,
                    color: 'var(--accent2)',
                  },
                  {
                    label: 'Carbs',
                    value: plan.daily_carbs_g,
                    color: 'var(--amber)',
                  },
                  {
                    label: 'Fat',
                    value: plan.daily_fat_g,
                    color: 'var(--fat-color)',
                  },
                ].map(({ label, value, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.25 + i * 0.07,
                      type: 'spring',
                      stiffness: 300,
                    }}
                    className="rounded-[18px] border p-4 text-center"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <p
                      className="font-mono text-2xl font-medium leading-none"
                      style={{ color }}
                    >
                      {value}
                    </p>
                    <p className="font-mono text-[9px] text-muted mt-1">
                      g {label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {plan.rationale && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-[18px] border px-5 py-4"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <p className="text-xs text-secondary leading-relaxed italic">
                    {plan.rationale}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex flex-col gap-3 pb-4"
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full h-14 rounded-full font-display font-bold text-base text-white disabled:opacity-50"
                  style={{
                    background: 'var(--accent)',
                    boxShadow: '0 4px 28px var(--accent-glow)',
                  }}
                >
                  {accepting ? 'Setting up…' : "Let's go →"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => router.push('/onboarding/manual')}
                  className="w-full h-12 rounded-full text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                >
                  I&apos;ll set my own targets
                </button>
              </motion.div>
            </motion.div>
          )}

          {stage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 flex flex-col items-center gap-5"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                ⚠
              </div>
              <div>
                <p className="font-display text-lg font-bold text-primary">
                  Something went wrong
                </p>
                <p className="text-sm text-muted mt-1">{error}</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setStage('loading');
                    setError('');
                    fetch('/api/ai/plan', { method: 'POST' })
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.plan) {
                          setPlan(d.plan);
                          setTimeout(() => setStage('reveal'), 600);
                        } else {
                          setStage('error');
                          setError(d.error ?? 'Try again');
                        }
                      })
                      .catch(() => {
                        setStage('error');
                        setError('Try again');
                      });
                  }}
                  className="w-full h-12 rounded-full font-bold text-sm text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/onboarding/manual')}
                  className="text-sm text-muted hover:opacity-70"
                >
                  Set targets manually instead
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
