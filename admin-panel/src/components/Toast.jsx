import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border shadow-lg text-xs font-bold animate-fade-in bg-white ${
            t.type === 'success'
              ? 'border-emerald-200 text-emerald-800'
              : t.type === 'error'
                ? 'border-red-200 text-red-800'
                : 'border-slate-200 text-slate-800'
          }`}
          role="status"
        >
          <span className="shrink-0 mt-0.5">
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <Info className="w-4 h-4 text-slate-500" />
            )}
          </span>
          <span className="flex-1 leading-relaxed">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
