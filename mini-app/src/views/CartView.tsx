import React from 'react';
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  MapPin, 
  Phone, 
  Banknote, 
  CreditCard, 
  Check, 
  ChevronRight, 
  CheckCircle2,
  Truck,
  Package
} from 'lucide-react';
import { CartItem, Product } from '../CartContext';

export interface OrderFormState {
  name: string;
  phone: string;
  order_type: 'delivery' | 'takeaway';
  address: string;
  payment_method: 'cash' | 'card';
  notes: string;
  latitude: number | null;
  longitude: number | null;
}

interface CartViewProps {
  orderSuccess: { order_id: number } | null;
  setOrderSuccess: (val: any) => void;
  onGoToMenu: () => void;
  cart: CartItem[];
  totalItems: number;
  totalAmount: number;
  clearCart: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  orderForm: OrderFormState;
  setOrderForm: React.Dispatch<React.SetStateAction<OrderFormState>>;
  onGetLocation: () => void;
  onPlaceOrder: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  deliveryFee: number;
}

export default function CartView({
  orderSuccess,
  setOrderSuccess,
  onGoToMenu,
  cart,
  totalItems,
  totalAmount,
  clearCart,
  addToCart,
  removeFromCart,
  orderForm,
  setOrderForm,
  onGetLocation,
  onPlaceOrder,
  isSubmitting,
  deliveryFee
}: CartViewProps) {
  if (orderSuccess) {
    return (
      <main className="max-w-md mx-auto px-4.5 pt-3">
        <div className="bg-white dark:bg-[#1A241E] rounded-[32px] p-6 text-center space-y-4 border border-emerald-100 dark:border-emerald-800/40 shadow-soft">
          <div className="w-16 h-16 bg-[#EAF7EE] dark:bg-[#162D1E] text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-soft">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black text-[#11311F] dark:text-[#E8F0EA]">Buyurtmangiz qabul qilindi! 🎉</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Buyurtma kodi: <span className="font-extrabold text-emerald-700 dark:text-emerald-400">#{orderSuccess.order_id}</span>
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 pt-1 leading-relaxed">
              Ma'lumotlar oshxona kanaliga yuborildi. Telegram orqali holati haqida xabar boradi!
            </p>
          </div>
          <button
            onClick={() => {
              setOrderSuccess(null);
              onGoToMenu();
            }}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-soft active:scale-[0.98] transition-all cursor-pointer"
          >
            Menyuga qaytish
          </button>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="max-w-md mx-auto px-4.5 pt-3">
        <div className="bg-white dark:bg-[#1A241E] rounded-[32px] p-8 text-center space-y-3 border border-neutral-200/70 dark:border-neutral-800 shadow-soft">
          <div className="w-16 h-16 bg-[#F2F6F3] dark:bg-[#141C16] rounded-full flex items-center justify-center mx-auto text-neutral-400 dark:text-neutral-500">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100">Savatchangiz bo'sh</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Menyudan o'zingizga yoqqan mazali taomlarni tanlang va bir zumda buyurtma bering!
          </p>
          <button
            onClick={onGoToMenu}
            className="mt-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-soft transition-colors cursor-pointer"
          >
            Taomlarni tanlash
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4.5 pt-2 pb-6 space-y-4">
      {/* 1. SAVATDAGI TAOMLAR */}
      <div className="bg-white dark:bg-[#1A241E] rounded-[28px] p-4.5 border border-neutral-200/70 dark:border-neutral-800 shadow-soft space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight">
            Savatchadagi taomlar ({totalItems})
          </h3>
          <button 
            onClick={clearCart} 
            className="text-[11px] text-red-500 font-bold hover:underline cursor-pointer"
          >
            Tozalash
          </button>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {cart.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={item.image_url?.startsWith('/uploads') ? `http://localhost:5000${item.image_url}` : (item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500')}
                  alt={item.name}
                  className="w-12 h-12 rounded-2xl object-cover bg-neutral-100 dark:bg-[#202E24] shadow-xs"
                />
                <div>
                  <h4 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-100 leading-snug">{item.name}</h4>
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 block mt-0.5">
                    {(item.price * item.quantity).toLocaleString()} so'm
                  </span>
                </div>
              </div>

              <div className="flex items-center bg-[#EBF6EE] dark:bg-[#162D1E] rounded-xl p-0.5 border border-emerald-100 dark:border-emerald-800/40">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="w-6 h-6 flex items-center justify-center bg-white dark:bg-[#203627] text-emerald-800 dark:text-emerald-300 rounded-lg shadow-xs active:scale-90 transition-transform cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 px-2">{item.quantity}</span>
                <button
                  onClick={() => addToCart(item)}
                  className="w-6 h-6 flex items-center justify-center bg-emerald-700 dark:bg-emerald-600 text-white rounded-lg shadow-xs active:scale-90 transition-transform cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CHECKOUT FORMASI */}
      <form onSubmit={onPlaceOrder} className="bg-white dark:bg-[#1A241E] rounded-[28px] p-4.5 border border-neutral-200/70 dark:border-neutral-800 shadow-soft space-y-4">
        <h3 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight">Yetkazib berish ma'lumotlari</h3>

        <div className="grid grid-cols-2 gap-2 bg-[#F2F6F3] dark:bg-[#141C16] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setOrderForm({ ...orderForm, order_type: 'delivery' })}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              orderForm.order_type === 'delivery'
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-soft'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Yetkazib berish</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderForm({ ...orderForm, order_type: 'takeaway' })}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              orderForm.order_type === 'takeaway'
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-soft'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Olib ketish</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300 mb-1">Ismingiz *</label>
            <input
              type="text"
              required
              placeholder="Ismingizni kiriting"
              value={orderForm.name}
              onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8FAF8] dark:bg-[#141C16] border border-neutral-200/80 dark:border-neutral-700 rounded-2xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300 mb-1">Telefon raqam *</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                placeholder="+998 90 123 45 67"
                value={orderForm.phone}
                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAF8] dark:bg-[#141C16] border border-neutral-200/80 dark:border-neutral-700 rounded-2xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {orderForm.order_type === 'delivery' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                  Yetkazish manzili *
                </label>
                <button
                  type="button"
                  onClick={onGetLocation}
                  className="px-3 py-1.5 bg-[#EAF7EE] hover:bg-[#DCF3E3] dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-300/90 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs hover:shadow-soft active:scale-95 transition-all cursor-pointer group"
                >
                  <span className="w-4 h-4 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:rotate-12 transition-transform">
                    <MapPin className="w-2.5 h-2.5 stroke-[2.5]" />
                  </span>
                  <span>Lokatsiyani yuborish</span>
                </button>
              </div>
              <input
                type="text"
                required={orderForm.order_type === 'delivery'}
                placeholder="Ko'cha, uy va xonadon raqami..."
                value={orderForm.address}
                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] dark:bg-[#141C16] border border-neutral-200/80 dark:border-neutral-700 rounded-2xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:outline-none transition-all"
              />
            </div>
          )}

          {/* To'lov turi */}
          <div>
            <label className="block text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300 mb-1.5">To'lov turi</label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${
                orderForm.payment_method === 'cash'
                  ? 'border-emerald-600 bg-[#EAF7EE] dark:bg-[#162D1E] text-emerald-950 dark:text-emerald-300 shadow-xs'
                  : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#141C16] text-neutral-600 dark:text-neutral-400'
              }`}>
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Naqd pul</span>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={orderForm.payment_method === 'cash'}
                  onChange={() => setOrderForm({ ...orderForm, payment_method: 'cash' })}
                  className="hidden"
                />
                {orderForm.payment_method === 'cash' && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />}
              </label>

              <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${
                orderForm.payment_method === 'card'
                  ? 'border-emerald-600 bg-[#EAF7EE] dark:bg-[#162D1E] text-emerald-950 dark:text-emerald-300 shadow-xs'
                  : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#141C16] text-neutral-600 dark:text-neutral-400'
              }`}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Karta orqali</span>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={orderForm.payment_method === 'card'}
                  onChange={() => setOrderForm({ ...orderForm, payment_method: 'card' })}
                  className="hidden"
                />
                {orderForm.payment_method === 'card' && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300 mb-1">Oshpazga izoh (ixtiyoriy)</label>
            <input
              type="text"
              placeholder="Qo'shimcha istaklaringiz..."
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8FAF8] dark:bg-[#141C16] border border-neutral-200/80 dark:border-neutral-700 rounded-2xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Hisob-kitob */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
            <span>Taomlar narxi:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{totalAmount.toLocaleString()} so'm</span>
          </div>
          {orderForm.order_type === 'delivery' && (
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Yetkazib berish xizmati:</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                {deliveryFee > 0 ? `${deliveryFee.toLocaleString()} so'm` : 'Bepul'}
              </span>
            </div>
          )}
          <div className="flex justify-between font-black text-sm text-[#11311F] dark:text-[#E8F0EA] pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span>Jami summa:</span>
            <span className="text-emerald-800 dark:text-emerald-400 text-base font-black">
              {(totalAmount + (orderForm.order_type === 'delivery' ? deliveryFee : 0)).toLocaleString()} so'm
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.99] text-white rounded-[20px] text-xs font-extrabold shadow-soft transition-all disabled:opacity-50 flex items-center justify-between px-5 cursor-pointer"
        >
          <span>{isSubmitting ? 'Yuborilmoqda...' : 'Buyurtmani rasmiylashtirish'}</span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </form>
    </main>
  );
}
