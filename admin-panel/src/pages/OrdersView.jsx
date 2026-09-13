import React from 'react';
import {
  ShoppingBag,
  Trash2,
  Clock,
  ChefHat,
  Bike,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { STATUS_LABEL, STATUS_BADGE, STATUS_DOT } from '../lib/status';

export default function OrdersView({ orders, loading, orderFilter, setOrderFilter, onUpdateStatus, onDeleteOrder }) {
  // orders har doim to'liq (App.jsx da status'siz yuklanadi),
  // countlar va filtr CLIENT'da hisoblanadi.
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    on_the_way: orders.filter(o => o.status === 'on_the_way').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const filteredOrders = orderFilter
    ? orders.filter(o => o.status === orderFilter)
    : orders;

  const filterTabs = [
    { key: '', label: 'Barchasi', count: counts.all, icon: null },
    { key: 'pending', label: 'Kutilmoqda', count: counts.pending, icon: Clock, color: 'text-amber-600' },
    { key: 'accepted', label: 'Oshxonada', count: counts.accepted, icon: ChefHat, color: 'text-blue-600' },
    { key: 'on_the_way', label: "Yo'lda", count: counts.on_the_way, icon: Bike, color: 'text-purple-600' },
    { key: 'completed', label: 'Yetkazildi', count: counts.completed, icon: CheckCircle2, color: 'text-emerald-600' },
    { key: 'cancelled', label: 'Bekor qilingan', count: counts.cancelled, icon: XCircle, color: 'text-red-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-tab-content">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-3 w-80 max-w-full bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 animate-pulse">
              <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
              <div className="h-16 bg-slate-100 rounded-2xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Buyurtmalar Nazorati</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {filteredOrders.length} ta
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Telegram Mini App va bot orqali tushgan real-vaqt buyurtmalari
          </p>
        </div>
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto">
        {filterTabs.map((tab) => {
          const isActive = orderFilter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setOrderFilter(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${tab.color || ''}`} />}
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/70 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid or Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Hech qanday buyurtma topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {orderFilter
              ? 'Tanlangan filtr bo\'yicha buyurtmalar mavjud emas.'
              : 'Mijozlar Telegram Mini App orqali buyurtma berganda bu yerda avtomatik ko\'rinadi.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isDelivery = order.order_type === 'delivery';
            const cleanPhone = order.customer_phone?.replace(/[^\d+]/g, '');

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs card-hover-effect flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Order ID, Date & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        #{order.id}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-800">
                          {isDelivery ? '🚗 Yetkazib berish' : '🏃 Olib ketish'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {new Date(order.created_at).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.status] || STATUS_DOT.pending}`} />
                        <span>{STATUS_LABEL[order.status] || order.status}</span>
                      </span>

                      {onDeleteOrder && (
                        <button
                          onClick={() => onDeleteOrder(order.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Buyurtmani o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-700 font-bold text-xs flex items-center justify-center">
                          {order.customer_name ? order.customer_name[0].toUpperCase() : 'M'}
                        </div>
                        <span className="font-bold text-xs text-slate-900">
                          {order.customer_name}
                        </span>
                      </div>

                      {order.customer_phone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all shadow-xs"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{order.customer_phone}</span>
                        </a>
                      )}
                    </div>

                    {order.address && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="flex-1 text-[11px] leading-relaxed">
                          {order.address}
                        </span>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 shrink-0 font-bold"
                          title="Xaritada ko'rish"
                        >
                          <span>Xarita</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}

                    {order.notes && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-200/50">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Izoh: {order.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Items List (Receipt style) */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                      Buyurtma tarkibi:
                    </div>
                    <div className="space-y-1 bg-white max-h-36 overflow-y-auto pr-1">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 text-xs border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                              {it.quantity}x
                            </span>
                            <span className="font-semibold text-slate-800">{it.product_name}</span>
                          </div>
                          <span className="font-bold text-slate-600">
                            {(it.price * it.quantity).toLocaleString()} so'm
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-500">Jami to'lov:</span>
                      <span className="font-black text-base text-amber-600">
                        {order.total_amount?.toLocaleString()} so'm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'accepted')}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Qabul qilish (Oshxona)</span>
                    </button>
                  )}

                  {order.status === 'accepted' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'on_the_way')}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Kuryerga berish</span>
                    </button>
                  )}

                  {order.status === 'on_the_way' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'completed')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Yetkazildi deb belgilash</span>
                    </button>
                  )}

                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Bekor qilish
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-center text-xs font-bold border border-emerald-200">
                      Muvaffaqiyatli yakunlangan buyurtma
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="w-full py-2 bg-red-50 text-red-700 rounded-xl text-center text-xs font-bold border border-red-200">
                      Ushbu buyurtma bekor qilingan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
