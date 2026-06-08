'use client';

import { useEffect, useState } from 'react';

interface CalorieRingProps {
  eaten: number;
  goal: number;
  size?: number;
}

export default function CalorieRing({
  eaten,
  goal,
  size = 110,
}: CalorieRingProps) {
  const [animated, setAnimated] = useState(false);

  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const isOver = eaten > goal;
  const offset = circumference - (animated ? percent : 0) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ position: 'absolute' }}
      >
        <defs>
          <linearGradient id="calRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(124,110,248,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isOver ? 'var(--danger)' : 'url(#calRingGrad)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="font-mono text-xl font-medium text-primary leading-none">
          {eaten.toLocaleString()}
        </span>
        <span className="text-[8px] font-bold tracking-[0.18em] text-muted uppercase mt-1">
          kcal
        </span>
      </div>
    </div>
  );
}
