import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  message,
  title = 'Tasdiqlash',
  confirmText = 'Ha, tasdiqlayman',
  cancelText = 'Bekor qilish',
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleTouch = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    document.addEventListener('touchmove', handleTouch, { passive: false });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.removeEventListener('touchmove', handleTouch);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-modal-fade touch-none overscroll-none"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (!loading && e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-[#1A241E] w-full max-w-[340px] rounded-[28px] p-6 space-y-4 shadow-2xl border border-neutral-200/60 dark:border-neutral-800 text-center animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Yuqori diqqat belgisi / Ikonka */}
        <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
          danger 
            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
        }`}>
          {danger ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>

        {/* Matnlar */}
        <div className="space-y-1.5">
          <h3 className="font-black text-base text-[#11311F] dark:text-[#E8F0EA]">{title}</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{message}</p>
        </div>

        {/* Tugmalar */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 bg-neutral-100 dark:bg-[#202E24] hover:bg-neutral-200 dark:hover:bg-[#283b2e] text-neutral-700 dark:text-neutral-200 rounded-2xl text-xs font-bold active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 ${
              danger
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white shadow-md shadow-red-600/20'
                : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20'
            } rounded-2xl text-xs font-bold active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50`}
          >
            {loading ? 'Kutilmoqda...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
