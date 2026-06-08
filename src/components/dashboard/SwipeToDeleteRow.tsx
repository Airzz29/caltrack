'use client';

import { useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteRowProps {
  entry: {
    id: string;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g?: number | null;
    fat_g?: number | null;
    source: string;
    meal_type?: string | null;
  };
  onDelete: (id: string) => void;
}

const THRESHOLD = -72;
const DELETE_THRESHOLD = -160;

export default function SwipeToDeleteRow({
  entry,
  onDelete,
}: SwipeToDeleteRowProps) {
  const [deleting, setDeleting] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, THRESHOLD], [0, 1]);
  const deleteScale = useTransform(x, [THRESHOLD, THRESHOLD - 20], [1, 1.15]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/food-log/${entry.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await animate(x, -500, { duration: 0.25 });
        onDelete(entry.id);
      } else {
        animate(x, 0, { type: 'spring' });
        setDeleting(false);
      }
    } catch {
      animate(x, 0, { type: 'spring' });
      setDeleting(false);
    }
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < DELETE_THRESHOLD) {
      handleDelete();
    } else if (info.offset.x < THRESHOLD / 2) {
      animate(x, THRESHOLD, {
        type: 'spring',
        stiffness: 400,
        damping: 35,
      });
      setRevealed(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
      setRevealed(false);
    }
  }

  function handleRowTap() {
    if (revealed) {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
      setRevealed(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[14px] mb-2">
      <motion.div
        className="absolute inset-0 rounded-[14px] flex items-center justify-end pr-5"
        style={{
          opacity: bgOpacity,
          background: 'rgba(239,68,68,0.15)',
        }}
      >
        <motion.button
          type="button"
          style={{ scale: deleteScale, background: 'rgba(239,68,68,0.85)' }}
          onClick={handleDelete}
          disabled={deleting}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </motion.button>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={{ left: 0.1, right: 0.05 }}
        onDragEnd={handleDragEnd}
        onClick={handleRowTap}
        style={{
          x,
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          opacity: deleting ? 0.5 : 1,
        }}
        className="relative rounded-[14px] border px-4 py-3.5 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-[13.5px] font-medium text-primary truncate">
            {entry.food_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-muted uppercase tracking-wide">
              {entry.source}
            </span>
            {entry.meal_type && (
              <span className="text-[10px] text-muted capitalize">
                {entry.meal_type}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className="font-mono text-sm font-bold text-primary">
            {entry.calories}
            <span className="text-muted font-normal text-xs ml-0.5">
              kcal
            </span>
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: 'var(--accent2)' }}
          >
            {Math.round(entry.protein_g ?? 0)}g pro
          </span>
        </div>
      </motion.div>
    </div>
  );
}
