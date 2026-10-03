import React, { useState } from 'react';
import {
  Users,
  Search,
  ExternalLink,
  Phone,
  ShoppingBag,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Ban,
  CheckCircle,
  X,
  Send,
  ShieldAlert,
  Clock,
  History
} from 'lucide-react';
import api from '../lib/api';
import { UserItem } from '../types';

interface UsersViewProps {
  users: UserItem[];
  loading?: boolean;
  userSearch: string;
  setUserSearch: (search: string) => void;
  onRefreshUsers?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  askConfirm?: (opts: {
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }) => void;
}

const PRESET_WARNINGS = [
  "❌ Soxta (yolg'on) buyurtma berish",
  "📞 Telefon qo'ng'irog'iga javob bermaslik",
  "🤬 Kuryer yoki xodimlar bilan qo'pol muomala",
  "⚠️ Restoran va xizmat qoidalarini buzish"
];

export default function UsersView({
  users,
  loading,
  userSearch,
  setUserSearch,
  onRefreshUsers,
  showToast,
  askConfirm
}: UsersViewProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'buyers' | 'warned' | 'blocked'>('all');
  
  // Tanbeh berish modali holati
  const [warningUser, setWarningUser] = useState<UserItem | null>(null);
  const [warningReason, setWarningReason] = useState<string>('');
  const [isSubmittingWarning, setIsSubmittingWarning] = useState<boolean>(false);

  // Bloklash / Blokdan chiqarish yuklanish holati
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  // Tanbehlarni ko'rish tarixi modali
  const [historyUser, setHistoryUser] = useState<UserItem | null>(null);
  const [userWarningsList, setUserWarningsList] = useState<any[]>([]);
  const [loadingWarnings, setLoadingWarnings] = useState<boolean>(false);

  // 1. Filtrlash
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) || false) ||
      (u.username?.toLowerCase().includes(userSearch.toLowerCase()) || false) ||
      (u.telegram_id?.toString().includes(userSearch) || false) ||
      (u.phone?.toLowerCase().includes(userSearch.toLowerCase()) || false);

    if (!matchesSearch) return false;

    if (filterTab === 'buyers') return (u.total_orders || 0) > 0;
    if (filterTab === 'warned') return (u.warnings_count || 0) > 0;
    if (filterTab === 'blocked') return Number(u.is_blocked || 0) === 1;

    return true;
  });

  const totalUsers = users.length;
  const activeBuyers = users.filter((u) => (u.total_orders || 0) > 0).length;
  const warnedUsersCount = users.filter((u) => (u.warnings_count || 0) > 0).length;
  const blockedUsersCount = users.filter((u) => Number(u.is_blocked || 0) === 1).length;

  // Tanbeh yuborish
  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningUser) return;
    if (!warningReason.trim()) {
      showToast?.("Iltimos, tanbeh sababini kiriting", 'error');
      return;
    }

    try {
      setIsSubmittingWarning(true);
      const res = await api.post(`/users/${warningUser.id}/warn`, {
        reason: warningReason.trim()
      });

      if (res.data?.success) {
        showToast?.(res.data.message || "Tanbeh muvaffaqiyatli yuborildi!", 'success');
        setWarningUser(null);
        setWarningReason('');
        onRefreshUsers?.();
      }
    } catch (err: any) {
      showToast?.(err.response?.data?.error || err.message || "Tanbeh yuborishda xatolik", 'error');
    } finally {
      setIsSubmittingWarning(false);
    }
  };

  // Bloklash / Blokdan chiqarish
  const handleToggleBlock = async (u: UserItem) => {
    const isCurrentlyBlocked = Number(u.is_blocked || 0) === 1;
    const clientName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || `ID: ${u.telegram_id}`;

    const message = isCurrentlyBlocked
      ? `Haqiqatan ham "${clientName}" ni blokdan chiqarmoqchimisiz? U yana botdan taomlar buyurtma qila oladi.`
      : `Haqiqatan ham "${clientName}" ni botdan bloklamoqchimisiz? U bot va Mini App orqali buyurtma bera olmaydi!`;

    const executeToggle = async () => {
      try {
        setActionLoadingId(u.id);
        const res = await api.post(`/users/${u.id}/toggle-block`);
        if (res.data?.success) {
          showToast?.(res.data.message, res.data.is_blocked === 1 ? 'error' : 'success');
          onRefreshUsers?.();
        }
      } catch (err: any) {
        showToast?.(err.response?.data?.error || err.message || "Xatolik yuz berdi", 'error');
      } finally {
        setActionLoadingId(null);
      }
    };

    if (askConfirm) {
      askConfirm({
        title: isCurrentlyBlocked ? "Blokdan chiqarish" : "Botdan bloklash",
        message,
        confirmText: isCurrentlyBlocked ? "Ha, blokdan chiqarish" : "Ha, bloklash",
        onConfirm: executeToggle
      });
    } else {
      if (window.confirm(message)) {
        executeToggle();
      }
    }
  };

  // Tanbehlarni ko'rish tarixi
  const handleOpenHistory = async (u: UserItem) => {
    setHistoryUser(u);
    setLoadingWarnings(true);
    try {
      const res = await api.get(`/users/${u.id}/warnings`);
      setUserWarningsList(res.data?.data || []);
    } catch (err: any) {
      showToast?.("Tanbehlar tarixini yuklab bo'lmadi", 'error');
    } finally {
      setLoadingWarnings(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-tab-content">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-3 w-80 max-w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-72 max-w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 h-20 animate-pulse" />
          ))}
        </div>
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Yuqori Sarlavha va Qidiruv */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Mijozlar va Bot Foydalanuvchilari</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/60">
              {totalUsers} nafar
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mijozlarni nazorat qilish, tanbeh berish va qoidabuzarlarni botdan bloklash
          </p>
        </div>

        {/* Qidiruv */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Ism, username yoki ID bo'yicha..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* 2. Statistik Ko'rsatkich Kartalari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Jami Mijozlar</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{totalUsers}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Faol Xaridorlar</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{activeBuyers}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Tanbeh Olganlar</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{warnedUsersCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Bloklanganlar</span>
            <span className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5 block">{blockedUsersCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Ban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Tablari */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterTab === 'all'
              ? 'bg-slate-900 dark:bg-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Barchasi ({totalUsers})
        </button>
        <button
          onClick={() => setFilterTab('buyers')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterTab === 'buyers'
              ? 'bg-slate-900 dark:bg-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Buyurtma berganlar ({activeBuyers})
        </button>
        <button
          onClick={() => setFilterTab('warned')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterTab === 'warned'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          Tanbeh olganlar ({warnedUsersCount})
        </button>
        <button
          onClick={() => setFilterTab('blocked')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterTab === 'blocked'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
        >
          Bloklanganlar ({blockedUsersCount})
        </button>
      </div>

      {/* 4. Mijozlar Jadvali */}
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4 pl-6">Mijoz</th>
                <th className="p-4">Telegram ID</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Qo'shilgan sana</th>
                <th className="p-4">Buyurtmalar</th>
                <th className="p-4 text-right">Jami xarid</th>
                <th className="p-4 pr-6 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-300 dark:text-slate-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">Foydalanuvchilar topilmadi</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {userSearch ? 'Qidiruv bo\'yicha mos foydalanuvchi yo\'q.' : 'Tanlangan parametr bo\'yicha mijoz mavjud emas.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initial = u.first_name ? u.first_name[0].toUpperCase() : 'U';
                  const isFrequent = (u.total_orders || 0) >= 3;
                  const isBlocked = Number(u.is_blocked || 0) === 1;
                  const warningsCount = u.warnings_count || 0;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors ${
                        isBlocked ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                      }`}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 relative ${
                            isBlocked
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 ring-2 ring-red-400'
                              : isFrequent
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 ring-2 ring-amber-300 dark:ring-amber-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}>
                            {initial}
                            {isBlocked && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white dark:border-[#0F172A]" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>{u.first_name} {u.last_name || ''}</span>
                              {isBlocked && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase">
                                  Bloklangan
                                </span>
                              )}
                              {warningsCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenHistory(u)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[9px] font-black cursor-pointer hover:bg-amber-200 transition-colors"
                                  title="Tanbehlarni ko'rish"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                  <span>{warningsCount} ta tanbeh</span>
                                </button>
                              )}
                              {isFrequent && !isBlocked && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>VIP</span>
                                </span>
                              )}
                            </div>
                            {u.username ? (
                              <a
                                href={`https://t.me/${u.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>@{u.username}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400">username yo'q</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400 font-medium">
                        {u.telegram_id}
                      </td>

                      <td className="p-4">
                        {u.phone ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Ko'rsatilmagan</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : '-'}
                      </td>

                      <td className="p-4 font-bold text-slate-900 dark:text-slate-200">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {u.total_orders || 0} ta
                        </span>
                      </td>

                      <td className="p-4 text-right font-black text-amber-600 dark:text-amber-400">
                        {(u.total_spent || 0).toLocaleString()} so'm
                      </td>

                      {/* 5. Amallar (Tanbeh berish va Botdan blok qilish) */}
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tanbeh berish tugmasi */}
                          <button
                            type="button"
                            onClick={() => {
                              setWarningUser(u);
                              setWarningReason('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Telegram orqali rasmiy tanbeh (ogohlantirish) yuborish"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Tanbeh berish</span>
                          </button>

                          {/* Botdan blok qilish / Blokdan chiqarish tugmasi */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(u)}
                            disabled={actionLoadingId === u.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                              isBlocked
                                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                            }`}
                            title={isBlocked ? "Foydalanuvchini blokdan chiqarish" : "Foydalanuvchini botdan bloklash"}
                          >
                            {isBlocked ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Blokdan ochish</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                <span>Blok qilish</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          TANBEH BERISH MODALI
          ========================================== */}
      {warningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Mijozga Tanbeh Berish
                  </h3>
                  <p className="text-xs text-slate-400">
                    Xabar Telegram bot orqali mijozning shaxsiy chatiga yetkaziladi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWarningUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Foydalanuvchi ma'lumoti kartasi */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white block">
                  {warningUser.first_name} {warningUser.last_name || ''}
                </span>
                <span className="text-slate-400 text-[11px]">
                  ID: {warningUser.telegram_id} {warningUser.username ? `• @${warningUser.username}` : ''}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Joriy tanbehlar</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  {warningUser.warnings_count || 0} ta
                </span>
              </div>
            </div>

            {/* Tezkor Sabab Shablonlari */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Tezkor sabab shablonlari:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_WARNINGS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWarningReason(preset)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-all cursor-pointer active:scale-95"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Sabab kiritish maydoni */}
            <form onSubmit={handleSendWarning} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Tanbeh matni / Sabab:
                </label>
                <textarea
                  rows={3}
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  placeholder="Masalan: 3 marta soxta buyurtma berdingiz yoki kuryerga eshik ochilmadi..."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none shadow-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWarningUser(null)}
                  disabled={isSubmittingWarning}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWarning || !warningReason.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingWarning ? "Yuborilmoqda..." : "Tanbeh yuborish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          TANBEHLAR TARIXINI KO'RISH MODALI
          ========================================== */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Tanbehlar Tarixi
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {historyUser.first_name} {historyUser.last_name || ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {loadingWarnings ? (
                <div className="py-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
              ) : userWarningsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Ushbu foydalanuvchiga hali tanbeh berilmagan.
                </div>
              ) : (
                userWarningsList.map((w: any) => (
                  <div
                    key={w.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Admin: <b className="text-slate-700 dark:text-slate-300">{w.admin_username || 'admin'}</b></span>
                      <span>{new Date(w.created_at).toLocaleString('uz-UZ')}</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {w.reason}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setHistoryUser(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
