import React, { useState } from 'react';
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
  MessageSquare,
  Truck,
  Zap,
  Sliders,
  Search,
  LayoutGrid,
  List,
  AlertCircle,
  Volume2,
  LucideIcon
} from 'lucide-react';
import { STATUS_LABEL, STATUS_BADGE, STATUS_DOT } from '../lib/status';

interface FilterTab {
  key: string;
  label: string;
  count: number;
  icon: LucideIcon | null;
  color?: string;
}

interface OrdersViewProps {
  orders: any[];
  loading?: boolean;
  orderFilter: string;
  setOrderFilter: (filter: string) => void;
  onUpdateStatus: (orderId: number | string, status: string) => void;
  onDeleteOrder?: (orderId: number | string) => void;
  autoAccept?: boolean;
  onToggleAutoAccept?: (val: boolean) => void;
  onAcceptAllPending?: () => void;
}

function getElapsedInfo(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return { text: "Hozirgina", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (diffMins < 10) return { text: `${diffMins} daq oldin`, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (diffMins < 25) return { text: `${diffMins} daq oldin`, color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { text: `${diffMins} daq oldin (Kechikmoqda!)`, color: "text-red-600 bg-red-50 border-red-200 animate-pulse font-black" };
  } catch {
    return { text: "", color: "" };
  }
}

export default function OrdersView({ 
  orders, 
  loading, 
  orderFilter, 
  setOrderFilter, 
  onUpdateStatus, 
  onDeleteOrder,
  autoAccept = false,
  onToggleAutoAccept,
  onAcceptAllPending
}: OrdersViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    on_the_way: orders.filter((o) => o.status === 'on_the_way').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter ? o.status === orderFilter : true;
    const clientName = (o.customer_name || o.user_name || o.first_name || '').toLowerCase();
    const clientPhone = (o.customer_phone || o.phone || '').toLowerCase();
    const orderIdStr = String(o.id || '');
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || clientName.includes(q) || clientPhone.includes(q) || orderIdStr.includes(q);
    return matchesFilter && matchesSearch;
  });

  const filterTabs: FilterTab[] = [
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
        <div className="h-20 bg-white rounded-3xl border border-slate-200/80 p-5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Header & Mode Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Buyurtmalar Nazorati
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-200">
              {filteredOrders.length} ta
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Telegram Mini App orqali mijozlar yuborgan real-vaqt buyurtmalari
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Switch Grid / Table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              title="Karta ko'rinishi"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Jadval ko'rinishi"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Qo'lda va Avtomatik qabul qilish switcher */}
          {onToggleAutoAccept && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => onToggleAutoAccept(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !autoAccept
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-slate-700" />
                <span>Qo'lda</span>
              </button>
              <button
                onClick={() => onToggleAutoAccept(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  autoAccept
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${autoAccept ? 'fill-amber-300 text-amber-300' : 'text-slate-400'}`} />
                <span>Avto-qabul</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Urgent Audio / Mode Announcement Banner */}
      {counts.pending > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-3xl shadow-lg shadow-amber-500/20 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="font-black text-sm tracking-tight flex items-center gap-2">
                <span>Diqqat! {counts.pending} ta yangi buyurtma kutilmoqda</span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Ovozli signal yangramoqda. Buyurtmani qabul qilganingizda ovoz to'xtaydi.
              </p>
            </div>
          </div>

          {onAcceptAllPending && (
            <button
              onClick={onAcceptAllPending}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-amber-700 font-black rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Barchasini qabul qilish ({counts.pending})
            </button>
          )}
        </div>
      )}

      {/* 3. Search & Category Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {filterTabs.map((tab) => {
            const isActive = orderFilter === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setOrderFilter(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${tab.color || ''}`} />}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buyurtma ID, ism yoki tel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* 4. Orders Display (Cards or Table) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">Buyurtmalar topilmadi</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'Qidiruv bo\'yicha mos buyurtma topilmadi.' 
              : 'Tanlangan parametr bo\'yicha ayni paytda buyurtmalar mavjud emas.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6">ID</th>
                  <th className="py-4">Mijoz</th>
                  <th className="py-4">Telefon</th>
                  <th className="py-4">Summa</th>
                  <th className="py-4">Yetkazish</th>
                  <th className="py-4">Holat</th>
                  <th className="py-4">Vaqt</th>
                  <th className="py-4 pr-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord: any) => {
                  const clientName = ord.customer_name || ord.user_name || ord.first_name || 'Mijoz';
                  const clientPhone = ord.customer_phone || ord.phone || '—';
                  const isDelivery = (ord.order_type || ord.delivery_type) === 'delivery';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 pl-6 font-mono font-black text-slate-900">
                        #{ord.id}
                      </td>
                      <td className="py-4 font-bold text-slate-800">
                        {clientName}
                      </td>
                      <td className="py-4 text-slate-600 font-mono text-[11px]">
                        {clientPhone}
                      </td>
                      <td className="py-4 font-black text-slate-900">
                        {ord.total_amount ? ord.total_amount.toLocaleString() : '0'} so'm
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          isDelivery ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isDelivery ? <Truck className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                          <span>{isDelivery ? 'Yetkazish' : 'Olib ketish'}</span>
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${STATUS_BADGE[ord.status] || STATUS_BADGE.pending}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[ord.status] || STATUS_DOT.pending}`} />
                          <span>{STATUS_LABEL[ord.status] || ord.status}</span>
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 font-medium text-[11px]">
                        {new Date(ord.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 pr-6 text-right space-x-1.5">
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => onUpdateStatus(ord.id, 'accepted')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Qabul qilish
                          </button>
                        )}
                        {ord.status === 'accepted' && (
                          <button
                            onClick={() => onUpdateStatus(ord.id, 'on_the_way')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Kuryerga berish
                          </button>
                        )}
                        {ord.status === 'on_the_way' && (
                          <button
                            onClick={() => onUpdateStatus(ord.id, 'completed')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Yetkazildi
                          </button>
                        )}
                        {onDeleteOrder && (
                          <button
                            onClick={() => onDeleteOrder(ord.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order: any) => {
            const isDelivery = (order.order_type || order.delivery_type) === 'delivery';
            const clientName = order.customer_name || order.user_name || order.first_name || 'Mijoz';
            const clientPhone = order.customer_phone || order.phone || '';
            const cleanPhone = clientPhone.replace(/[^\d+]/g, '');
            const clientAddress = order.address || order.delivery_address || '';
            const clientNotes = order.notes || order.comment || '';
            const elapsed = getElapsedInfo(order.created_at);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs card-hover-effect flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Card Header: Order ID, Type, Timer & Status */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-md">
                        #{order.id}
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          {isDelivery ? (
                            <>
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Yetkazib berish</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                              <span>Olib ketish</span>
                            </>
                          )}
                        </div>
                        {elapsed.text && (
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 w-fit ${elapsed.color}`}>
                            {elapsed.text}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}>
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
                  <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 font-black text-xs flex items-center justify-center border border-amber-500/20">
                          {clientName ? clientName[0].toUpperCase() : 'M'}
                        </div>
                        <span className="font-extrabold text-xs text-slate-900">
                          {clientName}
                        </span>
                      </div>

                      {clientPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{clientPhone}</span>
                        </a>
                      )}
                    </div>

                    {clientAddress && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="flex-1 text-[11px] leading-relaxed">
                          {clientAddress}
                        </span>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(clientAddress)}`}
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

                    {clientNotes && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Izoh: {clientNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Items Receipt */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Buyurtma Tarkibi:
                    </span>
                    <div className="space-y-1.5 bg-white max-h-36 overflow-y-auto pr-1">
                      {order.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 font-black text-[10px] flex items-center justify-center">
                              {it.quantity}x
                            </span>
                            <span className="font-semibold text-slate-800">{it.product_name || it.name}</span>
                          </div>
                          <span className="font-bold text-slate-700">
                            {((it.price || 0) * (it.quantity || 1)).toLocaleString()} so'm
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-dashed border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-500">Jami to'lov:</span>
                      <span className="font-black text-base text-amber-600">
                        {order.total_amount?.toLocaleString()} so'm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'accepted')}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Qabul qilish (Oshxona)</span>
                    </button>
                  )}

                  {order.status === 'accepted' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'on_the_way')}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Kuryerga topshirish</span>
                    </button>
                  )}

                  {order.status === 'on_the_way' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'completed')}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Yetkazildi deb belgilash</span>
                    </button>
                  )}

                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      className="px-3.5 py-3 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Bekor qilish
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs font-extrabold border border-emerald-200">
                      Muvaffaqiyatli yetkazildi
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="w-full py-2.5 bg-red-50 text-red-800 rounded-xl text-center text-xs font-extrabold border border-red-200">
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
