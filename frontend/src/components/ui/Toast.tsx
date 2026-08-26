import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { create } from 'zustand';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastItem = { ...toast, id, duration: toast.duration || 3500 };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, newToast.duration);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'error', title, message }),
  info: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'warning', title, message }),
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        const Icon = isSuccess
          ? CheckCircle2
          : isError
          ? AlertCircle
          : isWarning
          ? AlertTriangle
          : Info;

        const iconColor = isSuccess
          ? 'text-emerald-400'
          : isError
          ? 'text-red-400'
          : isWarning
          ? 'text-amber-400'
          : 'text-blue-400';

        const borderAccent = isSuccess
          ? 'border-emerald-500/30'
          : isError
          ? 'border-red-500/30'
          : isWarning
          ? 'border-amber-500/30'
          : 'border-theme-accent/40';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-theme-card/95 backdrop-blur-md border ${borderAccent} shadow-2xl animate-fadeIn transition-all`}
          >
            <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-semibold text-theme-text leading-tight">{t.title}</h5>
              {t.message && (
                <p className="text-[11px] text-theme-muted mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-theme-muted hover:text-theme-text rounded transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
