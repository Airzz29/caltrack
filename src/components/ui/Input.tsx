'use client';

import { cn } from '@/lib/utils';

interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  autoComplete?: string;
  required?: boolean;
}

export default function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'w-full h-12 rounded-xl text-sm text-primary',
            'bg-white/5 border border-white/8',
            'placeholder:text-muted',
            'focus:outline-none focus:border-accent/50',
            'focus:ring-1 focus:ring-accent/30',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon ? 'pl-10 pr-4' : 'px-4',
            rightIcon ? 'pr-10' : '',
            error
              ? 'border-danger/50 focus:border-danger/70 focus:ring-danger/20'
              : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4">
            {rightIcon}
          </div>
        )}
      </div>
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
