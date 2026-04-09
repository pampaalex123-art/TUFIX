import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
  error:   <XCircle    className="w-5 h-5 text-red-400 flex-shrink-0" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
  info:    <Info       className="w-5 h-5 text-blue-400 flex-shrink-0" />,
};

const BAR_COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-400',
  error:   'bg-red-400',
  warning: 'bg-amber-400',
  info:    'bg-blue-400',
};

const ToastMessage: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  return (
    <div
      className="relative flex items-start gap-3 w-full max-w-sm bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 overflow-hidden"
      style={{
        animation: 'toast-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
      }}
    >
      {/* Colored left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${BAR_COLORS[toast.type]}`} />

      <div className="ml-1 mt-0.5">{ICONS[toast.type]}</div>

      <p className="flex-1 text-sm font-medium leading-snug pt-0.5">{toast.message}</p>

      <button
        onClick={() => onDismiss(toast.id)}
        className="mt-0.5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${BAR_COLORS[toast.type]} opacity-60`}
        style={{ animation: 'toast-progress 4s linear forwards' }}
      />
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type }]); // max 4 at once
    timers.current[id] = setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <ToastMessage toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </ToastContext.Provider>
  );
};