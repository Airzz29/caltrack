'use client';

import { useEffect, useState } from 'react';

interface MacroRingProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export default function MacroRing({
  label,
  current,
  goal,
  color,
  unit = 'g',
}: MacroRingProps) {
  const [animated, setAnimated] = useState(false);

  const size = 56;
  const strokeWidth = 5;
  const ringRadius = 23.5;
  const circumference = 2 * Math.PI * ringRadius;
  const percent = goal > 0 ? Math.min(current / goal, 1) : 0;
  const offset = circumference - (animated ? percent : 0) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
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
          <circle
            cx={28}
            cy={28}
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={28}
            cy={28}
            r={ringRadius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              filter: `drop-shadow(0 0 4px ${color}80)`,
            }}
          />
        </svg>
        <span className="font-mono text-xs font-bold z-10" style={{ color }}>
          {current}
        </span>
      </div>

      <div className="text-center">
        <p className="font-mono text-sm font-semibold text-primary leading-none">
          {current}
          <span className="text-xs text-muted">{unit}</span>
        </p>
        <p className="text-[10px] text-muted mt-0.5">{label}</p>
        <p className="font-mono text-[10px] text-muted">
          /{goal}
          {unit}
        </p>
      </div>
    </div>
  );
}
