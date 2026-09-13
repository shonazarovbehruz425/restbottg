import React, { useState, useEffect } from 'react';
import api from './lib/api';
import { getTelegram } from './lib/telegram';
import { useToast } from './components/Toast';
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  Clock, 
  User, 
  MapPin, 
  Bell, 
  ArrowLeft, 
  ChevronRight,
  Moon,
  Sun,
  Bike
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useCart, Product } from './CartContext';
import type { Category, CourierData, OrderSuccess, TgUser, UserProfile } from './types';
import HomeView from './views/HomeView';
import CategoriesView from './views/CategoriesView';
import CartView, { OrderFormState } from './views/CartView';
import HistoryView from './views/HistoryView';
import ProfileView from './views/ProfileView';
import ProductDetailModal from './views/ProductDetailModal';
import CourierView from './views/CourierView';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'cart' | 'history' | 'profile' | 'courier'>('menu');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [restaurantSettings, setRestaurantSettings] = useState({
    restaurant_name: 'Restoran',
    delivery_fee: 0
  });

  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [courierData, setCourierData] = useState<CourierData | null>(null);
  const [isCourier, setIsCourier] = useState<boolean>(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  const [orderForm, setOrderForm] = useState<OrderFormState>({
    name: '',
    phone: '',
    order_type: 'delivery',
    address: '',
    payment_method: 'cash',
    notes: '',
    latitude: null,
    longitude: null
  });

  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cart, addToCart, removeFromCart, clearCart, totalAmount, totalItems } = useCart();

  const checkCourierStatus = async (telegramId: number) => {
    try {
      const res = await api.get(`/couriers/check/${telegramId}`);
      if ((res.data.is_courier || res.data.isCourier) && res.data.courier) {
        setCourierData(res.data.courier);
        setIsCourier(true);
        setActiveTab('courier');
      }
    } catch (err) {
      console.error('Kuryer tekshirishda xatolik:', err);
    }
  };

  const { showToast } = useToast();

  useEffect(() => {
    // Telegram WebApp context (kuryerlik faqat backend tekshiruvi orqali aniqlanadi)
    const tg = getTelegram();
    if (tg) {
      tg.ready();
      tg.expand();
      const u = tg.initDataUnsafe?.user;
      if (u) {
        setTgUser(u);
        setOrderForm(prev => ({
          ...prev,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Hurmatli mijoz'
        }));
        checkCourierStatus(u.id);
      }
    }
  }, []);

  // Qidiruv uchun 300ms debounce (input bir zumda yangilanadi, so'rov kechiktiriladi)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  // Kategoriyalar va sozlamalar bir marta yuklanadi (qidiruvda qayta so'ralmaydi)
  useEffect(() => {
    const fetchStatic = async () => {
      try {
        const [catRes, settingsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/settings')
        ]);
        setCategories(catRes.data.data);
        if (settingsRes.data.data) {
          setRestaurantSettings({
            restaurant_name: settingsRes.data.data.restaurant_name || 'Restoran',
            delivery_fee: parseFloat(settingsRes.data.data.delivery_fee) || 0
          });
        }
      } catch (err) {
        console.error('API yuklashda xato:', err);
      }
    };
    fetchStatic();
  }, []);

  // Faqat mahsulotlar debounce qilingan qidiruv/kategoriya bilan qayta so'raladi
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const prodRes = await api.get('/products', {
          params: {
            category_id: selectedCategory,
            search: debouncedSearch
          }
        });
        setProducts(prodRes.data.data);
      } catch (err) {
        console.error('Mahsulotlarni yuklashda xato:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, debouncedSearch]);

  const fetchProfile = async () => {
    if (!tgUser || !tgUser.id) return;
    try {
      const res = await api.get(`/users/profile/${tgUser.id}`);
      setUserProfile(res.data.data);
    } catch (err) {
      console.error('Profil yuklanmadi:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' || activeTab === 'history') {
      fetchProfile();
    }
  }, [activeTab]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOrderForm(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: prev.address || `Lokatsiya: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          }));
          showToast('Lokatsiyangiz muvaffaqiyatli aniqlandi!', 'success');
        },
        () => {
          showToast('Lokatsiyani aniqlashga ruxsat berilmadi.', 'error');
        }
      );
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    if (!orderForm.name || !orderForm.phone) {
      showToast('Iltimos, ismingiz va telefon raqamingizni kiriting!', 'error');
      return;
    }
    if (orderForm.order_type === 'delivery' && !orderForm.address) {
      showToast('Iltimos, yetkazib berish manzilini kiriting yoki lokatsiyani belgilang!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        telegram_id: tgUser?.id || null,
        customer_name: orderForm.name,
        customer_phone: orderForm.phone,
        order_type: orderForm.order_type,
        address: orderForm.address,
        latitude: orderForm.latitude,
        longitude: orderForm.longitude,
        payment_method: orderForm.payment_method,
        notes: orderForm.notes,
        items: cart
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        setOrderSuccess(res.data);
        showToast('Buyurtmangiz qabul qilindi!', 'success');
        clearCart();
      }
    } catch (err) {
      showToast('Buyurtma yuborishda xatolik yuz berdi: ' + ((err as Error)?.message || ''), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#0F1713] text-[#1A2E22] dark:text-[#E8F0EA] pb-28 font-sans antialiased select-none transition-colors duration-300">
      {/* 1. Header (Home) */}
      {activeTab === 'menu' && (
        <header className="px-4.5 pt-3.5 pb-2">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF6EE] dark:bg-[#162D1E] border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-800 dark:text-emerald-400 shadow-soft">
                <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block leading-tight">
                  Yetkazib berish
                </span>
                <span className="text-xs font-black text-[#11311F] dark:text-[#E8F0EA] flex items-center gap-1">
                  {restaurantSettings.restaurant_name || 'Restoran'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tungi / Kunduzgi rejim tugmasi */}
              <button 
                onClick={toggleTheme}
                title={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
                aria-label={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
                className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1A241E] border border-neutral-200/70 dark:border-neutral-800 shadow-soft flex items-center justify-center text-neutral-600 dark:text-amber-300 hover:bg-neutral-50 dark:hover:bg-[#202E24] active:scale-95 transition-all cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-4.5 h-4.5 text-amber-400 fill-amber-400/20" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-emerald-900/80" />
                )}
              </button>

              <button 
                onClick={() => setActiveTab('profile')}
                aria-label="Bildirishnomalar va profil"
                className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1A241E] border border-neutral-200/70 dark:border-neutral-800 shadow-soft flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#202E24] active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 text-emerald-900/70 dark:text-emerald-400" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 2. Header (Boshqa sahifalar uchun) */}
      {activeTab !== 'menu' && (
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#141D17]/90 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/70 px-4.5 py-3.5 shadow-xs transition-colors">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button
              onClick={() => setActiveTab('menu')}
              aria-label="Orqaga qaytish"
              className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-[#202E24] flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-[#283b2e] active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-black text-[#11311F] dark:text-[#E8F0EA]">
              {activeTab === 'categories' && "Barcha Bo'limlar"}
              {activeTab === 'cart' && 'Savatcha & Checkout'}
              {activeTab === 'history' && 'Buyurtmalar Tarixi'}
              {activeTab === 'profile' && 'Mijoz Profili'}
              {activeTab === 'courier' && 'Kuryer Boshqaruvi'}
            </h1>
            <button
              onClick={toggleTheme}
              title={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
              aria-label={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
              className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-[#202E24] flex items-center justify-center text-neutral-700 dark:text-amber-300 hover:bg-neutral-200 dark:hover:bg-[#283b2e] active:scale-95 transition-all cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-900/80" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Kuryer uchun tezkor qaytish banneri (agar mijoz menyusida bo'lsa) */}
      {isCourier && activeTab !== 'courier' && (
        <div className="max-w-md mx-auto px-4.5 pt-2">
          <button
            onClick={() => setActiveTab('courier')}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Bike className="w-4 h-4" />
              <span>Kuryer Paneliga O'tish</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Faol Kuryer →
            </span>
          </button>
        </div>
      )}

      {/* Sahifalar (Silliq Animatsiyali O'tish) */}
      <div key={activeTab} className="animate-tab-enter">
        {activeTab === 'menu' && (
          <HomeView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            products={products}
            loading={loading}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            onOpenCategories={() => setActiveTab('categories')}
            onSelectProduct={(p) => setSelectedProductDetail(p)}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            onSelectCategory={(id) => {
              setSelectedCategory(id);
              setActiveTab('menu');
            }}
          />
        )}

        {activeTab === 'cart' && (
          <CartView
            orderSuccess={orderSuccess}
            setOrderSuccess={setOrderSuccess}
            onGoToMenu={() => setActiveTab('menu')}
            cart={cart}
            totalItems={totalItems}
            totalAmount={totalAmount}
            clearCart={clearCart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            orderForm={orderForm}
            setOrderForm={setOrderForm}
            onGetLocation={handleGetLocation}
            onPlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            deliveryFee={restaurantSettings.delivery_fee}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            orders={userProfile?.orders || []}
            onGoToMenu={() => setActiveTab('menu')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            tgUser={tgUser}
            userProfile={userProfile}
            isCourier={isCourier}
            onGoToCourier={() => setActiveTab('courier')}
            onGoToMenu={() => setActiveTab('menu')}
            onGoToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'courier' && courierData && (
          <CourierView
            courier={courierData}
            onSwitchToCustomer={() => setActiveTab('menu')}
            onRefreshCourier={async () => {
              if (tgUser?.id) {
                await checkCourierStatus(tgUser.id);
              }
            }}
          />
        )}
      </div>

      {/* Taom Tafsiloti Modali */}
      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={addToCart}
      />

      {/* Floating Savat Bar (Menyuda taom bo'lganda) */}
      {activeTab === 'menu' && totalItems > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4.5 max-w-md mx-auto z-20 animate-tab-enter">
          <button
            onClick={() => setActiveTab('cart')}
            className="w-full py-3.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-[22px] shadow-glow flex items-center justify-between font-black text-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 bg-white/25 rounded-full flex items-center justify-center text-xs font-bold">
                {totalItems}
              </span>
              <span>Savatchaga o'tish</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{totalAmount.toLocaleString()} so'm</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Bottom Navigation (Silliq Animatsiyali Navigatsiya) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#141D17]/95 backdrop-blur-md border-t border-neutral-200/60 dark:border-neutral-800/80 z-30 py-2 shadow-soft transition-colors">
        <div className="max-w-md mx-auto flex justify-between items-center px-6 relative">
          
          {/* Asosiy */}
          <button
            onClick={() => setActiveTab('menu')}
            className="group flex flex-col items-center gap-1 py-1 cursor-pointer active:scale-90 transition-transform duration-200"
          >
            <Home className={`w-5 h-5 transition-all duration-300 ${
              activeTab === 'menu' ? 'scale-110 text-emerald-800 dark:text-emerald-400 stroke-[2.5]' : 'scale-100 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 stroke-[1.8]'
            }`} />
            <span className={`text-[10px] transition-all duration-200 ${
              activeTab === 'menu' ? 'text-emerald-800 dark:text-emerald-400 font-extrabold' : 'text-neutral-400 dark:text-neutral-500 font-medium'
            }`}>
              Asosiy
            </span>
            <span className={`h-1 rounded-full bg-emerald-700 dark:bg-emerald-400 transition-all duration-300 ease-out ${
              activeTab === 'menu' ? 'w-3.5 opacity-100' : 'w-0 opacity-0'
            }`} />
          </button>

          {/* Bo'limlar */}
          <button
            onClick={() => setActiveTab('categories')}
            className="group flex flex-col items-center gap-1 py-1 cursor-pointer active:scale-90 transition-transform duration-200"
          >
            <LayoutGrid className={`w-5 h-5 transition-all duration-300 ${
              activeTab === 'categories' ? 'scale-110 text-emerald-800 dark:text-emerald-400 stroke-[2.5]' : 'scale-100 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 stroke-[1.8]'
            }`} />
            <span className={`text-[10px] transition-all duration-200 ${
              activeTab === 'categories' ? 'text-emerald-800 dark:text-emerald-400 font-extrabold' : 'text-neutral-400 dark:text-neutral-500 font-medium'
            }`}>
              Bo'limlar
            </span>
            <span className={`h-1 rounded-full bg-emerald-700 dark:bg-emerald-400 transition-all duration-300 ease-out ${
              activeTab === 'categories' ? 'w-3.5 opacity-100' : 'w-0 opacity-0'
            }`} />
          </button>

          {/* Markaziy Bo'rtib Chiqqan Yumaloq Yashil Savat Tugmasi */}
          <div className="relative -top-4">
            <button
              onClick={() => setActiveTab('cart')}
              className={`w-13 h-13 rounded-full text-white flex items-center justify-center relative active:scale-85 hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-[#F8FAF7] dark:border-[#0F1713] ${
                activeTab === 'cart'
                  ? 'bg-emerald-800 dark:bg-emerald-600 shadow-glow-active scale-105'
                  : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-glow'
              }`}
            >
              <ShoppingBag className={`w-6 h-6 transition-transform duration-300 ${activeTab === 'cart' ? 'scale-110' : 'scale-100'}`} />
              {totalItems > 0 && (
                <span 
                  key={totalItems}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-badge-pop"
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Tarix */}
          <button
            onClick={() => setActiveTab('history')}
            className="group flex flex-col items-center gap-1 py-1 cursor-pointer active:scale-90 transition-transform duration-200"
          >
            <Clock className={`w-5 h-5 transition-all duration-300 ${
              activeTab === 'history' ? 'scale-110 text-emerald-800 dark:text-emerald-400 stroke-[2.5]' : 'scale-100 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 stroke-[1.8]'
            }`} />
            <span className={`text-[10px] transition-all duration-200 ${
              activeTab === 'history' ? 'text-emerald-800 dark:text-emerald-400 font-extrabold' : 'text-neutral-400 dark:text-neutral-500 font-medium'
            }`}>
              Tarix
            </span>
            <span className={`h-1 rounded-full bg-emerald-700 dark:bg-emerald-400 transition-all duration-300 ease-out ${
              activeTab === 'history' ? 'w-3.5 opacity-100' : 'w-0 opacity-0'
            }`} />
          </button>

          {/* Profil */}
          <button
            onClick={() => setActiveTab('profile')}
            className="group flex flex-col items-center gap-1 py-1 cursor-pointer active:scale-90 transition-transform duration-200"
          >
            <User className={`w-5 h-5 transition-all duration-300 ${
              activeTab === 'profile' ? 'scale-110 text-emerald-800 dark:text-emerald-400 stroke-[2.5]' : 'scale-100 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 stroke-[1.8]'
            }`} />
            <span className={`text-[10px] transition-all duration-200 ${
              activeTab === 'profile' ? 'text-emerald-800 dark:text-emerald-400 font-extrabold' : 'text-neutral-400 dark:text-neutral-500 font-medium'
            }`}>
              Profil
            </span>
            <span className={`h-1 rounded-full bg-emerald-700 dark:bg-emerald-400 transition-all duration-300 ease-out ${
              activeTab === 'profile' ? 'w-3.5 opacity-100' : 'w-0 opacity-0'
            }`} />
          </button>

          {/* Kuryer Tab (agar kuryer bo'lsa) */}
          {isCourier && (
            <button
              onClick={() => setActiveTab('courier')}
              className="group flex flex-col items-center gap-1 py-1 cursor-pointer active:scale-90 transition-transform duration-200"
            >
              <Bike className={`w-5 h-5 transition-all duration-300 ${
                activeTab === 'courier' ? 'scale-110 text-amber-500 stroke-[2.5]' : 'scale-100 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500 stroke-[1.8]'
              }`} />
              <span className={`text-[10px] transition-all duration-200 ${
                activeTab === 'courier' ? 'text-amber-500 font-extrabold' : 'text-neutral-400 dark:text-neutral-500 font-medium'
              }`}>
                Kuryer
              </span>
              <span className={`h-1 rounded-full bg-amber-500 transition-all duration-300 ease-out ${
                activeTab === 'courier' ? 'w-3.5 opacity-100' : 'w-0 opacity-0'
              }`} />
            </button>
          )}

        </div>
      </nav>
    </div>
  );
}
