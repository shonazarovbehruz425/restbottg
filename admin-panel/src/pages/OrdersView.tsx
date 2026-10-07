import React, { useState } from 'react';
import api from '../lib/api';
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
  Navigation,
  ExternalLink,
  MessageSquare,
  Truck,
  Zap,
  Sliders,
  Search,
  LayoutGrid,
  List,
  Volume2,
  Radio,
  RefreshCw,
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
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onRefreshOrders?: () => void | Promise<void>;
}

function getElapsedInfo(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return { text: "Hozirgina", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60" };
    if (diffMins < 10) return { text: `${diffMins} daq oldin`, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60" };
    if (diffMins < 25) return { text: `${diffMins} daq oldin`, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60" };
    return { text: `${diffMins} daq oldin (Kechikmoqda!)`, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 animate-pulse font-black" };
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
  onAcceptAllPending,
  showToast,
  onRefreshOrders
}: OrdersViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resyncingId, setResyncingId] = useState<number | null>(null);

  const notify = showToast || ((msg: string) => alert(msg));

  const handleResyncChannel = async (orderId: number | string) => {
    try {
      setResyncingId(Number(orderId));
      const res = await api.post(`/orders/${orderId}/resync-channel`);
      if (res.data && res.data.success) {
        notify("✅ Buyurtma Telegram kanalida muvaffaqiyatli yangilandi!", 'success');
        if (onRefreshOrders) {
          onRefreshOrders();
        }
      } else {
        notify("⚠️ Telegram kanaliga yuborildi", 'info');
      }
    } catch (err: any) {
      notify(err?.response?.data?.error || "Kanalga yuborishda xatolik yuz berdi", 'error');
    } finally {
      setResyncingId(null);
    }
  };

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    ready: orders.filter((o) => o.status === 'ready').length,
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
    { key: 'pending', label: 'Kutilmoqda', count: counts.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    { key: 'accepted', label: 'Oshxonada', count: counts.accepted, icon: ChefHat, color: 'text-blue-600 dark:text-blue-400' },
    { key: 'ready', label: 'Tayyor (Olib ketish)', count: counts.ready, icon: CheckCircle2, color: 'text-teal-600 dark:text-teal-400' },
    { key: 'on_the_way', label: "Yo'lda", count: counts.on_the_way, icon: Bike, color: 'text-purple-600 dark:text-purple-400' },
    { key: 'completed', label: 'Yakunlangan', count: counts.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'cancelled', label: 'Bekor qilingan', count: counts.cancelled, icon: XCircle, color: 'text-red-600 dark:text-red-400' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-tab-content">
        <div className="h-20 bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Header & Mode Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Buyurtmalar Nazorati
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-200 dark:border-amber-800/60">
              {filteredOrders.length} ta
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Telegram Mini App orqali mijozlar yuborgan real-vaqt buyurtmalari
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Switch Grid / Table */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              title="Karta ko'rinishi"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Jadval ko'rinishi"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Qo'lda va Avtomatik qabul qilish switcher */}
          {onToggleAutoAccept && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onToggleAutoAccept(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !autoAccept
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-600 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span>Qo'lda</span>
              </button>
              <button
                onClick={() => onToggleAutoAccept(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  autoAccept
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
                    ? 'bg-slate-900 dark:bg-amber-500 text-white shadow-xs font-black'
                    : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${tab.color || ''}`} />}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  isActive ? 'bg-amber-500 dark:bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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
            className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* 4. Orders Display (Cards or Table) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-16 text-center shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Buyurtmalar topilmadi</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'Qidiruv bo\'yicha mos buyurtma topilmadi.' 
              : 'Tanlangan parametr bo\'yicha ayni paytda buyurtmalar mavjud emas.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/90 text-slate-400 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 pl-6">ID</th>
                  <th className="py-4">Mijoz</th>
                  <th className="py-4">Telefon</th>
                  <th className="py-4">Summa</th>
                  <th className="py-4">Yetkazish</th>
                  <th className="py-4">Holat</th>
                  <th className="py-4">Kanal</th>
                  <th className="py-4">Vaqt</th>
                  <th className="py-4 pr-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((ord: any) => {
                  const clientName = ord.customer_name || ord.user_name || ord.first_name || 'Mijoz';
                  const clientPhone = ord.customer_phone || ord.phone || '—';
                  const isDelivery = String(ord.order_type || ord.delivery_type || 'delivery').toLowerCase() === 'delivery';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 pl-6 font-mono font-black text-slate-900 dark:text-white">
                        #{ord.id}
                      </td>
                      <td className="py-4 font-bold text-slate-800 dark:text-slate-100">
                        {clientName}
                      </td>
                      <td className="py-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {clientPhone}
                      </td>
                      <td className="py-4 font-black text-slate-900 dark:text-white">
                        {ord.total_amount ? ord.total_amount.toLocaleString() : '0'} so'm
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          isDelivery 
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' 
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                        }`}>
                          {isDelivery ? <Truck className="w-3 h-3 text-blue-600 dark:text-blue-400" /> : <ShoppingBag className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                          <span>{isDelivery ? 'Yetkazish' : 'Olib ketish'}</span>
                        </span>
                        {ord.courier_name && isDelivery && (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5 truncate max-w-[120px]" title={`Kuryer: ${ord.courier_name} ${ord.courier_phone || ''}`}>
                            🛵 {ord.courier_name}
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${STATUS_BADGE[ord.status] || STATUS_BADGE.pending}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[ord.status] || STATUS_DOT.pending}`} />
                          <span>{STATUS_LABEL[ord.status] || ord.status}</span>
                        </span>
                        {ord.status === 'cancelled' && (
                          <div className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-1 max-w-[140px] truncate" title={`Bekor qildi: ${ord.cancelled_by || (ord.customer_name ? `Mijoz (${ord.customer_name})` : 'Mijoz')}`}>
                            🚫 {ord.cancelled_by || (ord.customer_name ? `Mijoz (${ord.customer_name})` : 'Mijoz')}
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        {ord.channel_message_id ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60" title={`Telegram kanalida xabar #${ord.channel_message_id}`}>
                            <Radio className="w-2.5 h-2.5 text-sky-500 animate-pulse" />
                            <span>#{ord.channel_message_id}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400" title="Kanalga xabar yuborilmagan">
                            <span>Yo'q</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-slate-400 dark:text-slate-400 font-medium text-[11px]">
                        {new Date(ord.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 pr-6 text-right space-x-1.5">
                        <button
                          onClick={() => handleResyncChannel(ord.id)}
                          disabled={resyncingId === ord.id}
                          className="px-2 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                          title="Telegram kanalida yangilash"
                        >
                          <RefreshCw className={`w-3 h-3 ${resyncingId === ord.id ? 'animate-spin text-sky-600' : ''}`} />
                          <span className="hidden xl:inline">Kanal</span>
                        </button>
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => onUpdateStatus(ord.id, 'accepted')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Qabul qilish
                          </button>
                        )}
                        {ord.status === 'accepted' && (
                          isDelivery ? (
                            <button
                              onClick={() => onUpdateStatus(ord.id, 'on_the_way')}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Kuryerga berish
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateStatus(ord.id, 'ready')}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Tayyor (Olib ketish)
                            </button>
                          )
                        )}
                        {ord.status === 'ready' && !isDelivery && (
                          <button
                            onClick={() => onUpdateStatus(ord.id, 'completed')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Topshirildi
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
                        {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                          <button
                            onClick={() => onUpdateStatus(ord.id, 'cancelled')}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-800/60 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                            title="Buyurtmani bekor qilish"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Bekor qilish</span>
                          </button>
                        )}
                        {onDeleteOrder && (
                          <button
                            onClick={() => onDeleteOrder(ord.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
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
            const isDelivery = String(order.order_type || order.delivery_type || 'delivery').toLowerCase() === 'delivery';
            const clientName = order.customer_name || order.user_name || order.first_name || 'Mijoz';
            const clientPhone = order.customer_phone || order.phone || '';
            const cleanPhone = clientPhone.replace(/[^\d+]/g, '');
            const clientAddress = order.address || order.delivery_address || '';
            const cleanDisplayAddress = clientAddress.replace(/\s*\([0-9.]+[,\s]+[0-9.]+\)/g, '').trim();
            const clientNotes = order.notes || order.comment || '';
            const elapsed = getElapsedInfo(order.created_at);

            // Koordinatalarni aniqlash: order.latitude/longitude yoki manzildan
            const rawLat = order.latitude !== null && order.latitude !== undefined ? Number(order.latitude) : null;
            const rawLng = order.longitude !== null && order.longitude !== undefined ? Number(order.longitude) : null;
            let orderLat = (rawLat && !isNaN(rawLat) && rawLat !== 0) ? rawLat : null;
            let orderLng = (rawLng && !isNaN(rawLng) && rawLng !== 0) ? rawLng : null;

            if ((!orderLat || !orderLng) && clientAddress) {
              const coordMatch = clientAddress.match(/([0-9]{2}\.[0-9]{3,})[,\s]+([0-9]{2}\.[0-9]{3,})/);
              if (coordMatch) {
                orderLat = Number(coordMatch[1]);
                orderLng = Number(coordMatch[2]);
              }
            }

            const hasExactGps = Boolean(orderLat && orderLng);
            const isLiveGps = order.location_source ? (order.location_source === 'live_gps') : hasExactGps;
            const googleMapsUrl = hasExactGps
              ? `https://www.google.com/maps?q=${orderLat},${orderLng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanDisplayAddress || clientAddress)}`;
            const yandexMapsUrl = hasExactGps
              ? `https://yandex.uz/maps/?pt=${orderLng},${orderLat}&z=17&l=map`
              : `https://yandex.uz/maps/?text=${encodeURIComponent(cleanDisplayAddress || clientAddress)}`;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs card-hover-effect flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Card Header: Order ID, Type, Timer & Status */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-md border border-transparent dark:border-slate-700">
                        #{order.id}
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          {isDelivery ? (
                            <>
                              <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Yetkazib berish</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="text-amber-700 dark:text-amber-300">🏃 Olib ketish (Samovivoz)</span>
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
                      <div className="flex flex-col items-end">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.status] || STATUS_DOT.pending}`} />
                          <span>{STATUS_LABEL[order.status] || order.status}</span>
                        </span>
                        {order.status === 'cancelled' && (
                          <span className="text-[10px] font-bold text-red-500 dark:text-red-400 mt-1 max-w-[150px] truncate text-right" title={order.cancelled_by || (order.customer_name ? `Mijoz (${order.customer_name})` : 'Mijoz')}>
                            {order.cancelled_by || (order.customer_name ? `Mijoz (${order.customer_name})` : 'Mijoz')}
                          </span>
                        )}
                      </div>

                      {onDeleteOrder && (
                        <button
                          onClick={() => onDeleteOrder(order.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Buyurtmani o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div className="bg-slate-50/90 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                          {clientName ? clientName[0].toUpperCase() : 'M'}
                        </div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {clientName}
                        </span>
                      </div>

                      {clientPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{clientPhone}</span>
                        </a>
                      )}
                    </div>

                    {!isDelivery ? (
                      <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                              <span>🏪 Restorandan olib ketish</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded">Samovivoz</span>
                            </div>
                            <p className="text-[11px] font-medium text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-tight">
                              Mijoz buyurtmani restorandan o'zi olib ketadi. Kuryer talab etilmaydi.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (cleanDisplayAddress || clientAddress || hasExactGps) && (
                      <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800/80">
                        {/* Lokatsiya kiritish usuli: Mini App GPS yoki Qo'lda yozilgan */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          {isLiveGps ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Mini App: "Lokatsiyani yuborish" bosilgan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Qo'lda yozilgan manzil</span>
                            </span>
                          )}

                          {hasExactGps ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                              <Navigation className="w-2.5 h-2.5 shrink-0" />
                              <span>GPS: {orderLat?.toFixed(5)}, {orderLng?.toFixed(5)}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              (GPS yo'q)
                            </span>
                          )}
                        </div>

                        {/* Manzil matni */}
                        <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="flex-1 text-[11px] leading-relaxed font-semibold">
                            {cleanDisplayAddress || clientAddress || "Aniq lokatsiya xaritada belgilangan"}
                          </span>
                        </div>

                        {/* Xarita havolalari */}
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60 transition-colors shadow-2xs"
                            title={hasExactGps ? "Google Xaritada aniq GPS nuqtasini ochish" : "Google Xaritada qidirish"}
                          >
                            <span>Google Xarita</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <a
                            href={yandexMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60 transition-colors shadow-2xs"
                            title={hasExactGps ? "Yandex Xaritada aniq GPS nuqtasini ochish" : "Yandex Xaritada qidirish"}
                          >
                            <span>Yandex</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {clientNotes && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>Izoh: {clientNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Telegram Channel Sync & Courier Status Bar */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        order.channel_message_id
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <Radio className={`w-3.5 h-3.5 ${order.channel_message_id ? 'animate-pulse text-sky-500' : ''}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                          <span>Kanal:</span>
                          {order.channel_message_id ? (
                            <span className="text-sky-600 dark:text-sky-400 font-black">Xabar #{order.channel_message_id}</span>
                          ) : (
                            <span className="text-slate-400 font-medium">Ulanmagan</span>
                          )}
                        </div>
                        {order.courier_name && isDelivery && (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold truncate mt-0.5" title={`Kuryer: ${order.courier_name} ${order.courier_phone || ''}`}>
                            🛵 Kuryer: {order.courier_name} {order.courier_phone ? `(${order.courier_phone})` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResyncChannel(order.id)}
                      disabled={resyncingId === order.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-slate-200/80 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700/60 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 disabled:opacity-50"
                      title="Telegram kanalidagi xabarni qayta sinxronlashtirish"
                    >
                      <RefreshCw className={`w-3 h-3 ${resyncingId === order.id ? 'animate-spin text-sky-500' : ''}`} />
                      <span>Kanalga yangilash</span>
                    </button>
                  </div>

                  {/* Items Receipt */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-400 tracking-wider">
                      Buyurtma Tarkibi:
                    </span>
                    <div className="space-y-1.5 bg-white dark:bg-[#0F172A] max-h-36 overflow-y-auto pr-1">
                      {order.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-[10px] flex items-center justify-center">
                              {it.quantity}x
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{it.product_name || it.name}</span>
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {((it.price || 0) * (it.quantity || 1)).toLocaleString()} so'm
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-500 dark:text-slate-400">Jami to'lov:</span>
                      <span className="font-black text-base text-amber-600 dark:text-amber-400">
                        {order.total_amount?.toLocaleString()} so'm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
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
                    isDelivery ? (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'on_the_way')}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Kuryerga topshirish</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'ready')}
                        className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tayyor (Olib ketishga)</span>
                      </button>
                    )
                  )}

                  {order.status === 'ready' && !isDelivery && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'completed')}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mijozga topshirildi</span>
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
                      className="px-3.5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Bekor qilish
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <div className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-center text-xs font-extrabold border border-emerald-200 dark:border-emerald-800/60">
                      {isDelivery ? "Muvaffaqiyatli yetkazildi" : "Mijoz olib ketdi (Yakunlandi)"}
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="w-full py-3 px-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl text-center text-xs border border-red-200/80 dark:border-red-800/60 shadow-xs space-y-1">
                      <div className="flex items-center justify-center gap-1.5 font-black text-red-600 dark:text-red-400 text-xs">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span>
                          Bekor qildi:{' '}
                          <span className="font-extrabold text-red-700 dark:text-red-200">
                            {order.cancelled_by || (order.customer_name ? `Mijoz (${order.customer_name})` : 'Mijoz')}
                          </span>
                        </span>
                      </div>
                      {order.cancel_reason && (
                        <div className="text-[11px] text-red-600/80 dark:text-red-400/80 font-medium">
                          Sabab: {order.cancel_reason}
                        </div>
                      )}
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
