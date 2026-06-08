'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="fixed bottom-24 left-0 right-0 max-w-[390px] mx-auto px-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-lg"
            >
              {t.type === 'success' && (
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
              )}
              {t.type === 'error' && (
                <XCircle className="w-4 h-4 text-danger shrink-0" />
              )}
              {t.type === 'info' && (
                <AlertCircle className="w-4 h-4 text-accent shrink-0" />
              )}

              <p className="text-sm text-primary font-medium flex-1">
                {t.message}
              </p>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-muted hover:text-primary shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
