'use client';

import Sheet from '@/components/ui/Sheet';
import { ChevronRight } from 'lucide-react';

export type LogMethod = 'chat' | 'photo' | 'label' | 'barcode' | 'manual';

interface LogMethodSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (method: LogMethod) => void;
}

const methods: Array<{
  id: LogMethod;
  emoji: string;
  title: string;
  sub: string;
  featured?: boolean;
}> = [
  {
    id: 'chat',
    emoji: '🤖',
    title: 'Chat with AI',
    sub: 'Describe what you ate naturally',
    featured: true,
  },
  {
    id: 'photo',
    emoji: '📸',
    title: 'Photo of Meal',
    sub: 'AI estimates your macros',
  },
  {
    id: 'label',
    emoji: '🏷️',
    title: 'Nutrition Label',
    sub: 'Exact values from the label',
  },
  {
    id: 'barcode',
    emoji: '🔍',
    title: 'Barcode Scan',
    sub: 'Scan product barcode',
  },
  {
    id: 'manual',
    emoji: '✏️',
    title: 'Manual Entry',
    sub: 'Enter numbers yourself',
  },
];

export default function LogMethodSheet({
  open,
  onClose,
  onSelect,
}: LogMethodSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log Food"
      description="How do you want to add this?"
    >
      <div className="flex flex-col gap-2 pt-1">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className="w-full flex items-center gap-3.5 rounded-[17px] border px-4 py-3.5 text-left transition-transform active:scale-[0.97]"
            style={{
              background: m.featured ? 'var(--accent-dim)' : 'var(--surface)',
              borderColor: m.featured ? 'var(--accent-border)' : 'var(--border)',
            }}
          >
            <div
              className="w-11 h-11 rounded-[13px] flex items-center justify-center text-[21px] flex-shrink-0"
              style={{
                background: m.featured
                  ? 'rgba(124,110,248,0.2)'
                  : 'rgba(255,255,255,0.05)',
              }}
            >
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[13.5px] font-bold mb-0.5"
                style={{
                  color: m.featured ? 'var(--accent2)' : 'var(--text-primary)',
                }}
              >
                {m.title}
              </p>
              <p className="text-[10.5px] text-muted">{m.sub}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
