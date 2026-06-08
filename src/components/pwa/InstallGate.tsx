'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function InstallGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<
    'checking' | 'installed' | 'not-installed'
  >('checking');
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>(
    'desktop'
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pwa') === '1' || process.env.NODE_ENV === 'development') {
      setStatus('installed');
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      setStatus('installed');
      return;
    }

    setStatus('not-installed');

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as typeof deferredPrompt);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setStatus('installed');
  };

  if (status === 'checking') return null;
  if (status === 'installed') return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#07070D] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        style={{
          position: 'fixed',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(124,110,248,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-[340px]"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto mb-6"
          style={{
            background:
              'linear-gradient(135deg,rgba(124,110,248,0.2),rgba(124,110,248,0.05))',
            border: '1px solid rgba(124,110,248,0.3)',
            boxShadow: '0 0 40px rgba(124,110,248,0.2)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#7C6EF8,#9d5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: 16,
              fontFamily: 'sans-serif',
            }}
          >
            CT
          </div>
        </motion.div>

        <h1
          style={{
            fontFamily: 'sans-serif',
            fontSize: 28,
            fontWeight: 800,
            color: '#f4f4f5',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Add CalTrack to
          <br />
          <span style={{ color: '#9d5cf6' }}>your home screen</span>
        </h1>

        <p
          style={{
            color: 'rgba(244,244,245,0.55)',
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          CalTrack works as a native app. Install it first to unlock full
          access.
        </p>

        {platform === 'ios' && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '20px 24px',
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            <p
              style={{
                color: 'rgba(244,244,245,0.55)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 16,
                fontFamily: 'sans-serif',
              }}
            >
              How to install on iPhone
            </p>
            {[
              ['1', 'Tap the Share button', '⬆️'],
              ['2', 'Scroll and tap "Add to Home Screen"', '➕'],
              ['3', 'Tap "Add" in the top right', '✓'],
            ].map(([num, text, icon]) => (
              <div
                key={num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'rgba(124,110,248,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 14,
                  }}
                >
                  {icon}
                </div>
                <p
                  style={{
                    color: 'rgba(244,244,245,0.75)',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                  }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        )}

        {platform === 'android' && deferredPrompt && (
          <button
            onClick={handleAndroidInstall}
            style={{
              width: '100%',
              background: '#7C6EF8',
              color: 'white',
              border: 'none',
              borderRadius: 100,
              padding: '16px',
              fontFamily: 'sans-serif',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 16,
              boxShadow: '0 4px 24px rgba(124,110,248,0.4)',
            }}
          >
            Install CalTrack
          </button>
        )}

        {platform === 'android' && !deferredPrompt && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '20px 24px',
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            <p
              style={{
                color: 'rgba(244,244,245,0.55)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 12,
                fontFamily: 'sans-serif',
              }}
            >
              How to install on Android
            </p>
            <p
              style={{
                color: 'rgba(244,244,245,0.65)',
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: 'sans-serif',
              }}
            >
              Tap ⋮ (menu) in Chrome → &quot;Add to Home screen&quot; →
              &quot;Add&quot;
            </p>
          </div>
        )}

        {platform === 'desktop' && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '20px 24px',
              marginBottom: 24,
            }}
          >
            <p
              style={{
                color: 'rgba(244,244,245,0.65)',
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: 'sans-serif',
              }}
            >
              Open CalTrack on your phone to install it as a native app.
            </p>
          </div>
        )}

        <p
          style={{
            color: 'rgba(244,244,245,0.25)',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          CalTrack · Private access only
        </p>
      </motion.div>
    </div>
  );
}
