export const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  accepted: 'Oshxonada',
  ready: 'Tayyor (Olib ketishga)',
  on_the_way: "Yo'lda",
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
};

export const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  accepted: 'bg-blue-50 text-blue-700 border border-blue-200',
  ready: 'bg-teal-50 text-teal-700 border border-teal-200',
  on_the_way: 'bg-purple-50 text-purple-700 border border-purple-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

export const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-500 animate-pulse',
  accepted: 'bg-blue-500',
  ready: 'bg-teal-500 animate-pulse',
  on_the_way: 'bg-purple-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};
