'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            className="fixed inset-0 z-[200]"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            }}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-[201] max-w-[430px] mx-auto flex flex-col max-h-[92vh] overflow-hidden"
            style={{
              background: '#131318',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              border: '1px solid var(--border)',
              borderBottom: 'none',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
              paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
            }}
          >
            <div className="px-[22px] pt-2.5 pb-1 flex flex-col items-center gap-4 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-9 h-1 rounded-full bg-white/[0.12]" />
              {title && (
                <div className="w-full">
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-primary">
                    {title}
                  </h2>
                  {description && (
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div
              className="flex-1 overflow-y-auto no-scrollbar px-[22px] pt-2 pb-2"
              style={{ overscrollBehavior: 'contain' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
