'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glass?: boolean;
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({
  children,
  className,
  onClick,
  padding = 'md',
  glass = true,
}: CardProps) {
  const baseClasses = cn(
    'rounded-2xl border border-[var(--border)]',
    glass
      ? 'bg-[rgba(255,255,255,0.03)] backdrop-blur-xl'
      : 'bg-surface',
    paddingStyles[padding],
    onClick && 'cursor-pointer',
    className
  );

  if (onClick) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.15 }}
        className={baseClasses}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
