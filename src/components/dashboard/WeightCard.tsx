'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface WeightCardProps {
  todayWeight: number | null;
  yesterdayWeight: number | null;
  goalWeight: number | null;
  weightLogs?: Array<{ weight_kg: number }>;
  onWeightSaved: (weight: number) => void;
}

function WeightSparkline({
  logs,
}: {
  logs: Array<{ weight_kg: number }>;
}) {
  const data = logs.slice(0, 8).reverse();
  if (data.length < 2) return null;

  const weights = data.map((l) => Number(l.weight_kg));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const n = weights.length;

  const points = weights.map((w, i) => {
    const x = n === 1 ? 45 : (i / (n - 1)) * 90;
    const y = 38 - ((w - min) / range) * 32;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},44 L${points[0].x},44 Z`;
  const last = points[points.length - 1];

  return (
    <svg width={90} height={44} viewBox="0 0 90 44" className="flex-shrink-0">
      <defs>
        <linearGradient id="wcg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9d5cf6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#9d5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#wcg)" />
      <path
        d={linePath}
        fill="none"
        stroke="#9d5cf6"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill="#9d5cf6" />
    </svg>
  );
}

export default function WeightCard({
  todayWeight,
  yesterdayWeight,
  goalWeight,
  weightLogs,
  onWeightSaved,
}: WeightCardProps) {
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const diff =
    todayWeight !== null && yesterdayWeight !== null
      ? todayWeight - yesterdayWeight
      : null;

  async function handleSave() {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 20 || w > 500) return;

    setLoading(true);
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: w }),
      });
      if (res.ok) {
        onWeightSaved(w);
        setShowInput(false);
        setWeight('');
      }
    } finally {
      setLoading(false);
    }
  }

  if (todayWeight !== null) {
    return (
      <div>
        <div className="flex items-center gap-3.5">
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="font-mono text-[34px] font-medium text-primary leading-none">
                {todayWeight}
              </span>
              <span className="font-mono text-xs text-muted">kg</span>
            </div>
            {diff !== null && (
              <span
                className="inline-flex items-center gap-1 font-mono text-[10.5px] rounded-md px-2 py-0.5"
                style={{
                  color: diff <= 0 ? 'var(--success)' : 'var(--danger)',
                  background:
                    diff <= 0 ? 'var(--green-bg)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${diff <= 0 ? 'var(--green-border)' : 'rgba(239,68,68,0.25)'}`,
                }}
              >
                {diff <= 0 ? '↓' : '↑'} {Math.abs(diff).toFixed(1)}kg
              </span>
            )}
            {goalWeight !== null && (
              <p className="font-mono text-[10px] text-muted mt-1.5">
                Goal:{' '}
                <span className="text-primary">{goalWeight}kg</span>
                {' · '}
                {Math.abs(todayWeight - goalWeight).toFixed(1)}kg to go
              </p>
            )}
          </div>

          {weightLogs && weightLogs.length >= 2 && (
            <WeightSparkline logs={weightLogs} />
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowInput(!showInput)}
          className="mt-3 text-xs font-semibold text-accent bg-[var(--accent-dim)] px-3 py-1.5 rounded-full"
        >
          Update
        </button>

        {showInput && (
          <div className="mt-4 space-y-3">
            <Input
              label="Weight (kg)"
              type="number"
              placeholder="75.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Button
              variant="primary"
              fullWidth
              size="sm"
              loading={loading}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {!showInput ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">No weight logged today</p>
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="text-xs font-semibold text-accent bg-[var(--accent-dim)] px-3 py-1.5 rounded-full"
          >
            Log weight
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[9px] font-bold tracking-[0.16em] uppercase text-muted">
            Weight (kg)
          </p>
          <Input
            type="number"
            placeholder="75.0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Button
            variant="primary"
            fullWidth
            size="sm"
            loading={loading}
            onClick={handleSave}
          >
            Log
          </Button>
        </div>
      )}
    </div>
  );
}
