'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useReducer,
  useEffect,
  useRef,
} from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  title: string;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: number };

interface ToastContextType {
  addToast: (title: string, message: string, type?: ToastType, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ─── Reducer (stable, no closures) ───────────────────────────────────────────

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD':
      // Cap at 5 toasts to avoid overflow
      return [...state.slice(-4), action.toast];
    case 'REMOVE':
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    dispatch({ type: 'REMOVE', id });
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (title: string, message = '', type: ToastType = 'info', duration = 5000) => {
      const id = Date.now();
      dispatch({ type: 'ADD', toast: { id, title, message, type, duration } });

      const timer = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  // Convenience wrappers
  const success = useCallback(
    (title: string, message = '') => addToast(title, message, 'success'),
    [addToast]
  );
  const error = useCallback(
    (title: string, message = '') => addToast(title, message, 'error', 7000),
    [addToast]
  );
  const info = useCallback(
    (title: string, message = '') => addToast(title, message, 'info'),
    [addToast]
  );

  // SSE: real-time system events → auto-toasts
  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource('/api/events/stream');

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;

          const MAP: Record<string, { title: string; type: ToastType }> = {
            EMAIL_SENT: { title: 'Email Sent', type: 'success' },
            EMAIL_REPLIED: { title: 'New Reply!', type: 'success' },
            BOUNCE_DETECTED: { title: 'Email Bounced', type: 'error' },
            WARMUP_SENT: { title: 'Warmup Email Sent', type: 'info' },
            GMAIL_CONNECTED: { title: 'Gmail Connected', type: 'success' },
          };

          const cfg = MAP[data.type];
          if (cfg) {
            addToast(
              cfg.title,
              data.details?.email ?? data.details?.to ?? '',
              cfg.type
            );
          }
        } catch {
          // Malformed SSE message — ignore
        }
      };

      es.onerror = () => {
        es?.close();
        // Reconnect after 10s
        retryTimer = setTimeout(connect, 10_000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimer);
    };
  }, [addToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    const ref = timers.current;
    return () => {
      ref.forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, success, error, info }}>
      {children}
      <ToastList toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Toast List UI ───────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} aria-hidden="true" />,
  error: <AlertCircle size={18} aria-hidden="true" />,
  info: <Info size={18} aria-hidden="true" />,
};

const COLORS: Record<ToastType, { icon: string; bar: string; border: string }> = {
  success: { icon: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500', border: 'border-emerald-100' },
  error: { icon: 'bg-red-100 text-red-600', bar: 'bg-red-500', border: 'border-red-100' },
  info: { icon: 'bg-blue-100 text-blue-600', bar: 'bg-blue-500', border: 'border-blue-100' },
};

function ToastList({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
    >
      {toasts.map(toast => {
        const col = COLORS[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            aria-atomic="true"
            className={`pointer-events-auto bg-white rounded-2xl shadow-2xl border ${col.border} p-4 flex items-start gap-3 relative overflow-hidden`}
            style={{ animation: 'toast-in 0.25s ease-out' }}
          >
            <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${col.icon}`}>
              {ICONS[toast.type]}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm leading-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-gray-500 text-xs mt-0.5 truncate">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              aria-label="Dismiss notification"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
            >
              <X size={14} />
            </button>
            {/* Auto-dismiss progress bar */}
            <div
              className={`absolute bottom-0 left-0 h-[3px] ${col.bar} origin-left`}
              style={{
                animation: `toast-shrink ${toast.duration}ms linear forwards`,
              }}
              aria-hidden="true"
            />
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toast-shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToasts(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used within <ToastProvider>');
  return ctx;
}
