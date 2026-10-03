import React from 'react';
import {
  Users,
  Search,
  ExternalLink,
  Phone,
  ShoppingBag,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { UserItem } from '../types';

interface UsersViewProps {
  users: UserItem[];
  loading?: boolean;
  userSearch: string;
  setUserSearch: (search: string) => void;
}

export default function UsersView({
  users,
  loading,
  userSearch,
  setUserSearch
}: UsersViewProps) {
  const filteredUsers = users.filter((u) =>
    (u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) || false) ||
    (u.username?.toLowerCase().includes(userSearch.toLowerCase()) || false) ||
    (u.telegram_id?.toString().includes(userSearch) || false) ||
    (u.phone?.toLowerCase().includes(userSearch.toLowerCase()) || false)
  );

  const totalUsers = users.length;
  const activeBuyers = users.filter((u) => (u.total_orders || 0) > 0).length;
  const totalRevenueAllUsers = users.reduce((sum, u) => sum + (u.total_spent || 0), 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 h-20 animate-pulse">
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded mt-2" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Bot Foydalanuvchilari</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/60">
              {totalUsers} nafar
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Telegram bot orqali kirgan mijozlar, faollik va xaridlar statistikasi
          </p>
        </div>

        {/* Search Input */}
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

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Jami Mijozlar</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{totalUsers} nafar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Buyurtma Berganlar</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{activeBuyers} nafar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Mijozlar Jami Xaridi</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
              {totalRevenueAllUsers.toLocaleString()} <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">so'm</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Users Table */}
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
                <th className="p-4 pr-6 text-right">Jami xarid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-300 dark:text-slate-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">Foydalanuvchilar topilmadi</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {userSearch ? 'Qidiruv bo\'yicha mos foydalanuvchi yo\'q.' : 'Botga foydalanuvchilar start bosganda bu yerda paydo bo\'ladi.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initial = u.first_name ? u.first_name[0].toUpperCase() : 'U';
                  const isFrequent = (u.total_orders || 0) >= 3;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isFrequent
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 ring-2 ring-amber-300 dark:ring-amber-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}>
                            {initial}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.first_name} {u.last_name || ''}</span>
                              {isFrequent && (
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

                      <td className="p-4 pr-6 text-right font-black text-amber-600 dark:text-amber-400">
                        {(u.total_spent || 0).toLocaleString()} so'm
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
