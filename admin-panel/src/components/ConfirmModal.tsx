import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export default function ConfirmModal({
  open,
  title = 'Tasdiqlash',
  message = 'Davom etasizmi?',
  confirmText = 'Ha, tasdiqlayman',
  cancelText = 'Bekor qilish',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[90] animate-fade-in">
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 animate-scale-up">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              danger ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{title}</h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 ${
              danger
                ? 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
