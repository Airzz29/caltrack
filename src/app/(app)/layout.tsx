'use client';

import { useState, useEffect, startTransition } from 'react';
import { usePathname } from 'next/navigation';
import Atmosphere from '@/components/Atmosphere';
import BottomNav from '@/components/nav/BottomNav';
import LogMethodSheet, {
  type LogMethod,
} from '@/components/log/LogMethodSheet';
import ManualEntrySheet from '@/components/log/ManualEntrySheet';
import PhotoSheet from '@/components/log/PhotoSheet';
import LabelSheet from '@/components/log/LabelSheet';
import BarcodeSheet from '@/components/log/BarcodeSheet';
import ChatSheet from '@/components/log/ChatSheet';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);
  const [activeMethod, setActiveMethod] = useState<LogMethod | null>(null);

  const openMethod = (m: LogMethod) => {
    startTransition(() => {
      setLogOpen(false);
      setTimeout(() => setActiveMethod(m), 80);
    });
  };

  const closeMethod = () => setActiveMethod(null);

  const handleLogged = () => {
    closeMethod();
    window.dispatchEvent(new CustomEvent('food-logged'));
  };

  useEffect(() => {
    const handler = () => setLogOpen(true);
    window.addEventListener('open-log-sheet', handler);
    return () => window.removeEventListener('open-log-sheet', handler);
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-[430px] mx-auto relative">
      <Atmosphere />
      <main
        className={`flex-1 overflow-y-auto no-scrollbar relative ${pathname === '/coach' ? '' : 'pb-24'}`}
        style={{ zIndex: 2 }}
      >
        {children}
      </main>
      <BottomNav
        onAddClick={() => startTransition(() => setLogOpen(true))}
      />
      <LogMethodSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSelect={openMethod}
      />
      <ManualEntrySheet
        open={activeMethod === 'manual'}
        onClose={closeMethod}
        onLogged={handleLogged}
      />
      <PhotoSheet
        open={activeMethod === 'photo'}
        onClose={closeMethod}
        onLogged={handleLogged}
      />
      <LabelSheet
        open={activeMethod === 'label'}
        onClose={closeMethod}
        onLogged={handleLogged}
      />
      <BarcodeSheet
        open={activeMethod === 'barcode'}
        onClose={closeMethod}
        onLogged={handleLogged}
      />
      <ChatSheet
        open={activeMethod === 'chat'}
        onClose={closeMethod}
        onLogged={handleLogged}
      />
    </div>
  );
}
