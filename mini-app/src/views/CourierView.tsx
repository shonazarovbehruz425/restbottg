import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  RefreshCw, 
  Power, 
  Package, 
  ArrowRight
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export interface CourierData {
  id: number;
  telegram_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  status: string;
  is_online: number;
}

export interface CourierOrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

export interface CourierOrder {
  id: number;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  payment_method: string;
  status: string;
  notes?: string;
  total_amount: number;
  delivery_fee: number;
  created_at: string;
  items?: CourierOrderItem[];
}

interface CourierViewProps {
  courier: CourierData;
  onSwitchToCustomer: () => void;
  onRefreshCourier: () => Promise<void>;
}

export default function CourierView({ courier, onSwitchToCustomer, onRefreshCourier }: CourierViewProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'my_active' | 'history'>('available');
  const [availableOrders, setAvailableOrders] = useState<CourierOrder[]>([]);
  const [myActiveOrders, setMyActiveOrders] = useState<CourierOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<CourierOrder[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(courier.is_online === 1);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setIsOnline(courier.is_online === 1);
  }, [courier.is_online]);

  useEffect(() => {
    fetchOrders();
  }, [courier.id, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [availRes, activeRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/couriers/orders/available`),
        axios.get(`${API_BASE}/couriers/orders/my-active/${courier.telegram_id}`),
        axios.get(`${API_BASE}/couriers/orders/my-history/${courier.telegram_id}`)
      ]);

      setAvailableOrders(availRes.data.data || []);
      setMyActiveOrders(activeRes.data.data || []);
      setHistoryOrders(historyRes.data.data || []);
    } catch (err) {
      console.error('Kuryer buyurtmalarini yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    try {
      const nextStatus = !isOnline;
      await axios.post(`${API_BASE}/couriers/toggle-online`, {
        courier_id: courier.id,
        is_online: nextStatus
      });
      setIsOnline(nextStatus);
      await onRefreshCourier();
    } catch (err: any) {
      alert('Holatni o\'zgartirishda xatolik yuz berdi');
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    if (!window.confirm(`#${orderId} buyurtmasini qabul qilib, yo'lga chiqmoqchimisiz?`)) {
      return;
    }

    try {
      setActionLoadingId(orderId);
      const res = await axios.post(`${API_BASE}/couriers/orders/accept`, {
        order_id: orderId,
        courier_id: courier.id
      });

      if (res.data.success) {
        alert('🛵 Buyurtma qabul qilindi! Mijozga xabar jo\'natildi.');
        setActiveTab('my_active');
        fetchOrders();
      }
    } catch (err: any) {
      alert('Buyurtmani qabul qilishda xato: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeliverOrder = async (orderId: number) => {
    if (!window.confirm(`#${orderId} buyurtmasi mijozga to'liq yetkazib berildimi?`)) {
      return;
    }

    try {
      setActionLoadingId(orderId);
      const res = await axios.post(`${API_BASE}/couriers/orders/deliver`, {
        order_id: orderId,
        courier_id: courier.id
      });

      if (res.data.success) {
        alert('🎉 Buyurtma muvaffaqiyatli yetkazildi deb belgilandi!');
        fetchOrders();
      }
    } catch (err: any) {
      alert('Yetkazildi deb belgilashda xato: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open maps link
  const openMapNavigation = (order: CourierOrder) => {
    if (order.latitude && order.longitude) {
      // Yandex Maps URL
      const yandexUrl = `https://yandex.uz/maps/?pt=${order.longitude},${order.latitude}&z=16&l=map`;
      window.open(yandexUrl, '_blank');
    } else if (order.address) {
      const query = encodeURIComponent(order.address);
      window.open(`https://yandex.uz/maps/?text=${query}`, '_blank');
    }
  };

  const currentList = 
    activeTab === 'available' ? availableOrders :
    activeTab === 'my_active' ? myActiveOrders :
    historyOrders;

  return (
    <main className="max-w-md mx-auto px-4.5 pt-3 pb-8 space-y-4">
      {/* 1. Kuryer Dashboard Header Card */}
      <div className="bg-gradient-to-br from-[#11311F] to-[#1E4D33] text-white rounded-[26px] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-xs">
              <Bike className="w-3 h-3 text-amber-400" />
              Kuryer Paneli
            </span>
            <h2 className="text-lg font-black mt-2 leading-tight">
              {courier.first_name || 'Kuryer'} {courier.last_name || ''}
            </h2>
            {courier.username && (
              <span className="text-xs text-white/70">@{courier.username}</span>
            )}
          </div>

          {/* Online / Offline switch */}
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isOnline 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 relative z-10 text-center">
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-white/70 uppercase block font-medium">Faol</span>
            <span className="text-base font-black text-amber-300">{myActiveOrders.length} ta</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-white/70 uppercase block font-medium">Tayyor</span>
            <span className="text-base font-black text-emerald-300">{availableOrders.length} ta</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-white/70 uppercase block font-medium">Tarix</span>
            <span className="text-base font-black text-white">{historyOrders.length} ta</span>
          </div>
        </div>

        {/* Switch to customer menu button */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/80 font-medium">Taom buyurtma bermoqchimisiz?</span>
          <button
            onClick={onSwitchToCustomer}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
          >
            <span>Mijoz Menyusi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-tab Navigation */}
      <div className="flex bg-[#EEF4EF] dark:bg-[#141C16] p-1 rounded-2xl gap-1 border border-transparent dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'available'
              ? 'bg-white dark:bg-[#1A241E] text-emerald-800 dark:text-emerald-400 shadow-soft'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <span>Tayyor</span>
          {availableOrders.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {availableOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_active')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'my_active'
              ? 'bg-white dark:bg-[#1A241E] text-emerald-800 dark:text-emerald-400 shadow-soft'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <span>Yo'lda</span>
          {myActiveOrders.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white">
              {myActiveOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-[#1A241E] text-emerald-800 dark:text-emerald-400 shadow-soft'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <span>Yetkazilgan</span>
        </button>

        <button
          onClick={fetchOrders}
          title="Yangilash"
          className="w-10 flex items-center justify-center text-neutral-500 hover:text-emerald-700 dark:text-neutral-400 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Online Status Banner */}
      {!isOnline && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center gap-3">
          <Power className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-300 block">Siz offline rejimdasiz</span>
            <span className="text-neutral-600 dark:text-neutral-400">Yangi buyurtmalarni qabul qilish uchun yuqoridagi "Offline" tugmasini bosing.</span>
          </div>
        </div>
      )}

      {/* 3. Orders List */}
      {currentList.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#141D17] rounded-3xl border border-neutral-200/70 dark:border-neutral-800/80 p-6 space-y-3">
          <div className="w-16 h-16 bg-[#EEF4EF] dark:bg-[#1C271F] rounded-full flex items-center justify-center mx-auto text-emerald-800 dark:text-emerald-400">
            {activeTab === 'available' ? <Package className="w-8 h-8 opacity-60" /> :
             activeTab === 'my_active' ? <Bike className="w-8 h-8 opacity-60" /> :
             <CheckCircle2 className="w-8 h-8 opacity-60" />}
          </div>
          <h3 className="font-bold text-sm text-[#11311F] dark:text-[#E8F0EA]">
            {activeTab === 'available' && "Hozircha tayyor buyurtmalar yo'q"}
            {activeTab === 'my_active' && "Sizda yetkazilayotgan faol buyurtma yo'q"}
            {activeTab === 'history' && "Hozircha yetkazilgan buyurtmalar tarixi yo'q"}
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            {activeTab === 'available' && "Oshxona yangi taomlarni tayyorlaganda bu yerda paydo bo'ladi."}
            {activeTab === 'my_active' && "Tayyor buyurtmalardan birini qabul qiling va yetkazib bering."}
            {activeTab === 'history' && "Yetkazib berilgan barcha buyurtmalaringiz shu yerda saqlanadi."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {currentList.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-[#141D17] rounded-3xl p-4.5 border border-neutral-200/70 dark:border-neutral-800/80 shadow-soft space-y-3.5"
            >
              {/* Card Header: ID, Time, Price */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#11311F] dark:text-[#E8F0EA]">
                      Buyurtma #{order.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.payment_method === 'cash' 
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' 
                        : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                    }`}>
                      {order.payment_method === 'cash' ? '💵 Naqd pul' : '💳 Karta'}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    {new Date(order.created_at).toLocaleString('uz-UZ', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-400">
                    {order.total_amount?.toLocaleString()} so'm
                  </span>
                  {order.delivery_fee > 0 && (
                    <span className="text-[10px] text-neutral-400 block">
                      + Yetkazish: {order.delivery_fee.toLocaleString()} so'm
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Contact & Address Box */}
              <div className="bg-[#F8FAF7] dark:bg-[#18231C] rounded-2xl p-3.5 space-y-2.5 text-xs">
                {/* Client info & Call button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#11311F] dark:text-[#E8F0EA]">
                      👤 {order.customer_name}
                    </span>
                  </div>
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Qo'ng'iroq</span>
                  </a>
                </div>

                <div className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                  📞 {order.customer_phone}
                </div>

                {/* Address & Navigation Button */}
                <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-800/60 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 flex-1">
                    <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed">
                      {order.address || "Manzil ko'rsatilmagan"}
                    </span>
                  </div>

                  {(order.latitude || order.address) && (
                    <button
                      onClick={() => openMapNavigation(order)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-xl font-bold text-[11px] hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Xarita</span>
                    </button>
                  )}
                </div>

                {order.notes && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-300 text-[11px]">
                    <span className="font-bold">Mijoz izohi:</span> {order.notes}
                  </div>
                )}
              </div>

              {/* Items List */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Taomlar tarkibi:
                  </span>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-1 text-neutral-700 dark:text-neutral-300">
                        <span>{it.quantity}x {it.product_name}</span>
                        <span className="font-semibold">{it.price?.toLocaleString()} so'm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {activeTab === 'available' && (
                <button
                  disabled={actionLoadingId === order.id}
                  onClick={() => handleAcceptOrder(order.id)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer disabled:opacity-50"
                >
                  <Bike className="w-4 h-4" />
                  <span>
                    {actionLoadingId === order.id ? 'Qabul qilinmoqda...' : '🛵 Qabul qilish va yo\'lga chiqish'}
                  </span>
                </button>
              )}

              {activeTab === 'my_active' && (
                <button
                  disabled={actionLoadingId === order.id}
                  onClick={() => handleDeliverOrder(order.id)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-glow transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>
                    {actionLoadingId === order.id ? 'Yetkazilmoqda...' : '✅ Yetkazib berildi'}
                  </span>
                </button>
              )}

              {activeTab === 'history' && (
                <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Muvaffaqiyatli yetkazilgan</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
