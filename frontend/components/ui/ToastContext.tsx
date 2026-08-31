'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, type }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000); // 5s auto dismiss
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 opacity-100",
              t.type === 'success' ? "bg-white border-green-200" : "",
              t.type === 'error' ? "bg-white border-red-200" : "",
              t.type === 'info' ? "bg-slate-900 border-slate-800 text-white" : ""
            )}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
            
            <div className="flex-1">
              <h4 className={cn("text-sm font-semibold", t.type === 'info' ? 'text-white' : 'text-foreground')}>{t.title}</h4>
              {t.description && (
                <p className={cn("text-sm mt-1", t.type === 'info' ? 'text-slate-300' : 'text-slate-500')}>{t.description}</p>
              )}
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              className={cn("shrink-0 p-1 hover:bg-slate-100 rounded-md transition-colors", t.type === 'info' ? 'hover:bg-slate-800' : '')}
              aria-label="Close"
            >
              <X className={cn("w-4 h-4", t.type === 'info' ? 'text-slate-400' : 'text-slate-500')} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
