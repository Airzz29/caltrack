'use client';

interface ViewfinderProps {
  emoji: string;
  hint: string;
  tall?: boolean;
}

const corners = [
  { top: 14, left: 14, borderW: '2.5px 0 0 2.5px', radius: '5px 0 0 0' },
  { top: 14, right: 14, borderW: '2.5px 2.5px 0 0', radius: '0 5px 0 0' },
  { bottom: 14, left: 14, borderW: '0 0 2.5px 2.5px', radius: '0 0 0 5px' },
  { bottom: 14, right: 14, borderW: '0 2.5px 2.5px 0', radius: '0 0 5px 0' },
];

export default function Viewfinder({
  emoji,
  hint,
  tall = false,
}: ViewfinderProps) {
  return (
    <div
      className="w-full relative overflow-hidden rounded-[18px] mb-4 flex flex-col items-center justify-center gap-2.5"
      style={{
        aspectRatio: tall ? '3/4' : '4/3',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
      }}
    >
      {corners.map((c, i) => (
        <div
          key={i}
          className="absolute w-[22px] h-[22px]"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            borderStyle: 'solid',
            borderColor: 'var(--accent2)',
            borderWidth: c.borderW,
            borderRadius: c.radius,
          }}
        />
      ))}

      <div
        className="absolute left-[10%] right-[10%] h-[1.5px]"
        style={{
          background:
            'linear-gradient(90deg,transparent,var(--accent2),transparent)',
          animation: 'scan 2.2s ease-in-out infinite',
        }}
      />

      <span className="text-3xl relative z-10">{emoji}</span>
      <p className="text-xs text-muted relative z-10">{hint}</p>
    </div>
  );
}
