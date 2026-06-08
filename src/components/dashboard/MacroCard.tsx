'use client';

import { useEffect, useState } from 'react';

interface MacroCardProps {
  label: string;
  current: number;
  goal: number;
  color: string;
}

export default function MacroCard({
  label,
  current,
  goal,
  color,
}: MacroCardProps) {
  const [animated, setAnimated] = useState(false);

  const percent = goal > 0 ? Math.min(current / goal, 1) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3.5">
      <p className="text-[8.5px] font-bold tracking-[0.18em] uppercase text-muted mb-1.5">
        {label}
      </p>
      <p className="font-mono text-2xl font-medium text-primary leading-none">
        {current}
        <span className="text-[9px] text-muted ml-0.5">g</span>
      </p>
      <p className="font-mono text-[9px] text-muted mt-1">/ {goal}g</p>
      <div
        className="absolute bottom-0 left-0 right-0 h-[2.5px]"
        style={{
          background: color,
          transformOrigin: 'left',
          transform: `scaleX(${animated ? percent : 0})`,
          transition: 'transform 1.4s cubic-bezier(.4,0,.2,1) .35s',
          borderRadius: '0 0 18px 18px',
        }}
      />
    </div>
  );
}
