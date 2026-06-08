'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Flame, Settings } from 'lucide-react';
import CalorieRing from '@/components/dashboard/CalorieRing';
import MacroCard from '@/components/dashboard/MacroCard';
import WeightCard from '@/components/dashboard/WeightCard';
import SwipeToDeleteRow from '@/components/dashboard/SwipeToDeleteRow';
import { getGreeting } from '@/lib/utils';

interface Profile {
  display_name: string;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number | null;
  daily_fat_g: number | null;
  goal_weight_kg: number | null;
}

interface FoodEntry {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number | null;
  fat_g: number | null;
  source: string;
  meal_type: string | null;
}

interface WeightLog {
  log_date: string;
  weight_kg: number;
}

const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const mealEmoji: Record<string, string> = {
  Breakfast: '🍳',
  Lunch: '🥗',
  Dinner: '🍽️',
  Snack: '🍎',
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [foodRes, weightRes, meRes, streakRes] = await Promise.all([
      fetch('/api/food-log'),
      fetch('/api/weight'),
      fetch('/api/auth/me'),
      fetch('/api/streak'),
    ]);

    const foodData = await foodRes.json();
    const weightData = await weightRes.json();
    const meData = await meRes.json();
    const streakData = await streakRes.json();

    setTodayEntries(foodData.entries ?? []);
    setWeightLogs(weightData.logs ?? []);
    setProfile(meData.user?.profile ?? null);
    setStreak(streakData.streak ?? 0);
    setLoggedToday(streakData.loggedToday ?? false);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('food-logged', fetchData);
    window.addEventListener('settings-saved', fetchData);
    return () => {
      window.removeEventListener('food-logged', fetchData);
      window.removeEventListener('settings-saved', fetchData);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const totalCalories = todayEntries.reduce(
    (s, e) => s + (parseFloat(String(e.calories)) || 0),
    0
  );
  const totalProtein = todayEntries.reduce(
    (s, e) => s + (parseFloat(String(e.protein_g)) || 0),
    0
  );
  const totalCarbs = todayEntries.reduce(
    (s, e) => s + (parseFloat(String(e.carbs_g)) || 0),
    0
  );
  const totalFat = todayEntries.reduce(
    (s, e) => s + (parseFloat(String(e.fat_g)) || 0),
    0
  );

  const goals = profile ?? {
    daily_calories: 2000,
    daily_protein_g: 150,
    daily_carbs_g: 200,
    daily_fat_g: 65,
    display_name: 'there',
    goal_weight_kg: null,
  };

  const remaining = goals.daily_calories - totalCalories;
  const isOver = remaining < 0;

  const todayWeight =
    weightLogs.find((l) => {
      const d = new Date(l.log_date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })?.weight_kg ?? null;

  const yesterdayWeight =
    weightLogs[todayWeight ? 1 : 0]?.weight_kg ?? null;

  const grouped = todayEntries.reduce(
    (acc, entry) => {
      const meal = entry.meal_type
        ? entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)
        : 'Snack';
      const key = mealOrder.includes(meal) ? meal : 'Snack';
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, FoodEntry[]>
  );

  return (
    <div className="min-h-screen relative" style={{ zIndex: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="px-5 pt-14 pb-4 flex items-center justify-between"
      >
        <div>
          <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted">
            CalTrack
          </p>
          <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-[-0.03em] text-primary mt-0.5">
            Good {getGreeting()},<br />
            <span style={{ color: 'var(--accent2)' }}>
              {profile?.display_name ?? 'there'}.
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-warning" />
            <span className="font-mono text-xs text-primary font-semibold">
              {new Date().getDate()}{' '}
              {new Date().toLocaleString('default', { month: 'short' })}
            </span>
          </div>
          <Link
            href="/settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <Settings className="w-4 h-4 text-muted" />
          </Link>
        </div>
      </motion.div>

      <div className="px-5 pb-10 space-y-3.5">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: [
              '0 0 0px rgba(124,110,248,0)',
              '0 0 20px rgba(124,110,248,0.2)',
              '0 0 0px rgba(124,110,248,0)',
            ],
          }}
          transition={{
            duration: 0.45,
            delay: 0.05,
            ease: [0.25, 0.46, 0.45, 0.94],
            boxShadow: {
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 4,
            },
          }}
        >
          <div
            className="card-glow relative overflow-hidden rounded-[22px] border p-5 flex items-center gap-5"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <CalorieRing
              eaten={totalCalories}
              goal={goals.daily_calories}
              size={110}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted mb-1">
                Consumed
              </p>
              <div className="flex items-baseline gap-1">
                <motion.span
                  key={totalCalories}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`font-mono text-[26px] font-medium leading-none ${
                    isOver ? 'text-danger' : 'text-primary'
                  }`}
                >
                  {totalCalories.toLocaleString()}
                </motion.span>
                <span className="font-mono text-[10.5px] text-muted">
                  kcal
                </span>
              </div>
              <p className="font-mono text-[10px] text-muted mt-1">
                <span
                  style={{
                    color: isOver ? 'var(--danger)' : 'var(--success)',
                  }}
                >
                  {isOver
                    ? `${Math.abs(remaining).toLocaleString()} over`
                    : `${remaining.toLocaleString()} remaining`}
                </span>{' '}
                of {goals.daily_calories.toLocaleString()}
              </p>
              <motion.div
                key={remaining}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="inline-flex items-center mt-2.5 px-3 py-1.5 rounded-full text-sm font-semibold font-mono"
                style={{
                  background: isOver
                    ? 'rgba(239,68,68,0.12)'
                    : 'var(--accent-dim)',
                  color: isOver ? 'var(--danger)' : 'var(--accent2)',
                  border: `1px solid ${
                    isOver ? 'rgba(239,68,68,0.25)' : 'var(--accent-border)'
                  }`,
                }}
              >
                {isOver ? '⚠ Over goal' : '✓ On track'}
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <div
            className="relative overflow-hidden rounded-[22px] border px-5 py-4 flex items-center gap-4"
            style={{
              background:
                streak > 0
                  ? 'linear-gradient(135deg, var(--amber-bg) 0%, transparent 65%)'
                  : 'var(--surface)',
              borderColor: streak > 0 ? 'var(--amber-border)' : 'var(--border)',
            }}
          >
            <motion.span
              key={streak}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="text-[28px] leading-none flex-shrink-0"
            >
              {streak > 0 ? '🔥' : '💤'}
            </motion.span>
            <div className="flex-1">
              <motion.p
                key={streak}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-2xl font-medium leading-none"
                style={{
                  color: streak > 0 ? 'var(--amber)' : 'var(--text-muted)',
                }}
              >
                {streak}
              </motion.p>
              <p className="text-[10.5px] text-muted mt-0.5">
                {streak === 0
                  ? 'No streak — log today to start one'
                  : streak === 1
                    ? 'day streak — keep it up!'
                    : `day streak — ${
                        streak >= 7 ? 'incredible! 🏆' : 'keep it up!'
                      }`}
              </p>
            </div>
            {streak > 0 && (
              <span
                className="text-[9px] font-bold tracking-[0.1em] uppercase rounded-lg px-2.5 py-1 flex-shrink-0"
                style={{
                  color: 'var(--amber)',
                  background: 'var(--amber-bg)',
                  border: '1px solid var(--amber-border)',
                }}
              >
                {loggedToday ? 'On Track' : 'Log Today'}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-2.5 flex items-center gap-2">
            Macros Today
            <span className="flex-1 h-px bg-[var(--border)]" />
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                label: 'Protein',
                current: Math.round(totalProtein),
                goal: goals.daily_protein_g,
                color: 'var(--protein-color)',
              },
              {
                label: 'Carbs',
                current: Math.round(totalCarbs),
                goal: goals.daily_carbs_g ?? 200,
                color: 'var(--carbs-color)',
              },
              {
                label: 'Fat',
                current: Math.round(totalFat),
                goal: goals.daily_fat_g ?? 65,
                color: 'var(--fat-color)',
              },
            ].map(({ label, current, goal, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.18 + i * 0.05,
                  type: 'spring',
                  stiffness: 300,
                }}
              >
                <MacroCard
                  label={label}
                  current={current}
                  goal={goal}
                  color={color}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.22,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-2.5 flex items-center gap-2">
            Weight
            <span className="flex-1 h-px bg-[var(--border)]" />
          </p>
          <div
            className="rounded-[22px] border p-5"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <WeightCard
              todayWeight={todayWeight}
              yesterdayWeight={yesterdayWeight}
              goalWeight={profile?.goal_weight_kg ?? null}
              weightLogs={weightLogs}
              onWeightSaved={(w) =>
                setWeightLogs((prev) => [
                  { weight_kg: w, log_date: new Date().toISOString() },
                  ...prev,
                ])
              }
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.27,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted flex items-center gap-2">
              Today&apos;s Log
              <span
                className="flex-1 h-px"
                style={{ background: 'var(--border)' }}
              />
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() =>
                window.dispatchEvent(new CustomEvent('open-log-sheet'))
              }
              className="text-[10.5px] font-bold tracking-[0.06em] uppercase text-white rounded-xl px-3.5 py-2"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 20px var(--accent-glow)',
              }}
            >
              + Add Food
            </motion.button>
          </div>

          <AnimatePresence mode="popLayout">
            {todayEntries.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="rounded-[22px] border p-8 flex flex-col items-center text-center"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl"
                  style={{
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  🍽️
                </motion.div>
                <p className="text-sm font-semibold text-primary mb-1">
                  Nothing logged yet
                </p>
                <p className="text-xs text-muted">
                  Tap + Add Food to log your first meal
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {mealOrder
                  .filter((meal) => grouped[meal]?.length > 0)
                  .map((meal, mealIdx) => (
                    <motion.div
                      key={meal}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mealIdx * 0.06, duration: 0.3 }}
                    >
                      <p className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-muted mb-2 flex items-center gap-2">
                        {mealEmoji[meal]} {meal}
                        <span className="font-mono">
                          {grouped[meal].reduce(
                            (s, e) => s + (parseInt(String(e.calories)) || 0),
                            0
                          )}{' '}
                          kcal
                        </span>
                        <span
                          className="flex-1 h-px"
                          style={{ background: 'var(--border)' }}
                        />
                      </p>
                      {grouped[meal].map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.28 }}
                        >
                          <SwipeToDeleteRow
                            entry={entry}
                            onDelete={(id) =>
                              setTodayEntries((prev) =>
                                prev.filter((e) => e.id !== id)
                              )
                            }
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
