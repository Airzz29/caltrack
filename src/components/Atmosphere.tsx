'use client';

import { memo, useMemo, useState, useEffect } from 'react';

const Atmosphere = memo(function Atmosphere() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stars = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => {
        const size = Math.random() * 1.3 + 0.4;
        return {
          id: i,
          size,
          left: Math.random() * 100,
          top: Math.random() * 100,
          d: 2 + Math.random() * 4,
          delay: Math.random() * 7,
          lo: 0.03 + Math.random() * 0.07,
          hi: 0.12 + Math.random() * 0.32,
        };
      }),
    []
  );

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={
            {
              width: s.size,
              height: s.size,
              left: `${s.left}%`,
              top: `${s.top}%`,
              '--d': `${s.d}s`,
              '--delay': `${s.delay}s`,
              '--lo': s.lo,
              '--hi': s.hi,
            } as React.CSSProperties
          }
        />
      ))}

      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          top: -200,
          left: -100,
          borderRadius: '50%',
          filter: 'blur(140px)',
          background:
            'radial-gradient(circle, rgba(124,110,248,0.10) 0%, transparent 70%)',
          animation: 'ambDrift1 22s ease-in-out infinite',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          bottom: 0,
          right: -80,
          borderRadius: '50%',
          filter: 'blur(140px)',
          background:
            'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
          animation: 'ambDrift2 28s ease-in-out infinite',
        }}
      />
    </div>
  );
});

export default Atmosphere;
