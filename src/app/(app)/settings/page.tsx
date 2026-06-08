'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { applyTheme, getStoredTheme } from '@/lib/utils';
import {
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  Users,
  Smartphone,
  ChevronRight,
  Save,
  Shield,
} from 'lucide-react';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-muted mb-2.5 flex items-center gap-2">
    {children}
    <span className="flex-1 h-px bg-[var(--border)]" />
  </p>
);

const renderField = ({
  label,
  value,
  set,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  type: string;
  placeholder: string;
}) => (
  <div key={label} className="flex items-center px-5 py-4">
    <span className="text-sm text-secondary flex-1">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent text-sm font-medium text-primary outline-none text-right w-40 placeholder:text-muted"
    />
  </div>
);

const renderFieldWithUnit = ({
  label,
  value,
  set,
  unit,
  placeholder,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  unit: string;
  placeholder: string;
}) => (
  <div key={label} className="flex items-center px-5 py-4">
    <span className="text-sm text-secondary flex-1">{label}</span>
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent font-mono text-sm font-medium text-primary outline-none text-right w-20 placeholder:text-muted"
      />
      <span className="font-mono text-xs text-muted w-8">{unit}</span>
    </div>
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  const toastCtx = useToast();

  const [profile, setProfile] = useState<{
    username?: string;
    email?: string;
  } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [community, setCommunity] = useState<{
    users: Array<{
      username: string;
      display_name?: string;
      goal_type?: string;
      logged_today: number;
      streak_days: number;
    }>;
    total: number;
  } | null>(null);
  const [showCommunity, setShowCommunity] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [dailyCalories, setDailyCalories] = useState('');
  const [dailyProtein, setDailyProtein] = useState('');
  const [dailyCarbs, setDailyCarbs] = useState('');
  const [dailyFat, setDailyFat] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    setTheme(getStoredTheme());

    async function load() {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      const p = data.user?.profile;

      setProfile(data.user ?? null);
      setRole(data.user?.role ?? '');

      if (p) {
        setDisplayName(p.display_name ?? '');
        setDailyCalories(p.daily_calories?.toString() ?? '');
        setDailyProtein(p.daily_protein_g?.toString() ?? '');
        setDailyCarbs(p.daily_carbs_g?.toString() ?? '');
        setDailyFat(p.daily_fat_g?.toString() ?? '');
        setGoalWeight(p.goal_weight_kg?.toString() ?? '');
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          daily_calories: dailyCalories
            ? parseInt(dailyCalories, 10)
            : null,
          daily_protein_g: dailyProtein
            ? parseInt(dailyProtein, 10)
            : null,
          daily_carbs_g: dailyCarbs ? parseInt(dailyCarbs, 10) : null,
          daily_fat_g: dailyFat ? parseInt(dailyFat, 10) : null,
          goal_weight_kg: goalWeight ? parseFloat(goalWeight) : null,
          theme,
        }),
      });

      if (res.ok) {
        applyTheme(theme);
        toastCtx?.toast('Settings saved ✓', 'success');
        window.dispatchEvent(new CustomEvent('settings-saved'));
      }
    } finally {
      setSaving(false);
    }
  }

  function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  async function handleSignOutAll() {
    setSigningOutAll(true);
    try {
      const res = await fetch('/api/settings/sessions', { method: 'POST' });
      if (res.ok) {
        toastCtx?.toast('All other sessions signed out', 'success');
      }
    } finally {
      setSigningOutAll(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function handleLoadCommunity() {
    const res = await fetch('/api/community');
    const data = await res.json();
    setCommunity(data);
    setShowCommunity(true);
  }

  return (
    <div className="min-h-screen relative" style={{ zIndex: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-5 pt-14 pb-4 flex items-center gap-3"
      >
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <div className="flex-1">
          <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted">
            CalTrack
          </p>
          <h1 className="font-display text-xl font-bold text-primary tracking-tight">
            Settings
          </h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving…' : 'Save'}
        </motion.button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[var(--accent2)] animate-spin" />
        </div>
      ) : (
        <div className="px-5 pb-32 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <SectionLabel>Appearance</SectionLabel>

            <div
              className="rounded-[22px] border overflow-hidden"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center px-5 py-4">
                <div className="flex items-center gap-3 flex-1">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-muted" />
                  ) : (
                    <Sun className="w-5 h-5 text-muted" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Switch app appearance
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={handleThemeToggle}
                  className="w-12 rounded-full relative flex-shrink-0 transition-colors duration-300"
                  style={{
                    background:
                      theme === 'light'
                        ? 'var(--accent)'
                        : 'rgba(255,255,255,0.15)',
                    height: 26,
                  }}
                >
                  <motion.div
                    animate={{ x: theme === 'light' ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm"
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <SectionLabel>Profile</SectionLabel>

            <div
              className="rounded-[22px] border overflow-hidden"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {[
                {
                  label: 'Display name',
                  value: displayName,
                  set: setDisplayName,
                  type: 'text',
                  placeholder: 'Your name',
                },
              ].map(renderField)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.11 }}
          >
            <SectionLabel>Daily Targets</SectionLabel>

            <div
              className="rounded-[22px] border overflow-hidden divide-y"
              style={
                {
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  '--tw-divide-opacity': 1,
                } as React.CSSProperties
              }
            >
              {[
                {
                  label: 'Calories',
                  value: dailyCalories,
                  set: setDailyCalories,
                  unit: 'kcal',
                  placeholder: '2000',
                },
                {
                  label: 'Protein',
                  value: dailyProtein,
                  set: setDailyProtein,
                  unit: 'g',
                  placeholder: '150',
                },
                {
                  label: 'Carbs',
                  value: dailyCarbs,
                  set: setDailyCarbs,
                  unit: 'g',
                  placeholder: '200',
                },
                {
                  label: 'Fat',
                  value: dailyFat,
                  set: setDailyFat,
                  unit: 'g',
                  placeholder: '65',
                },
              ].map(renderFieldWithUnit)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
          >
            <SectionLabel>Body</SectionLabel>

            <div
              className="rounded-[22px] border overflow-hidden"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {renderFieldWithUnit({
                label: 'Goal weight',
                value: goalWeight,
                set: setGoalWeight,
                unit: 'kg',
                placeholder: '70',
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.17 }}
          >
            <SectionLabel>Community</SectionLabel>

            <div
              className="rounded-[22px] border overflow-hidden"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleLoadCommunity}
                className="w-full flex items-center px-5 py-4 gap-4 transition-opacity active:opacity-70"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  <Users
                    className="w-4 h-4"
                    style={{ color: 'var(--accent2)' }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-primary">
                    Who&apos;s on CalTrack
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    See friends using the app
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </motion.button>
            </div>

            <AnimatePresence>
              {showCommunity && community && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 rounded-[22px] border overflow-hidden"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {community.users.map((u, i) => (
                    <div
                      key={u.username}
                      className="flex items-center px-5 py-3.5 gap-3"
                      style={{
                        borderTop:
                          i > 0 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: 'var(--accent-dim)',
                          color: 'var(--accent2)',
                        }}
                      >
                        {(u.display_name ?? u.username)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {u.display_name ?? u.username}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">
                          {u.goal_type?.replace(/_/g, ' ')} ·
                          {u.streak_days > 0
                            ? ` ${u.streak_days} day streak`
                            : ' just started'}
                        </p>
                      </div>
                      {u.logged_today > 0 && (
                        <span
                          className="text-[9px] font-bold tracking-[0.08em] uppercase rounded-full px-2 py-1 flex-shrink-0"
                          style={{
                            background: 'var(--green-bg)',
                            color: 'var(--success)',
                            border: '1px solid var(--green-border)',
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <SectionLabel>Admin</SectionLabel>
              <div
                className="rounded-[22px] border overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <Link
                  href="/admin/users"
                  className="flex items-center px-5 py-4 gap-4 active:opacity-70 transition-opacity"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(124,110,248,0.15)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    <Shield
                      className="w-4 h-4"
                      style={{ color: 'var(--accent2)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary">
                      Admin Panel
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Manage users, usage and billing
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted" />
                </Link>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <SectionLabel>Account & Security</SectionLabel>

            <div
              className="rounded-[22px] border overflow-hidden divide-y"
              style={
                {
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  '--tw-divide-opacity': 1,
                } as React.CSSProperties
              }
            >
              <div className="px-5 py-4">
                <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted mb-1">
                  Username
                </p>
                <p className="text-sm font-semibold text-primary">
                  {profile?.username}
                </p>
              </div>

              <div className="px-5 py-4">
                <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted mb-1">
                  Email
                </p>
                <p className="text-sm font-semibold text-primary">
                  {profile?.email}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOutAll}
                disabled={signingOutAll}
                className="w-full flex items-center px-5 py-4 gap-4 transition-opacity active:opacity-70 disabled:opacity-50"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid var(--amber-border)',
                  }}
                >
                  <Smartphone className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-primary">
                    {signingOutAll ? 'Signing out…' : 'Sign out all devices'}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Revoke all active sessions
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="w-full flex items-center px-5 py-4 gap-4 transition-opacity active:opacity-70"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <LogOut className="w-4 h-4 text-danger" />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--danger)' }}
                  >
                    Sign out
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Sign out of this device
                  </p>
                </div>
              </motion.button>
            </div>
          </motion.div>

          <p className="text-center font-mono text-[10px] text-muted pb-4">
            CalTrack v1.0 · Made by airzz2trappy
          </p>
        </div>
      )}
    </div>
  );
}
