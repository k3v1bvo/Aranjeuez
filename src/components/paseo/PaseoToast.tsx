'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          bg: 'bg-emerald-950/85',
          border: 'border-emerald-500/30',
          glow: 'shadow-emerald-500/15',
          titleColor: 'text-emerald-300',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
          bg: 'bg-red-950/85',
          border: 'border-red-500/30',
          glow: 'shadow-red-500/15',
          titleColor: 'text-red-300',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          bg: 'bg-amber-950/85',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/15',
          titleColor: 'text-amber-300',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-[#FF6B1A] shrink-0" />,
          bg: 'bg-[#061734]/95',
          border: 'border-[#B84D0B]/40',
          glow: 'shadow-[#B84D0B]/25',
          titleColor: 'text-[#FF8F4D]',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container (Regla 14: entrada -20px -> 0 expo-out 300ms) */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const config = getToastConfig(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl backdrop-blur-xl border ${config.bg} ${config.border} shadow-2xl ${config.glow} transition-all duration-300 animate-in fade-in slide-in-from-top-4`}
              style={{
                animationDuration: '300ms',
                animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-snug ${config.titleColor}`}>
                  {toast.message}
                </p>
                {toast.description && (
                  <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                aria-label="Cerrar notificación"
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

export function usePaseoToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('usePaseoToast must be used within a ToastProvider');
  }
  return context;
}
