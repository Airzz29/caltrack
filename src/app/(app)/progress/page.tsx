'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface WeightLog {
  log_date: string;
  weight_kg: string;
}

interface CalorieLog {
  log_date: string;
  total_calories: number;
  total_protein: number;
}

interface Goals {
  daily_calories: number;
  daily_protein_g: number;
}

export default function ProgressPage() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [calorieLogs, setCalorieLogs] = useState<CalorieLog[]>([]);
  const [goals, setGoals] = useState<Goals>({
    daily_calories: 2000,
    daily_protein_g: 150,
  });
  const [loading, setLoading] = useState(true);
  const [weightRange, setWeightRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/progress');
        const data = await res.json();
        if (res.ok) {
          setWeightLogs(data.weightLogs ?? []);
          setCalorieLogs(data.calorieLogs ?? []);
          setGoals(data.goals ?? { daily_calories: 2000, daily_protein_g: 150 });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const weightData = useMemo(() => {
    const days = weightRange === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);

    return weightLogs
      .filter((w) => new Date(w.log_date) >= cutoff)
      .map((w) => ({
        date: new Date(w.log_date).toLocaleDateString('en-AU', {
          month: 'short',
          day: 'numeric',
        }),
        weight: parseFloat(w.weight_kg),
      }));
  }, [weightLogs, weightRange]);

  const calorieData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const entry = calorieLogs.find((c) => {
        const logDate = new Date(c.log_date);
        const key = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
        return key === dateKey;
      });

      const calories = entry ? Number(entry.total_calories) : 0;
      const goal = goals.daily_calories;

      days.push({
        date: d.toLocaleDateString('en-AU', { weekday: 'short' }),
        calories,
        goal,
        status:
          calories > 0
            ? calories <= goal
              ? 'under'
              : 'over'
            : 'no-data',
      });
    }
    return days;
  }, [calorieLogs, goals.daily_calories]);

  const weightStats = useMemo(() => {
    if (weightData.length >= 2) {
      const start = weightData[0].weight;
      const end = weightData[weightData.length - 1].weight;
      return { change: end - start };
    }
    return { change: null as number | null };
  }, [weightData]);

  return (
    <div className="min-h-screen relative" style={{ zIndex: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-5 pt-14 pb-4"
      >
        <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted">
          CalTrack
        </p>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em] text-primary mt-0.5">
          Your
          <br />
          <span style={{ color: 'var(--accent2)' }}>Progress.</span>
        </h1>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[var(--accent2)] animate-spin" />
        </div>
      ) : (
        <div className="px-5 pb-32 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-muted flex items-center gap-2">
                Weight
                <span className="flex-1 h-px bg-[var(--border)]" />
              </p>
              <div className="flex gap-1.5">
                {(['7d', '30d'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setWeightRange(r)}
                    className="font-mono text-[10px] font-medium px-3 py-1 rounded-full border transition-all"
                    style={{
                      background:
                        weightRange === r ? 'var(--accent-dim)' : 'transparent',
                      borderColor:
                        weightRange === r
                          ? 'var(--accent-border)'
                          : 'var(--border)',
                      color:
                        weightRange === r
                          ? 'var(--accent2)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-[22px] border p-5"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {weightData.length < 2 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">⚖️</p>
                  <p className="text-sm font-semibold text-primary mb-1">
                    Not enough data
                  </p>
                  <p className="text-xs text-muted">
                    Log your weight daily to see trends
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div>
                      <p className="font-mono text-3xl font-medium text-primary leading-none">
                        {weightData[weightData.length - 1].weight}
                        <span className="text-base text-muted ml-1">kg</span>
                      </p>
                      <p className="font-mono text-[10px] text-muted mt-1">
                        Latest
                      </p>
                    </div>
                    {weightStats.change !== null && (
                      <div
                        className="ml-auto flex items-center gap-1.5 font-mono text-sm px-3 py-1.5 rounded-full"
                        style={{
                          background:
                            weightStats.change <= 0
                              ? 'var(--green-bg)'
                              : 'rgba(239,68,68,0.1)',
                          color:
                            weightStats.change <= 0
                              ? 'var(--success)'
                              : 'var(--danger)',
                          border: `1px solid ${
                            weightStats.change <= 0
                              ? 'var(--green-border)'
                              : 'rgba(239,68,68,0.25)'
                          }`,
                        }}
                      >
                        {weightStats.change <= 0 ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5" />
                        )}
                        {weightStats.change > 0 ? '+' : ''}
                        {weightStats.change.toFixed(1)}kg
                      </div>
                    )}
                  </div>

                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart
                      data={weightData}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="weightLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9d5cf6" stopOpacity={0.3} />
                          <stop
                            offset="100%"
                            stopColor="#9d5cf6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fill: 'rgba(244,244,245,0.35)',
                          fontSize: 9,
                          fontFamily: 'DM Mono',
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: 'rgba(244,244,245,0.35)',
                          fontSize: 9,
                          fontFamily: 'DM Mono',
                        }}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#131318',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12,
                          fontFamily: 'DM Mono',
                          fontSize: 12,
                          color: '#f4f4f5',
                        }}
                        formatter={(v) => [`${v ?? 0} kg`, 'Weight']}
                        labelStyle={{ color: 'rgba(244,244,245,0.55)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#9d5cf6"
                        strokeWidth={2.2}
                        dot={{ fill: '#9d5cf6', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#9d5cf6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-muted mb-2.5 flex items-center gap-2">
              Calories (7 days)
              <span className="flex-1 h-px bg-[var(--border)]" />
            </p>

            <div
              className="rounded-[22px] border p-5"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={calorieData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: 'rgba(244,244,245,0.35)',
                      fontSize: 9,
                      fontFamily: 'DM Mono',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'rgba(244,244,245,0.35)',
                      fontSize: 9,
                      fontFamily: 'DM Mono',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine
                    y={goals.daily_calories}
                    stroke="rgba(157,92,246,0.5)"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#131318',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      fontFamily: 'DM Mono',
                      fontSize: 12,
                      color: '#f4f4f5',
                    }}
                    formatter={(v) => [`${v ?? 0} kcal`, 'Calories']}
                    labelStyle={{ color: 'rgba(244,244,245,0.55)' }}
                  />
                  <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                    {calorieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.calories === 0
                            ? 'rgba(255,255,255,0.06)'
                            : entry.calories <= entry.goal
                              ? 'rgba(16,185,129,0.5)'
                              : 'rgba(239,68,68,0.45)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="flex gap-4 mt-3">
                {[
                  { color: 'rgba(16,185,129,0.5)', label: 'Under goal' },
                  { color: 'rgba(239,68,68,0.45)', label: 'Over goal' },
                  {
                    color: 'rgba(157,92,246,0.5)',
                    label: 'Target',
                    dash: true,
                  },
                ].map(({ color, label, dash }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {dash ? (
                      <div
                        className="w-4 h-[1.5px]"
                        style={{ background: color }}
                      />
                    ) : (
                      <div
                        className="w-2 h-2 rounded-[2px]"
                        style={{ background: color }}
                      />
                    )}
                    <span className="text-[9.5px] text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-muted mb-2.5 flex items-center gap-2">
              This Week
              <span className="flex-1 h-px bg-[var(--border)]" />
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  label: 'Avg. Calories',
                  value:
                    calorieData.filter((d) => d.calories > 0).length > 0
                      ? Math.round(
                          calorieData
                            .filter((d) => d.calories > 0)
                            .reduce((s, d) => s + d.calories, 0) /
                            calorieData.filter((d) => d.calories > 0).length
                        )
                      : 0,
                  unit: 'kcal',
                  goal: goals.daily_calories,
                  color: 'var(--text-primary)',
                },
                {
                  label: 'Days Logged',
                  value: calorieData.filter((d) => d.calories > 0).length,
                  unit: '/ 7',
                  goal: null,
                  color: 'var(--accent2)',
                },
              ].map(({ label, value, unit, goal, color }) => (
                <div
                  key={label}
                  className="rounded-[18px] border p-4"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <p className="text-[8.5px] font-bold tracking-[0.18em] uppercase text-muted mb-2">
                    {label}
                  </p>
                  <p
                    className="font-mono text-2xl font-medium leading-none"
                    style={{ color }}
                  >
                    {value.toLocaleString()}
                    <span className="text-sm text-muted ml-1">{unit}</span>
                  </p>
                  {goal && (
                    <p className="font-mono text-[9px] text-muted mt-1">
                      goal {goal.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
