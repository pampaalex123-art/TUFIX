import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogConfig {
  id: string;
  type: DialogType;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputPlaceholder?: string;
  isDestructive?: boolean;
  resolve: (value: any) => void;
}

interface DialogContextValue {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, opts?: { title?: string; confirmLabel?: string; cancelLabel?: string; isDestructive?: boolean }) => Promise<boolean>;
  showPrompt: (message: string, opts?: { title?: string; placeholder?: string; confirmLabel?: string }) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue>({
  showAlert: async () => {},
  showConfirm: async () => false,
  showPrompt: async () => null,
});

export const useDialog = () => useContext(DialogContext);

// ─── Single Dialog ────────────────────────────────────────────────────────────
const DialogModal: React.FC<{ config: DialogConfig; onClose: (id: string) => void }> = ({ config, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDestructive = config.isDestructive;

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    if (config.type === 'prompt') setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(() => {
      if (config.type === 'prompt') config.resolve(inputValue || null);
      else if (config.type === 'confirm') config.resolve(true);
      else config.resolve(undefined);
      onClose(config.id);
    }, 180);
  };

  const handleCancel = () => {
    setVisible(false);
    setTimeout(() => {
      if (config.type === 'confirm') config.resolve(false);
      else if (config.type === 'prompt') config.resolve(null);
      onClose(config.id);
    }, 180);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        background: visible ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(4px)' : 'none',
        transition: 'background 0.2s, backdrop-filter 0.2s',
      }}
      onClick={config.type === 'alert' ? handleConfirm : handleCancel}
      onKeyDown={handleKeyDown}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 360,
          overflow: 'hidden',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(16px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s cubic-bezier(0.21,1.02,0.73,1), opacity 0.18s ease',
        }}
      >
        {/* Top accent line */}
        <div style={{
          height: 3,
          background: isDestructive
            ? 'linear-gradient(90deg, #ef4444, #f97316)'
            : 'linear-gradient(90deg, #7c3aed, #6366f1)',
          width: '100%',
        }} />

        <div style={{ padding: '20px 24px 24px' }}>
          {/* Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDestructive ? '#fee2e2' : config.type === 'prompt' ? '#ede9fe' : '#f0fdf4',
            }}>
              {config.type === 'alert' && !isDestructive && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {isDestructive && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                  <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {config.type === 'confirm' && !isDestructive && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2"/>
                  <path d="M8 12h8M12 8v8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {config.type === 'prompt' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            {config.title && (
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>
                {config.title}
              </h3>
            )}
          </div>

          {/* Message */}
          <p style={{
            fontSize: 14, color: '#4b5563', lineHeight: 1.55, margin: '0 0 16px',
            fontWeight: 500,
          }}>
            {config.message}
          </p>

          {/* Input for prompt */}
          {config.type === 'prompt' && (
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder={config.inputPlaceholder || ''}
              style={{
                display: 'block', width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', fontSize: 14, borderRadius: 10,
                border: '1.5px solid #e5e7eb', outline: 'none',
                background: '#f9fafb', color: '#111', fontWeight: 500,
                marginBottom: 16,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {config.type !== 'alert' && (
              <button
                onClick={handleCancel}
                style={{
                  padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280',
                  cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#f3f4f6'; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#fff'; }}
              >
                {config.cancelLabel || 'Cancelar'}
              </button>
            )}
            <button
              onClick={handleConfirm}
              style={{
                padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'opacity 0.15s',
                background: isDestructive
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff',
                boxShadow: isDestructive
                  ? '0 2px 8px rgba(239,68,68,0.3)'
                  : '0 2px 8px rgba(99,102,241,0.3)',
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.opacity = '0.88'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.opacity = '1'; }}
            >
              {config.type === 'alert'
                ? (config.confirmLabel || 'Entendido')
                : (config.confirmLabel || (isDestructive ? 'Confirmar' : 'Aceptar'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = useState<DialogConfig[]>([]);

  const removeDialog = useCallback((id: string) => {
    setDialogs(prev => prev.filter(d => d.id !== id));
  }, []);

  const push = useCallback((config: Omit<DialogConfig, 'id'>): Promise<any> => {
    return new Promise(resolve => {
      const id = `dlg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setDialogs(prev => [...prev, { ...config, id, resolve }]);
    });
  }, []);

  const showAlert = useCallback((message: string, title?: string) =>
    push({
        type: 'alert', message, title,
        resolve: function (value: any): void {
            throw new Error('Function not implemented.');
        }
    }),
  [push]);

  const showConfirm = useCallback((message: string, opts?: { title?: string; confirmLabel?: string; cancelLabel?: string; isDestructive?: boolean }) =>
    push({ type: 'confirm', message, title: opts?.title, confirmLabel: opts?.confirmLabel, cancelLabel: opts?.cancelLabel, isDestructive: opts?.isDestructive, resolve: () => {} }),
  [push]);

  const showPrompt = useCallback((message: string, opts?: { title?: string; placeholder?: string; confirmLabel?: string }) =>
    push({ type: 'prompt', message, title: opts?.title, inputPlaceholder: opts?.placeholder, confirmLabel: opts?.confirmLabel, resolve: () => {} }),
  [push]);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {dialogs.map(d => (
        <DialogModal key={d.id} config={d} onClose={removeDialog} />
      ))}
    </DialogContext.Provider>
  );
};