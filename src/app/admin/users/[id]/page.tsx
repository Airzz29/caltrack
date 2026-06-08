'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Atmosphere from '@/components/Atmosphere';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Copy, CheckCircle, XCircle } from 'lucide-react';

interface UserDetailData {
  user: {
    id: string;
    username: string;
    email: string;
    status: string;
    created_at: string;
    display_name?: string;
    goal_type?: string;
    daily_calories?: number;
  };
  usageByFeature: Array<{
    feature: string;
    calls: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: string;
  }>;
  monthlyTotal: {
    total_usd: string;
    total_calls: number;
  };
  alltimeUsd: string;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toastCtx = useToast();

  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/users/${id}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleAction(status: 'approved' | 'rejected') {
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setData((prev) =>
        prev ? { ...prev, user: { ...prev.user, status } } : prev
      );
      toastCtx?.toast(
        status === 'approved' ? 'User approved ✓' : 'User rejected',
        status === 'approved' ? 'success' : 'error'
      );
    }
    setActionLoading(false);
  }

  return (
    <div className="min-h-screen relative">
      <Atmosphere />
      <div className="relative z-10 max-w-[430px] mx-auto px-5 pt-14 pb-28">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center gap-3"
        >
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
          </button>
          <h1 className="font-display text-xl font-bold text-primary">
            User Detail
          </h1>
        </motion.div>

        {loading || !data ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[var(--accent2)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[22px] border overflow-hidden"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="px-5 py-5 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl"
                  style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent2)',
                  }}
                >
                  {(data.user.display_name ?? data.user.username)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-primary">
                    {data.user.display_name ?? data.user.username}
                  </p>
                  <p className="text-sm text-muted">@{data.user.username}</p>
                  <p className="text-xs text-muted">{data.user.email}</p>
                </div>
              </div>

              <div
                className="grid grid-cols-2 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                {[
                  { label: 'Status', value: data.user.status },
                  {
                    label: 'Goal',
                    value: data.user.goal_type?.replace(/_/g, ' ') ?? '—',
                  },
                  {
                    label: 'Calories',
                    value: data.user.daily_calories
                      ? `${data.user.daily_calories} kcal`
                      : '—',
                  },
                  {
                    label: 'Joined',
                    value: new Date(data.user.created_at).toLocaleDateString(
                      'en-AU',
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    ),
                  },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="px-5 py-3.5"
                    style={{
                      borderBottom:
                        i < 2 ? '1px solid var(--border)' : 'none',
                      borderRight:
                        i % 2 === 0 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-primary capitalize">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-muted mb-2.5 flex items-center gap-2">
                This Month&apos;s Invoice
                <span className="flex-1 h-px bg-[var(--border)]" />
              </p>

              <div
                className="rounded-[22px] border overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="px-5 py-5 flex items-center justify-between border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">
                      Total AI usage
                    </p>
                    <p className="font-mono text-3xl font-medium text-primary">
                      $
                      {(
                        parseFloat(data.monthlyTotal.total_usd) * 1.55
                      ).toFixed(2)}
                      <span className="text-sm text-muted ml-1">AUD</span>
                    </p>
                    <p className="font-mono text-xs text-muted mt-0.5">
                      ${parseFloat(data.monthlyTotal.total_usd).toFixed(4)} USD ·{' '}
                      {data.monthlyTotal.total_calls} calls
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const msg = `Hey ${data.user.display_name ?? data.user.username}! Your CalTrack AI usage this month is $${(parseFloat(data.monthlyTotal.total_usd) * 1.55).toFixed(2)} AUD. Feel free to transfer whenever 🙌`;
                      navigator.clipboard.writeText(msg);
                      toastCtx?.toast('Invoice message copied!', 'success');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                    style={{
                      background: 'var(--accent-dim)',
                      color: 'var(--accent2)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    Copy msg
                  </button>
                </div>

                {data.usageByFeature.length > 0 ? (
                  data.usageByFeature.map((f, i) => (
                    <div
                      key={f.feature}
                      className="flex items-center px-5 py-3.5"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary capitalize">
                          {f.feature.replace(/_/g, ' ')}
                        </p>
                        <p className="font-mono text-xs text-muted mt-0.5">
                          {f.calls} calls ·{' '}
                          {f.input_tokens + f.output_tokens} tokens
                        </p>
                      </div>
                      <p className="font-mono text-sm font-medium text-primary">
                        ${(parseFloat(f.cost_usd) * 1.55).toFixed(3)} AUD
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-muted">No AI usage this month</p>
                  </div>
                )}

                <div
                  className="px-5 py-3.5 border-t"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted">All-time total</p>
                    <p className="font-mono text-xs text-secondary">
                      $
                      {(parseFloat(String(data.alltimeUsd)) * 1.55).toFixed(3)}{' '}
                      AUD
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {(data.user.status === 'pending' ||
              data.user.status === 'approved') && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="space-y-3"
              >
                {data.user.status === 'pending' && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAction('approved')}
                    disabled={actionLoading}
                    className="w-full py-4 rounded-[15px] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: 'var(--green-bg)',
                      color: 'var(--success)',
                      border: '1px solid var(--green-border)',
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve User
                  </motion.button>
                )}

                {data.user.status === 'approved' && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAction('rejected')}
                    disabled={actionLoading}
                    className="w-full py-4 rounded-[15px] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239,68,68,0.25)',
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                    Revoke Access
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
