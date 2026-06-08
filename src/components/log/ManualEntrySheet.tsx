'use client';

import { useState } from 'react';
import Sheet from '@/components/ui/Sheet';
import MealChips from '@/components/log/MealChips';
import { useToast } from '@/components/ui/Toast';

interface ManualEntrySheetProps {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

const inputBase =
  'w-full h-12 rounded-[13px] px-3.5 text-primary outline-none transition-all';

export default function ManualEntrySheet({
  open,
  onClose,
  onLogged,
}: ManualEntrySheetProps) {
  const toastCtx = useToast();
  const [meal, setMeal] = useState('Breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setMeal('Breakfast');
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  }

  async function handleSave() {
    if (!name || !calories) return;

    setSaving(true);
    try {
      const res = await fetch('/api/food-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: name,
          calories: parseInt(calories, 10),
          protein_g: parseFloat(protein) || 0,
          carbs_g: parseFloat(carbs) || 0,
          fat_g: parseFloat(fat) || 0,
          source: 'manual',
          meal_type: meal.toLowerCase(),
        }),
      });

      if (res.ok) {
        toastCtx?.toast('Food logged! 🎉', 'success');
        onLogged();
        onClose();
        reset();
      } else {
        toastCtx?.toast('Failed to log food', 'error');
      }
    } catch {
      toastCtx?.toast('Failed to log food', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Manual Entry">
      <MealChips value={meal} onChange={setMeal} />

      <div className="mb-3">
        <label className="text-[9.5px] font-bold tracking-[0.16em] uppercase text-muted mb-1.5 block">
          Food Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputBase} text-[15px] font-medium`}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)';
          }}
          placeholder="e.g. Chicken Breast 150g"
        />
      </div>

      <div className="mb-3">
        <label className="text-[9.5px] font-bold tracking-[0.16em] uppercase text-muted mb-1.5 block">
          Calories
        </label>
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className={`${inputBase} font-mono text-[15px] font-medium`}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)';
          }}
          placeholder="kcal"
        />
      </div>

      <div className="mb-5">
        <label className="text-[9.5px] font-bold tracking-[0.16em] uppercase text-muted mb-1.5 block">
          Macros (optional)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Protein g', val: protein, set: setProtein },
            { label: 'Carbs g', val: carbs, set: setCarbs },
            { label: 'Fat g', val: fat, set: setFat },
          ].map(({ label, val, set }) => (
            <input
              key={label}
              type="number"
              value={val}
              onChange={(e) => set(e.target.value)}
              className="h-12 rounded-[13px] px-3 font-mono text-sm text-primary outline-none text-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
              placeholder={label}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !name || !calories}
        className="w-full rounded-[15px] py-4 font-bold text-sm text-white font-display tracking-[0.04em] transition-transform active:scale-[0.96] disabled:opacity-50"
        style={{
          background: 'var(--accent)',
          boxShadow:
            '0 0 28px var(--accent-glow), 0 4px 16px rgba(124,110,248,0.25)',
        }}
      >
        {saving ? 'Saving…' : 'Add to Log'}
      </button>
    </Sheet>
  );
}
