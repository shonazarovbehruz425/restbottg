interface ConfirmModalProps {
  open: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
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
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-tab-enter"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white dark:bg-[#1A241E] w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] p-5 space-y-4 shadow-2xl border border-transparent dark:border-neutral-800">
        <h3 className="font-black text-sm text-[#11311F] dark:text-[#E8F0EA]">{title}</h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{message}</p>
        <div className="flex gap-2">
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
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Kutilmoqda...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
