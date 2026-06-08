'use client';

interface StreakCardProps {
  days: number;
  onTrack?: boolean;
}

export default function StreakCard({
  days,
  onTrack = true,
}: StreakCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] border px-4 py-3.5 flex items-center gap-3.5"
      style={{
        background:
          'linear-gradient(135deg, var(--amber-bg) 0%, transparent 65%)',
        borderColor: 'var(--amber-border)',
      }}
    >
      <span className="text-[28px] leading-none flex-shrink-0">🔥</span>
      <div>
        <p
          className="font-mono text-2xl font-medium leading-none"
          style={{ color: 'var(--amber)' }}
        >
          {days}
        </p>
        <p className="text-[10.5px] text-muted mt-0.5">
          day streak — keep it up
        </p>
      </div>
      <span
        className="ml-auto text-[9px] font-bold tracking-[0.1em] uppercase rounded-lg px-2.5 py-1 flex-shrink-0"
        style={{
          color: 'var(--amber)',
          background: 'var(--amber-bg)',
          border: '1px solid var(--amber-border)',
        }}
      >
        {onTrack ? 'On Track' : 'Keep Going'}
      </span>
    </div>
  );
}
