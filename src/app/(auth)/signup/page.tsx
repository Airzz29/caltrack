'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError('Username: 3-30 chars, letters/numbers/underscore only');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border)',
  };
  const focusStyle = {
    borderColor: 'var(--accent2)',
    boxShadow: '0 0 0 3px rgba(124,110,248,0.12)',
  };
  const blurStyle = {
    borderColor: 'var(--border)',
    boxShadow: 'none',
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
        <p className="text-xs text-muted">Private access only</p>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-full rounded-[28px] p-8 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
              style={{
                background: 'var(--green-bg)',
                border: '1px solid var(--green-border)',
              }}
            >
              ✓
            </motion.div>
            <h2 className="font-display text-xl font-bold text-primary mb-2">
              Request sent!
            </h2>
            <p className="text-sm text-secondary leading-relaxed mb-6">
              Your account is pending approval. You&apos;ll be able to sign in
              once an admin approves you.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: 'var(--accent2)' }}
            >
              ← Back to sign in
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
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
                Request access
              </h1>
              <p className="text-sm text-muted mt-1">
                Join CalTrack — approval required
              </p>
            </div>

            {[
              {
                label: 'Username',
                value: username,
                set: setUsername,
                type: 'text',
                placeholder: 'your_username',
                hint: '3-30 chars, letters/numbers/underscore',
              },
              {
                label: 'Email',
                value: email,
                set: setEmail,
                type: 'email',
                placeholder: 'you@example.com',
                hint: '',
              },
              {
                label: 'Password',
                value: password,
                set: setPassword,
                type: 'password',
                placeholder: 'Min 8 characters',
                hint: 'At least 8 characters',
              },
            ].map(({ label, value, set, type, placeholder, hint }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-[9.5px] font-bold tracking-[0.16em] uppercase text-muted block">
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder={placeholder}
                  className="w-full h-12 rounded-xl px-4 text-sm text-primary outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                />
                {hint && <p className="text-[10px] text-muted">{hint}</p>}
              </div>
            ))}

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
              disabled={loading}
              className="w-full h-12 rounded-full font-display font-bold text-sm text-white transition-opacity disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 4px 24px var(--accent-glow)',
              }}
            >
              {loading ? 'Submitting…' : 'Request access →'}
            </motion.button>

            <p className="text-sm text-muted text-center">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold hover:opacity-80"
                style={{ color: 'var(--accent2)' }}
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
