'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Atmosphere from '@/components/Atmosphere';
import PillSelect from '@/components/ui/PillSelect';
import {
  ChevronLeft,
  Monitor,
  Leaf,
  Activity,
  Dumbbell,
  Zap,
  TrendingDown,
  TrendingUp,
  Target,
  User,
} from 'lucide-react';

const TOTAL_STEPS = 6;

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: 0.22,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  }),
};

export default function OnboardingProfilePage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [currentWeightKg, setCurrentWeightKg] = useState('');
  const [goalWeightKg, setGoalWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goalType, setGoalType] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = (() => {
    switch (step) {
      case 0:
        return displayName.trim().length > 0;
      case 1:
        return age.trim().length > 0;
      case 2:
        return gender !== '';
      case 3:
        return (
          heightCm !== '' &&
          currentWeightKg !== '' &&
          goalWeightKg !== ''
        );
      case 4:
        return activityLevel !== '';
      case 5:
        return goalType !== '';
      default:
        return false;
    }
  })();

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          age: parseInt(age, 10),
          gender,
          height_cm: parseFloat(heightCm),
          current_weight_kg: parseFloat(currentWeightKg),
          goal_weight_kg: parseFloat(goalWeightKg),
          activity_level: activityLevel,
          goal_type: goalType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/onboarding/ai-plan');
      } else {
        setError(data.error ?? 'Something went wrong');
        setSubmitting(false);
      }
    } catch {
      setError('Something went wrong');
      setSubmitting(false);
    }
  }

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep(step + 1);
      setError('');
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <Atmosphere />

      <div className="fixed top-0 left-0 right-0 z-20 max-w-[430px] mx-auto px-5 pt-14 pb-4">
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={goBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              opacity: step === 0 ? 0 : 1,
              pointerEvents: step === 0 ? 'none' : 'auto',
            }}
          >
            <ChevronLeft className="w-4 h-4 text-primary" />
          </motion.button>

          <div className="flex gap-1.5 flex-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 24 : 6,
                  background:
                    i <= step
                      ? 'var(--accent2)'
                      : 'rgba(255,255,255,0.15)',
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>

          <span className="font-mono text-[10px] text-muted flex-shrink-0">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-[430px] mx-auto px-5 pt-36 pb-36 min-h-screen flex flex-col">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {step === 0 && (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted mb-3">
                    Welcome
                  </p>
                  <h2 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-primary">
                    What should
                    <br />
                    <span style={{ color: 'var(--accent2)' }}>
                      we call you?
                    </span>
                  </h2>
                  <p className="text-sm text-muted mt-2">
                    This is how we&apos;ll greet you every day.
                  </p>
                </div>
                <div
                  className="rounded-[22px] border p-5"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && canContinue && goNext()
                    }
                    placeholder="Your name"
                    autoFocus
                    className="w-full bg-transparent font-display text-[28px] font-bold text-primary outline-none placeholder:text-muted/40"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted mb-3">
                    About you
                  </p>
                  <h2 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-primary">
                    How old
                    <br />
                    <span style={{ color: 'var(--accent2)' }}>are you?</span>
                  </h2>
                </div>
                <div
                  className="rounded-[22px] border p-5 flex items-baseline gap-3"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && canContinue && goNext()
                    }
                    placeholder="22"
                    autoFocus
                    className="bg-transparent font-mono text-[48px] font-medium text-primary outline-none w-32 placeholder:text-muted/40 leading-none"
                  />
                  <span className="font-mono text-lg text-muted">years old</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted mb-3">
                    About you
                  </p>
                  <h2 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-primary">
                    Your
                    <br />
                    <span style={{ color: 'var(--accent2)' }}>gender.</span>
                  </h2>
                </div>
                <PillSelect
                  layout="grid"
                  options={[
                    {
                      value: 'male',
                      label: 'Male',
                      icon: <User className="w-5 h-5" />,
                    },
                    {
                      value: 'female',
                      label: 'Female',
                      icon: <User className="w-5 h-5" />,
                    },
                    {
                      value: 'other',
                      label: 'Other',
                      icon: <User className="w-5 h-5" />,
                    },
                  ]}
                  value={gender}
                  onChange={(v) => setGender(v as string)}
                />
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted mb-3">
                    Body stats
                  </p>
                  <h2 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-primary">
                    Your
                    <br />
                    <span style={{ color: 'var(--accent2)' }}>
                      measurements.
                    </span>
                  </h2>
                  <p className="text-sm text-muted mt-2">
                    Used to calculate your exact calorie needs.
                  </p>
                </div>

                <div
                  className="rounded-[22px] border overflow-hidden"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {[
                    {
                      label: 'Height',
                      value: heightCm,
                      set: setHeightCm,
                      unit: 'cm',
                      placeholder: '175',
                    },
                    {
                      label: 'Current weight',
                      value: currentWeightKg,
                      set: setCurrentWeightKg,
                      unit: 'kg',
                      placeholder: '75',
                    },
                    {
                      label: 'Goal weight',
                      value: goalWeightKg,
                      set: setGoalWeightKg,
                      unit: 'kg',
                      placeholder: '70',
                    },
                  ].map(({ label, value, set, unit, placeholder }, i) => (
                    <div
                      key={label}
                      className="flex items-center px-5 py-4 gap-3"
                      style={{
                        borderTop:
                          i > 0 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <span className="text-sm text-secondary flex-1">
                        {label}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          placeholder={placeholder}
                          className="w-20 bg-transparent font-mono text-[17px] font-medium text-primary outline-none text-right placeholder:text-muted/40"
                        />
                        <span className="font-mono text-xs text-muted w-5">
                          {unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted mb-3">
                    Lifestyle
                  </p>
                  <h2 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-primary">
                    How active
                    <br />
                    <span style={{ color: 'var(--accent2)' }}>are you?</span>
                  </h2>
                </div>
                <PillSelect
                  layout="list"
                  options={[
                    {
                      value: 'sedentary',
                      label: 'Sedentary',
                      description: 'Desk job, little to no exercise',
                      icon: <Monitor className="w-5 h-5" />,
                    },
                    {
                      value: 'light',
                      label: 'Lightly active',
                      description: 'Light exercise 1–3 days/week',
                      icon: <Leaf className="w-5 h-5" />,
                    },
                    {
                      value: 'moderate',
                      label: 'Moderately active',
                      description: 'Gym or sport 3–4 days/week',
                      icon: <Activity className="w-5 h-5" />,
                    },
                    {
                      value: 'active',
                      label: 'Active',
                      description: 'Intense training 4–5 days/week',
                      icon: <Dumbbell className="w-5 h-5" />,
                    },
                    {
                      value: 'very_active',
                      label: 'Very active',
                      description: 'Athlete level, 6+ days/week',
                      icon: <Zap className="w-5 h-5" />,
                    },
                  ]}
                  value={activityLevel}
                  onChange={(v) => setActivityLevel(v as string)}
                />
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted mb-3">
                    Your goal
                  </p>
                  <h2 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-primary">
                    What are you
                    <br />
                    <span style={{ color: 'var(--accent2)' }}>
                      working towards?
                    </span>
                  </h2>
                </div>
                <PillSelect
                  layout="list"
                  options={[
                    {
                      value: 'lose_weight',
                      label: 'Lose weight',
                      description: 'Calorie deficit to burn fat',
                      icon: <TrendingDown className="w-5 h-5" />,
                    },
                    {
                      value: 'gain_muscle',
                      label: 'Build muscle',
                      description: 'Lean gain with strength focus',
                      icon: <Dumbbell className="w-5 h-5" />,
                    },
                    {
                      value: 'maintain',
                      label: 'Maintain weight',
                      description: 'Keep current weight, improve health',
                      icon: <Target className="w-5 h-5" />,
                    },
                    {
                      value: 'bulk',
                      label: 'Bulk up',
                      description: 'Aggressive muscle and mass gain',
                      icon: <TrendingUp className="w-5 h-5" />,
                    },
                  ]}
                  value={goalType}
                  onChange={(v) => setGoalType(v as string)}
                />
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm mt-4"
                style={{ color: 'var(--danger)' }}
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 max-w-[430px] mx-auto px-5 pb-10 pt-4"
        style={{
          background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
        }}
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={goNext}
          disabled={!canContinue || submitting}
          className="w-full h-14 rounded-full font-display font-bold text-base text-white transition-all disabled:opacity-40"
          style={{
            background: 'var(--accent)',
            boxShadow: canContinue ? '0 4px 28px var(--accent-glow)' : 'none',
          }}
        >
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {submitting
              ? 'Building your plan…'
              : step === TOTAL_STEPS - 1
                ? 'Generate my plan →'
                : 'Continue →'}
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}
