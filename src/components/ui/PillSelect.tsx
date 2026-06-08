'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PillSelectProps {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: ReactNode;
  }>;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
  layout?: 'wrap' | 'list' | 'grid';
  className?: string;
}

export default function PillSelect({
  options,
  value,
  onChange,
  multi = false,
  layout = 'list',
  className,
}: PillSelectProps) {
  const isSelected = (v: string) =>
    multi
      ? Array.isArray(value) && value.includes(v)
      : value === v;

  const handleClick = (v: string) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };

  if (layout === 'grid') {
    return (
      <div className={`grid grid-cols-2 gap-2.5 ${className ?? ''}`}>
        {options.map((opt) => (
          <motion.button
            key={opt.value}
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            onClick={() => handleClick(opt.value)}
            className="flex flex-col items-center gap-3 px-4 py-5 rounded-[18px] border text-center transition-all duration-200"
            style={
              isSelected(opt.value)
                ? {
                    background: 'var(--accent-dim)',
                    borderColor: 'var(--accent-border)',
                    boxShadow: '0 0 16px rgba(124,110,248,0.15)',
                  }
                : {
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }
            }
          >
            {opt.icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{
                  background: isSelected(opt.value)
                    ? 'rgba(124,110,248,0.2)'
                    : 'rgba(255,255,255,0.06)',
                  color: isSelected(opt.value)
                    ? 'var(--accent2)'
                    : 'var(--text-muted)',
                }}
              >
                {opt.icon}
              </div>
            )}
            <p
              className="text-sm font-bold leading-tight transition-colors"
              style={{
                color: isSelected(opt.value)
                  ? 'var(--accent2)'
                  : 'var(--text-primary)',
              }}
            >
              {opt.label}
            </p>
          </motion.button>
        ))}
      </div>
    );
  }

  if (layout === 'wrap') {
    return (
      <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
        {options.map((opt) => (
          <motion.button
            key={opt.value}
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => handleClick(opt.value)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200"
            style={
              isSelected(opt.value)
                ? {
                    background: 'var(--accent-dim)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--accent2)',
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }
            }
          >
            {opt.icon && <span className="w-4 h-4">{opt.icon}</span>}
            {opt.label}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 ${className ?? ''}`}>
      {options.map((opt) => (
        <motion.button
          key={opt.value}
          type="button"
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          onClick={() => handleClick(opt.value)}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-[18px] border text-left transition-all duration-200"
          style={
            isSelected(opt.value)
              ? {
                  background: 'var(--accent-dim)',
                  borderColor: 'var(--accent-border)',
                  boxShadow: '0 0 16px rgba(124,110,248,0.15)',
                }
              : {
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }
          }
        >
          {opt.icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                background: isSelected(opt.value)
                  ? 'rgba(124,110,248,0.2)'
                  : 'rgba(255,255,255,0.06)',
                color: isSelected(opt.value)
                  ? 'var(--accent2)'
                  : 'var(--text-muted)',
              }}
            >
              {opt.icon}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold transition-colors"
              style={{
                color: isSelected(opt.value)
                  ? 'var(--accent2)'
                  : 'var(--text-primary)',
              }}
            >
              {opt.label}
            </p>
            {opt.description && (
              <p className="text-[11px] text-muted mt-0.5 leading-snug">
                {opt.description}
              </p>
            )}
          </div>

          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              borderColor: isSelected(opt.value)
                ? 'var(--accent2)'
                : 'var(--border)',
              background: isSelected(opt.value)
                ? 'var(--accent2)'
                : 'transparent',
            }}
          >
            {isSelected(opt.value) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-white"
              />
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
