'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Atmosphere from '@/components/Atmosphere';
import { ArrowLeft, Download } from 'lucide-react';

interface UsageStats {
  active_users: number;
  total_calls: number;
  total_cost_usd: string;
}

interface PerUserUsage {
  username: string;
  display_name?: string;
  cost_usd: string;
  calls: number;
}

export default function AdminUsagePage() {
  const router = useRouter();

  const [stats, setStats] = useState<UsageStats | null>(null);
  const [perUser, setPerUser] = useState<PerUserUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/usage');
      const data = await res.json();
      setStats(data.stats);
      setPerUser(data.perUser ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleExportCSV() {
    const month = new Date().toISOString().slice(0, 7);
    const headers = ['Username', 'Display Name', 'Calls', 'Cost USD', 'Cost AUD'];
    const rows = perUser.map((u) => [
      u.username,
      u.display_name ?? '',
      u.calls,
      parseFloat(u.cost_usd).toFixed(4),
      (parseFloat(u.cost_usd) * 1.55).toFixed(3),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caltrack-usage-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen relative">
      <Atmosphere />
      <div className="relative z-10 max-w-[430px] mx-auto px-5 pt-14 pb-28">
        <div className="mb-6 flex items-center gap-3">
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
          <div className="flex-1">
            <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted">
              CalTrack Admin
            </p>
            <h1 className="font-display text-xl font-bold text-primary">
              Usage & Billing
            </h1>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-95"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[var(--accent2)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Active users', value: stats?.active_users ?? 0 },
                { label: 'Total calls', value: stats?.total_calls ?? 0 },
                {
                  label: 'Total cost',
                  value: `$${(parseFloat(stats?.total_cost_usd ?? '0') * 1.55).toFixed(2)} AUD`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-[18px] border p-4 text-center"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <p className="font-mono text-lg font-medium text-primary leading-none">
                    {value}
                  </p>
                  <p className="text-[9px] text-muted mt-1 uppercase tracking-wider font-bold">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-muted mb-2.5 flex items-center gap-2">
                Per User This Month
                <span className="flex-1 h-px bg-[var(--border)]" />
              </p>

              <div
                className="rounded-[22px] border overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {perUser.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-muted">No usage this month</p>
                  </div>
                ) : (
                  perUser.map((u, i) => (
                    <div
                      key={u.username}
                      className="flex items-center px-5 py-4"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 mr-3"
                        style={{
                          background: 'var(--accent-dim)',
                          color: 'var(--accent2)',
                        }}
                      >
                        {(u.display_name ?? u.username)[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {u.display_name ?? `@${u.username}`}
                        </p>
                        <p className="font-mono text-[10px] text-muted mt-0.5">
                          {u.calls} calls
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-sm font-bold text-primary">
                          ${(parseFloat(u.cost_usd) * 1.55).toFixed(3)}
                          <span className="text-xs text-muted ml-0.5">AUD</span>
                        </p>
                        <p className="font-mono text-[9px] text-muted">
                          ${parseFloat(u.cost_usd).toFixed(4)} USD
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
