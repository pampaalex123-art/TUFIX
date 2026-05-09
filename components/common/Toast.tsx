import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  resolvedType?: 'success' | 'error'; // set after loading resolves
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showLoading: (message: string) => string; // returns id
  resolveToast: (id: string, success: boolean, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showLoading: () => '',
  resolveToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// ─── Single Toast Item ────────────────────────────────────────────────────────
const ToastMessage: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [phase, setPhase] = useState<'loading' | 'resolved' | 'out'>('loading');
  const [barComplete, setBarComplete] = useState(false);
  const isLoading = toast.type === 'loading' && !toast.resolvedType;
  const isResolved = !!toast.resolvedType;
  const isSuccess = toast.resolvedType === 'success' || toast.type === 'success';
  const isError = toast.resolvedType === 'error' || toast.type === 'error';
  const isWarning = toast.type === 'warning';
  const isInfo = toast.type === 'info';

  // Determine colors
  const accentColor = isError ? '#ef4444' : isWarning ? '#f59e0b' : isInfo ? '#3b82f6' : '#10b981';
  const bgColor = '#ffffff';

  // Phase management for loading toasts
  useEffect(() => {
    if (isResolved) {
      setPhase('resolved');
      setBarComplete(true);
    }
  }, [isResolved]);

  // For non-loading toasts, auto-dismiss
  useEffect(() => {
    if (toast.type !== 'loading') {
      const t = setTimeout(() => { onDismiss(toast.id); }, 4200);
      return () => clearTimeout(t);
    }
  }, [toast.type, toast.id, onDismiss]);

  // After resolving, auto-dismiss after a short pause
  useEffect(() => {
    if (phase === 'resolved') {
      const t = setTimeout(() => onDismiss(toast.id), 2500);
      return () => clearTimeout(t);
    }
  }, [phase, toast.id, onDismiss]);

  const icon = isLoading ? (
    // Spinner
    <span className="flex-shrink-0" style={{ width: 18, height: 18 }}>
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width={18} height={18}>
        <circle cx="9" cy="9" r="7" stroke="#e5e7eb" strokeWidth="2.5" />
        <path d="M9 2 A7 7 0 0 1 16 9" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 9 9" to="360 9 9" dur="0.8s" repeatCount="indefinite" />
        </path>
      </svg>
    </span>
  ) : (isResolved || !isLoading) && isSuccess ? (
    <span className="flex-shrink-0" style={{ color: accentColor }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="9" fill={accentColor} opacity="0.12" />
        <path d="M5 9.5l3 3 5-6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  ) : (
    <span className="flex-shrink-0" style={{ color: accentColor }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="9" fill={accentColor} opacity="0.12" />
        <path d="M6 6l6 6M12 6l-6 6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );

  return (
    <div
      className="relative flex items-center gap-3 overflow-hidden"
      style={{
        background: bgColor,
        borderRadius: 14,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        padding: '11px 16px 14px 14px',
        minWidth: 220,
        maxWidth: 320,
        animation: 'tufix-toast-in 0.32s cubic-bezier(0.21,1.02,0.73,1) forwards',
      }}
    >
      {/* Left accent line */}
      <div
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          borderRadius: '14px 0 0 14px',
          background: accentColor,
          transition: 'background 0.4s',
        }}
      />

      {/* Icon */}
      <div style={{ marginLeft: 6 }}>{icon}</div>

      {/* Message */}
      <p style={{
        flex: 1, fontSize: 13, fontWeight: 600, color: '#1a1a1a',
        lineHeight: 1.4, margin: 0, transition: 'opacity 0.2s',
      }}>
        {toast.resolvedType && toast.message ? toast.message : toast.message}
      </p>

      {/* Dismiss X — only for non-loading */}
      {!isLoading && (
        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9ca3af', padding: 2, marginLeft: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
          aria-label="Cerrar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* ── Progress bar at bottom ────────────────────────────────────── */}
      {isLoading && !barComplete && (
        // Indeterminate sweep animation while loading
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, height: 3,
            borderRadius: '0 0 14px 14px',
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            animation: 'tufix-sweep 1.1s ease-in-out infinite',
            width: '60%',
          }}
        />
      )}
      {!isLoading && (
        // Countdown bar for regular toasts
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, height: 3,
            borderRadius: '0 0 14px 14px',
            background: accentColor,
            opacity: 0.5,
            animation: 'tufix-countdown 4s linear forwards',
            width: '100%',
          }}
        />
      )}
      {isLoading && barComplete && (
        // Resolved: fill bar completely in accent color
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            borderRadius: '0 0 14px 14px',
            background: accentColor,
            opacity: 0.7,
            animation: 'tufix-fill 0.35s ease forwards',
          }}
        />
      )}
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type }]);
  }, []);

  const showLoading = useCallback((message: string): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type: 'loading' }]);
    return id;
  }, []);

  const resolveToast = useCallback((id: string, success: boolean, message?: string) => {
    setToasts(prev => prev.map(t =>
      t.id === id
        ? { ...t, resolvedType: success ? 'success' : 'error', message: message || t.message }
        : t
    ));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showLoading, resolveToast }}>
      {children}

      {/* Container — top center */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
          width: 'max-content',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastMessage toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tufix-toast-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes tufix-sweep {
          0%   { left: -60%; }
          100% { left: 160%; }
        }
        @keyframes tufix-countdown {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        @keyframes tufix-fill {
          from { width: 0%;   }
          to   { width: 100%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};