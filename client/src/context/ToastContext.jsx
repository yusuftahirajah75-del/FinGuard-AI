import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Error') => addToast({ type: 'error', title, message, duration: 6000 }),
    warning: (message, title = 'Warning') => addToast({ type: 'warning', title, message }),
    info: (message, title = 'Information') => addToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const typeConfig = {
            success: {
              border: 'border-emerald-200 bg-emerald-50 text-emerald-900',
              icon: CheckCircle2,
              iconColor: 'text-emerald-600',
            },
            error: {
              border: 'border-rose-200 bg-rose-50 text-rose-900',
              icon: AlertCircle,
              iconColor: 'text-rose-600',
            },
            warning: {
              border: 'border-amber-200 bg-amber-50 text-amber-900',
              icon: AlertTriangle,
              iconColor: 'text-amber-600',
            },
            info: {
              border: 'border-blue-200 bg-blue-50 text-blue-900',
              icon: Info,
              iconColor: 'text-blue-600',
            },
          }[t.type] || {
            border: 'border-slate-200 bg-white text-slate-900',
            icon: Info,
            iconColor: 'text-slate-600',
          };

          const IconComponent = typeConfig.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all transform duration-200 animate-in slide-in-from-bottom-2 ${typeConfig.border}`}
              role="alert"
            >
              <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && <h5 className="text-xs font-bold mb-0.5">{t.title}</h5>}
                <p className="text-xs leading-relaxed opacity-90 break-words">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;

