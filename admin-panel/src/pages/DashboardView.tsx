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
  Sparkles, 
  Truck,
  ChefHat,
  CheckCircle2,
  Activity,
  Flame,
  ArrowUpRight
} from 'lucide-react';

import { STATUS_LABEL, STATUS_BADGE, STATUS_DOT } from '../lib/status';
import { StatsData } from '../types';

interface DashboardViewProps {
  stats: StatsData;
  loading?: boolean;
  onGoToOrders: () => void;
  onGoToProducts?: () => void;
  onGoToCouriers?: () => void;
}

export default function DashboardView({
  stats,
  loading: _loading,
  onGoToOrders,
  onGoToProducts,
  onGoToCouriers
}: DashboardViewProps) {
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli oqshom';

  const currentDate = new Date().toLocaleDateString('uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const avgOrderValue = stats.totalOrders > 0 
    ? Math.round(stats.totalRevenue / stats.totalOrders) 
    : 0;

  // Pipeline stats
  const recent = stats.recentOrders || [];
  const pendingCount = stats.pendingOrders || 0;
  const inKitchenCount = recent.filter((o: any) => o.status === 'accepted').length;
  const onTheWayCount = recent.filter((o: any) => o.status === 'on_the_way').length;
  const completedCount = recent.filter((o: any) => o.status === 'completed').length;

  return (
    <div className="space-y-7 animate-tab-content">
      {/* 1. Hero Executive Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
        {/* Ambient radial glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Jonli Boshqaruv</span>
              </span>
              <span className="text-xs text-slate-400 font-medium capitalize">
                {currentDate}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {greeting}, Boshqaruvchi!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Restoran buyurtmalari, kuryerlar navbatchiligi va savdo ko'rsatkichlari real-vaqt rejimida yangilanmoqda.
            </p>
          </div>

          {/* Quick shortcuts bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0">
            {onGoToProducts && (
              <button
                onClick={onGoToProducts}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Taom</span>
              </button>
            )}

            {onGoToCouriers && (
              <button
                onClick={onGoToCouriers}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-xs"
              >
                <Bike className="w-4 h-4 text-amber-400" />
                <span>Kuryer Taklifi</span>
              </button>
            )}

            <button
              onClick={onGoToOrders}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-xs"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Buyurtmalar</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Jami Savdo */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs card-hover-effect relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Jami Tushum
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-1">so'm</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">O'rtacha chek:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{avgOrderValue.toLocaleString()} so'm</span>
          </div>
        </div>

        {/* KPI 2: Jami Buyurtmalar */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs card-hover-effect relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Buyurtmalar Soni
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {stats.totalOrders || 0}
                <span className="text-xs font-bold text-slate-400 ml-1">ta</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Barcha davrlar hisobi:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Faol savdo</span>
            </span>
          </div>
        </div>

        {/* KPI 3: Kutilayotgan Zakazlar */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs card-hover-effect relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Kutilayotgan Zakazlar
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-1">
                {stats.pendingOrders || 0}
                <span className="text-xs font-bold text-slate-400 ml-1">ta</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Clock className={`w-6 h-6 ${stats.pendingOrders > 0 ? 'animate-spin' : ''}`} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Oshxona holati:</span>
            <span className={`font-bold ${stats.pendingOrders > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-600 dark:text-slate-400'}`}>
              {stats.pendingOrders > 0 ? "Qabul kutilmoqda" : "Barchasi tayyor"}
            </span>
          </div>
        </div>

        {/* KPI 4: Bot Foydalanuvchilari */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs card-hover-effect relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Bot Foydalanuvchilari
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {stats.totalUsers || 0}
                <span className="text-xs font-bold text-slate-400 ml-1">nafar</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Auditoriya qamrovi:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">Telegram Bot</span>
          </div>
        </div>
      </div>

      {/* 3. Pipeline Breakdown Bar */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Activity className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                Buyurtmalar Jarayoni (Pipeline)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Oshxonadan mijoz qo'ligacha bo'lgan bosqichlar holati</p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Jami: {recent.length} ta so'nggi zakaz
          </span>
        </div>

        {/* Visual Multi-segment Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Kutilmoqda</span>
                <span className="text-base font-black text-amber-700 dark:text-amber-400">{pendingCount} ta</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Oshxonada</span>
                <span className="text-base font-black text-blue-700 dark:text-blue-400">{inKitchenCount} ta</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Yo'lda</span>
                <span className="text-base font-black text-purple-700 dark:text-purple-400">{onTheWayCount} ta</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Yetkazildi</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">{completedCount} ta</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. So'nggi Buyurtmalar Jadvali */}
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
              So'nggi Kelgan Buyurtmalar
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
              Jonli buyurtmalar oqimi va tezkor boshqaruv
            </p>
          </div>

          <button
            onClick={onGoToOrders}
            className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>Barchasini ko'rish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-900/90 text-slate-400 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 pl-6">Buyurtma</th>
                <th className="py-3.5">Mijoz</th>
                <th className="py-3.5">Telefon</th>
                <th className="py-3.5">Summa</th>
                <th className="py-3.5">Yetkazish Turi</th>
                <th className="py-3.5">Holat</th>
                <th className="py-3.5 text-right pr-6">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(!recent || recent.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-600">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Hozircha hech qanday buyurtma kelib tushmadi</p>
                    <p className="text-xs text-slate-400 mt-1">Mijozlar buyurtma berganda ushbu jadvalda avtomatik ko'rinadi.</p>
                  </td>
                </tr>
              ) : (
                recent.slice(0, 8).map((ord: any) => {
                  const clientName = ord.customer_name || ord.user_name || ord.first_name || 'Mijoz';
                  const clientPhone = ord.customer_phone || ord.phone || "—";
                  const orderType = ord.order_type || ord.delivery_type || 'delivery';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 pl-6">
                        <span className="font-mono font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          #{ord.id}
                        </span>
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs shrink-0">
                            {clientName ? clientName[0].toUpperCase() : 'M'}
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {clientName}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 text-slate-600 dark:text-slate-400 font-mono text-[11px] font-semibold">
                        {clientPhone}
                      </td>

                      <td className="py-4 font-black text-slate-900 dark:text-white text-sm">
                        {ord.total_amount ? ord.total_amount.toLocaleString() : '0'} <span className="text-[11px] text-amber-600 dark:text-amber-400">so'm</span>
                      </td>

                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold ${
                          orderType === 'delivery' 
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {orderType === 'delivery' ? (
                            <>
                              <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Yetkazib berish</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                              <span>Olib ketish</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${STATUS_BADGE[ord.status] || 'bg-red-50 text-red-700 border border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[ord.status] || 'bg-red-500'}`} />
                          <span>{STATUS_LABEL[ord.status] || ord.status}</span>
                        </span>
                      </td>

                      <td className="py-4 text-right pr-6 text-slate-400 dark:text-slate-400 font-medium text-[11px]">
                        {new Date(ord.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
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
