import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 max-w-sm sm:w-full pointer-events-none">
      {toasts.map((toast) => {
        const borderCol = toast.isError ? 'border-rose-500' : 'border-emerald-600';
        const iconCol = toast.isError ? 'text-rose-500' : 'text-emerald-600';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white rounded-xl shadow-2xl border-l-4 ${borderCol} p-3.5 flex items-start space-x-3 transition-all duration-300 animate-slide-in`}
          >
            <div className={`${iconCol} text-lg pt-0.5 shrink-0`}>
              {toast.isError ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-slate-900 text-xs">{toast.title}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
