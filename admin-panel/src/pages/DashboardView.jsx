import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Users, 
  DollarSign, 
  ArrowRight,
  Plus,
  Bike,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function DashboardView({ stats, onGoToOrders, onGoToProducts, onGoToCouriers }) {
  const currentDate = new Date().toLocaleDateString('uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">👋</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Xush kelibsiz, Boshqaruv Markazi!
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-medium capitalize">
            {currentDate} • Restoran va Mini App holati
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {onGoToProducts && (
            <button
              onClick={onGoToProducts}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Taom Qo'shish</span>
            </button>
          )}

          {onGoToCouriers && (
            <button
              onClick={onGoToCouriers}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Bike className="w-4 h-4 text-amber-400" />
              <span>Kuryer Taklif Qilish</span>
            </button>
          )}

          <button
            onClick={onGoToOrders}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Buyurtmalar</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jami Tushum */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-effect space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Jami Tushum
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'} 
              <span className="text-xs font-bold text-emerald-600 ml-1">so'm</span>
            </div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Muvaffaqiyatli yetkazilganlar</span>
            </div>
          </div>
        </div>

        {/* Jami Buyurtmalar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-effect space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Jami Buyurtmalar
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalOrders || 0} <span className="text-xs font-bold text-slate-400">ta</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Barcha davrlar hisobi
            </div>
          </div>
        </div>

        {/* Yangi Buyurtmalar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-effect space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kutilayotgan Zakazlar
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {stats.pendingOrders || 0} <span className="text-xs font-bold text-slate-400">ta</span>
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">
              {stats.pendingOrders > 0 ? "Oshxonada qabul qilish kutilmoqda" : "Hozircha yangi zakaz yo'q"}
            </div>
          </div>
        </div>

        {/* Bot Foydalanuvchilari */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-effect space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Foydalanuvchilar
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalUsers || 0} <span className="text-xs font-bold text-slate-400">ta</span>
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">
              Telegram Bot a'zolari
            </div>
          </div>
        </div>
      </div>

      {/* 3. So'nggi Buyurtmalar Jadvali */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              So'nggi buyurtmalar
            </h3>
            <p className="text-xs text-slate-400">
              Real-vaqtda qabul qilingan zakazlar monitoringi
            </p>
          </div>
          <button
            onClick={onGoToOrders}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <span>Barchasini ko'rish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100">
              <tr>
                <th className="pb-3 pl-2">Buyurtma ID</th>
                <th className="pb-3">Mijoz</th>
                <th className="pb-3">Telefon</th>
                <th className="pb-3">Summa</th>
                <th className="pb-3">Turi</th>
                <th className="pb-3">Holat</th>
                <th className="pb-3 text-right pr-2">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-xs text-slate-600">Hozircha hech qanday buyurtma kelib tushmadi.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Yangi buyurtmalar kelganda shu yerda paydo bo'ladi.</p>
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-slate-700">
                      #{ord.id}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {ord.customer_name ? ord.customer_name[0].toUpperCase() : 'M'}
                        </div>
                        <span className="font-bold text-slate-800">
                          {ord.customer_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500 font-mono">
                      {ord.customer_phone}
                    </td>
                    <td className="py-3.5 font-black text-slate-900">
                      {ord.total_amount ? ord.total_amount.toLocaleString() : '0'} so'm
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        ord.order_type === 'delivery' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {ord.order_type === 'delivery' ? '🚗 Yetkazib berish' : '🏃 Olib ketish'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        ord.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        ord.status === 'accepted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        ord.status === 'on_the_way' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ord.status === 'completed' ? 'bg-emerald-500' :
                          ord.status === 'pending' ? 'bg-amber-500' :
                          ord.status === 'accepted' ? 'bg-blue-500' :
                          ord.status === 'on_the_way' ? 'bg-purple-500' :
                          'bg-red-500'
                        }`} />
                        <span>{ord.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2 text-slate-400 text-[11px]">
                      {new Date(ord.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
