'use client';

interface ConfirmCardProps {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence?: 'high' | 'medium' | 'low';
  onFoodNameChange: (v: string) => void;
  onCaloriesChange: (v: number) => void;
  onProteinChange: (v: number) => void;
  onCarbsChange: (v: number) => void;
  onFatChange: (v: number) => void;
}

export default function ConfirmCard({
  foodName,
  calories,
  proteinG,
  carbsG,
  fatG,
  confidence,
  onFoodNameChange,
  onCaloriesChange,
  onProteinChange,
  onCarbsChange,
  onFatChange,
}: ConfirmCardProps) {
  return (
    <div
      className="rounded-[17px] p-4 mb-4"
      style={{
        background: 'var(--accent-dim)',
        border: '1px solid var(--accent-border)',
        animation: 'scaleIn 0.32s cubic-bezier(0.175,0.885,0.32,1.275) both',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[9.5px] font-bold tracking-[0.15em] uppercase"
          style={{ color: 'var(--accent2)' }}
        >
          {confidence === 'high'
            ? '✓ Exact'
            : confidence === 'medium'
              ? '⚡ Estimated'
              : 'Review Values'}
        </span>
        {confidence && (
          <span
            className="text-[9px] font-bold tracking-[0.1em] uppercase rounded-md px-2 py-0.5 border"
            style={{
              color: confidence === 'high' ? 'var(--success)' : 'var(--amber)',
              background:
                confidence === 'high' ? 'var(--green-bg)' : 'var(--amber-bg)',
              borderColor:
                confidence === 'high' ? 'var(--green-border)' : 'var(--amber-border)',
            }}
          >
            {confidence === 'high' ? 'Exact' : 'Medium'}
          </span>
        )}
      </div>

      <input
        value={foodName}
        onChange={(e) => onFoodNameChange(e.target.value)}
        className="w-full bg-transparent text-[14px] font-bold text-primary mb-3 outline-none border-b pb-2"
        style={{ borderColor: 'var(--accent-border)' }}
        placeholder="Food name"
      />

      <div className="grid grid-cols-4">
        {[
          {
            label: 'kcal',
            value: calories,
            onChange: onCaloriesChange,
            color: 'var(--text-primary)',
          },
          {
            label: 'protein',
            value: proteinG,
            onChange: onProteinChange,
            color: 'var(--accent2)',
          },
          {
            label: 'carbs',
            value: carbsG,
            onChange: onCarbsChange,
            color: 'var(--amber)',
          },
          {
            label: 'fat',
            value: fatG,
            onChange: onFatChange,
            color: 'var(--fat-color)',
          },
        ].map(({ label, value, onChange, color }) => (
          <div key={label} className="text-center">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full bg-transparent font-mono text-[19px] font-medium text-center outline-none"
              style={{ color }}
            />
            <p className="font-mono text-[8.5px] text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
