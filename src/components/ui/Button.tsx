'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<
  NonNullable<ButtonProps['variant']>,
  string
> = {
  primary: 'bg-accent text-white shadow-lg',
  secondary:
    'bg-[var(--accent-dim)] text-accent border border-[rgba(124,110,248,0.2)]',
  ghost:
    'bg-transparent text-secondary border border-[var(--border)] hover:border-accent/40 hover:text-primary',
  danger:
    'bg-[rgba(244,63,94,0.12)] text-danger border border-[rgba(244,63,94,0.2)]',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-4 text-xs rounded-full',
  md: 'h-11 px-6 text-sm rounded-full',
  lg: 'h-12 px-8 text-sm rounded-full',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  children,
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={cn(
        'font-semibold transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent/40',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      style={
        variant === 'primary'
          ? { boxShadow: '0 4px 20px var(--accent-glow)' }
          : undefined
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
}
