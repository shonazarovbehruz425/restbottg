import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, ChefHat, Bike, ShoppingBag } from 'lucide-react';

import type { OrderItem, OrderRecord } from '../types';

export type { OrderItem, OrderRecord };

interface HistoryViewProps {
  orders: OrderRecord[];
  onGoToMenu: () => void;
}

export default function HistoryView({ orders, onGoToMenu }: HistoryViewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'on_the_way'].includes(o.status));
  const completedOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const filteredOrders = 
    filter === 'active' ? activeOrders :
    filter === 'completed' ? completedOrders :
    orders;

  const getStatusBadge = (status: OrderRecord['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span>Kutilmoqda</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300">
            <ChefHat className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Oshxonada</span>
          </span>
        );
      case 'on_the_way':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300">
            <Bike className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Kuryer yo'lda</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Yetkazildi</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            <span>Bekor qilingan</span>
          </span>
        );
    }
  };

  return (
    <main className="max-w-md mx-auto px-4.5 pt-2 pb-6 space-y-4">
      {/* Filtr tablari */}
      <div className="flex bg-[#EEF4EF] dark:bg-[#141C16] p-1 rounded-2xl gap-1 border border-transparent dark:border-neutral-800">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white dark:bg-[#1A241E] text-[#11311F] dark:text-[#E8F0EA] shadow-soft'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          Barchasi ({orders.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-white dark:bg-[#1A241E] text-[#11311F] dark:text-[#E8F0EA] shadow-soft'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          Faol ({activeOrders.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-white dark:bg-[#1A241E] text-[#11311F] dark:text-[#E8F0EA] shadow-soft'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          Tarix ({completedOrders.length})
        </button>
      </div>

      {/* Buyurtmalar ro'yxati */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3.5">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white dark:bg-[#1A241E] rounded-[26px] p-4.5 border border-neutral-200/70 dark:border-neutral-800 shadow-soft space-y-3"
            >
              {/* Yuqori qism: ID va Holat */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 block uppercase tracking-wider">
                    Buyurtma kodi
                  </span>
                  <span className="text-sm font-black text-[#11311F] dark:text-[#E8F0EA]">
                    #{ord.id}
                  </span>
                </div>
                {getStatusBadge(ord.status)}
              </div>

              {/* Taomlar ro'yxati */}
              <div className="bg-[#F8FAF8] dark:bg-[#141C16] p-3 rounded-2xl border border-neutral-100/90 dark:border-neutral-800/80 space-y-2">
                {ord.items?.map((it, idx) => (
                  <div key={`${it.product_name}-${idx}`} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                      {it.product_name} <span className="text-neutral-400 dark:text-neutral-500 font-bold">x {it.quantity}</span>
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {(it.price * it.quantity).toLocaleString()} so'm
                    </span>
                  </div>
                ))}
              </div>

              {/* Manzil va ma'lumot */}
              {ord.address && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  📍 {ord.address}
                </p>
              )}

              {/* Pastki qism: Sana va Jami summa */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                  {new Date(ord.created_at).toLocaleString('uz-UZ', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold block">Jami to'lov:</span>
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-400">
                    {ord.total_amount.toLocaleString()} so'm
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1A241E] rounded-[28px] p-8 text-center border border-neutral-200/70 dark:border-neutral-800 shadow-soft space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EAF7EE] dark:bg-[#162D1E] text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-black text-sm text-[#11311F] dark:text-[#E8F0EA]">
              {filter === 'active' ? "Hozirda faol buyurtmalar yo'q" : "Buyurtmalar tarixi bo'sh"}
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {filter === 'active' 
                ? "Yangi buyurtma berganingizda uning bosqichma-bosqich holati bu yerda ko'rinadi."
                : "Restoranimizning lazzatli taomlaridan buyurtma berishni boshlang!"}
            </p>
          </div>
          <button
            onClick={onGoToMenu}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white rounded-2xl font-bold text-xs shadow-soft transition-all cursor-pointer"
          >
            Menyuga o'tish
          </button>
        </div>
      )}
    </main>
  );
}
