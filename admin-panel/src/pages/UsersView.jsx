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

export default function UsersView({ users, userSearch, setUserSearch }) {
  const filteredUsers = users.filter(u => 
    (u.first_name?.toLowerCase().includes(userSearch.toLowerCase())) ||
    (u.username?.toLowerCase().includes(userSearch.toLowerCase())) ||
    (u.telegram_id?.toString().includes(userSearch)) ||
    (u.phone?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const totalUsers = users.length;
  const activeBuyers = users.filter(u => (u.total_orders || 0) > 0).length;
  const totalRevenueAllUsers = users.reduce((sum, u) => sum + (u.total_spent || 0), 0);

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Bot Foydalanuvchilari</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {totalUsers} nafar
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
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
            className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Jami Mijozlar</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalUsers} nafar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Buyurtma Berganlar</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">{activeBuyers} nafar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Mijozlar Jami Xaridi</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {totalRevenueAllUsers.toLocaleString()} <span className="text-xs text-amber-600 font-bold">so'm</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200/80">
              <tr>
                <th className="p-4 pl-6">Mijoz</th>
                <th className="p-4">Telegram ID</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Qo'shilgan sana</th>
                <th className="p-4">Buyurtmalar</th>
                <th className="p-4 pr-6 text-right">Jami xarid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-xs text-slate-700">Foydalanuvchilar topilmadi</p>
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
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isFrequent 
                              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {initial}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{u.first_name} {u.last_name || ''}</span>
                              {isFrequent && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-bold">
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
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
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

                      <td className="p-4 font-mono text-slate-500 font-medium">
                        {u.telegram_id}
                      </td>

                      <td className="p-4">
                        {u.phone ? (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(u.created_at).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          (u.total_orders || 0) > 0 
                            ? 'bg-slate-100 text-slate-800' 
                            : 'bg-slate-50 text-slate-400'
                        }`}>
                          {u.total_orders || 0} ta
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right font-black text-slate-900 text-sm">
                        {u.total_spent ? u.total_spent.toLocaleString() : '0'} 
                        <span className="text-xs text-amber-600 ml-1">so'm</span>
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
