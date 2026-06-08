'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home,
  TrendingUp,
  BookOpen,
  MessageCircle,
  Plus,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddClick: () => void;
}

const leftItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
];

const rightItems = [
  { href: '/foods', icon: BookOpen, label: 'Foods' },
  { href: '/coach', icon: MessageCircle, label: 'Coach' },
];

export default function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname();

  function renderItem(item: {
    href: string;
    icon: LucideIcon;
    label: string;
  }) {
    const isActive =
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex flex-col items-center justify-center gap-1 flex-1 h-full',
          'rounded-[14px] py-2 transition-transform active:scale-[0.88]'
        )}
        style={isActive ? { background: 'var(--accent-dim)' } : undefined}
      >
        <Icon
          className={cn(
            'w-5 h-5 transition-transform',
            isActive ? 'scale-110' : ''
          )}
          style={{
            color: isActive ? 'var(--accent2)' : 'var(--text-muted)',
          }}
          strokeWidth={2}
        />
        <span
          className="text-[8.5px] font-bold tracking-[0.1em] uppercase"
          style={{
            color: isActive ? 'var(--accent2)' : 'var(--text-muted)',
          }}
        >
          {item.label}
        </span>
      </Link>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{
        padding: '0 16px calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      <motion.nav
        initial={{ y: '120%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        className="pointer-events-auto w-full max-w-[390px] flex items-center justify-around relative rounded-[24px] px-2 py-2"
        style={{
          background: 'rgba(10,10,14,0.82)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid var(--border)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04)',
        }}
      >
        {leftItems.map(renderItem)}

        <button
          type="button"
          onClick={onAddClick}
          className="flex-shrink-0 -mt-7 w-14 h-14 rounded-2xl bg-accent flex items-center justify-center transition-transform active:scale-90"
          style={{
            boxShadow: '0 4px 20px var(--accent-glow), 0 0 0 4px #09090b',
          }}
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>

        {rightItems.map(renderItem)}
      </motion.nav>
    </div>
  );
}
