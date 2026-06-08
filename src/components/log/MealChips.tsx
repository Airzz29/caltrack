'use client';

interface MealChipsProps {
  value: string;
  onChange: (v: string) => void;
}

const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealChips({ value, onChange }: MealChipsProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 mb-4">
      {meals.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className="rounded-[11px] border py-2.5 text-[9.5px] font-bold tracking-[0.07em] uppercase text-center transition-all active:scale-[0.93]"
          style={{
            background: value === m ? 'var(--accent-dim)' : 'var(--surface)',
            borderColor: value === m ? 'var(--accent-border)' : 'var(--border)',
            color: value === m ? 'var(--accent2)' : 'var(--text-muted)',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
