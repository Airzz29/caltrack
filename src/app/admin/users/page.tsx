'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Atmosphere from '@/components/Atmosphere';
import { useToast } from '@/components/ui/Toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  status: string;
  display_name?: string;
  total_cost_usd?: string;
  total_ai_calls?: number;
  streak_7d?: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const toastCtx = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAction(
    userId: string,
    status: 'approved' | 'rejected'
  ) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const refreshRes = await fetch('/api/admin/users');
        const refreshData = await refreshRes.json();
        setUsers(refreshData.users ?? []);
        toastCtx?.toast(
          status === 'approved' ? '✓ User approved' : 'User rejected',
          status === 'approved' ? 'success' : 'error'
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  const pending = users.filter((u) => u.status === 'pending').length;
  const approved = users.filter((u) => u.status === 'approved').length;
  const totalCost = users.reduce(
    (s, u) => s + parseFloat(u.total_cost_usd || '0'),
    0
  );
  const filtered =
    filter === 'all' ? users : users.filter((u) => u.status === filter);

  return (
    <div className="min-h-screen relative">
      <Atmosphere />
      <div className="relative z-10 max-w-[430px] mx-auto px-5 pt-14 pb-28">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3"
        >
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
          </Link>
          <div>
            <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted">
              CalTrack Admin
            </p>
            <h1 className="font-display text-[24px] font-extrabold tracking-[-0.03em] text-primary leading-tight">
              Users
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            {
              label: 'Pending',
              value: pending,
              color: 'var(--amber)',
              icon: <Clock className="w-4 h-4" />,
            },
            {
              label: 'Active',
              value: approved,
              color: 'var(--success)',
              icon: <Users className="w-4 h-4" />,
            },
            {
              label: 'Mo. cost',
              value: `$${totalCost.toFixed(2)}`,
              color: 'var(--accent2)',
              icon: <DollarSign className="w-4 h-4" />,
            },
          ].map(({ label, value, color, icon }) => (
            <div
              key={label}
              className="rounded-[18px] border p-4 text-center"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex justify-center mb-2" style={{ color }}>
                {icon}
              </div>
              <p className="font-mono text-base font-medium text-primary leading-none">
                {value}
              </p>
              <p className="text-[9px] text-muted mt-1 uppercase tracking-wider font-bold">
                {label}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[18px] border px-5 py-3.5 flex items-center gap-3 mb-5 cursor-pointer active:opacity-70 transition-opacity"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          onClick={() => router.push('/admin/usage')}
        >
          <TrendingUp className="w-4 h-4 text-muted" />
          <span className="text-sm font-semibold text-secondary flex-1">
            View usage & billing
          </span>
          <ChevronRight className="w-4 h-4 text-muted" />
        </motion.div>

        <div className="flex gap-1.5 mb-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all"
              style={{
                background:
                  filter === f ? 'var(--accent-dim)' : 'var(--surface)',
                borderColor:
                  filter === f ? 'var(--accent-border)' : 'var(--border)',
                color:
                  filter === f ? 'var(--accent2)' : 'var(--text-muted)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[var(--accent2)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-[20px] border overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="px-5 py-4 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                    style={{
                      background: 'var(--accent-dim)',
                      color: 'var(--accent2)',
                    }}
                  >
                    {(u.display_name ?? u.username)[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-primary">
                        {u.display_name ?? u.username}
                      </p>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.08em] rounded-full px-2 py-0.5"
                        style={{
                          background:
                            u.status === 'approved'
                              ? 'var(--green-bg)'
                              : u.status === 'pending'
                                ? 'var(--amber-bg)'
                                : 'rgba(239,68,68,0.1)',
                          color:
                            u.status === 'approved'
                              ? 'var(--success)'
                              : u.status === 'pending'
                                ? 'var(--amber)'
                                : 'var(--danger)',
                          border: `1px solid ${
                            u.status === 'approved'
                              ? 'var(--green-border)'
                              : u.status === 'pending'
                                ? 'var(--amber-border)'
                                : 'rgba(239,68,68,0.25)'
                          }`,
                        }}
                      >
                        {u.status}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-muted mt-0.5 truncate">
                      @{u.username} · {u.email}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>

                <div
                  className="grid grid-cols-3 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {[
                    { label: 'AI calls', value: u.total_ai_calls ?? 0 },
                    { label: '7d streak', value: `${u.streak_7d ?? 0}d` },
                    {
                      label: 'Mo. cost',
                      value: `$${parseFloat(u.total_cost_usd || '0').toFixed(3)}`,
                    },
                  ].map(({ label, value }, idx) => (
                    <div
                      key={label}
                      className="py-3 text-center"
                      style={{
                        borderRight:
                          idx < 2 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <p className="font-mono text-sm font-medium text-primary">
                        {value}
                      </p>
                      <p className="text-[9px] text-muted mt-0.5 uppercase tracking-wider">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {u.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAction(u.id, 'approved')}
                      disabled={actionLoading === u.id}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                      style={{
                        background: 'var(--green-bg)',
                        color: 'var(--success)',
                        border: '1px solid var(--green-border)',
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAction(u.id, 'rejected')}
                      disabled={actionLoading === u.id}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(239,68,68,0.25)',
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-muted">No users in this filter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
