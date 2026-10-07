import React, { useState, useEffect, useMemo } from 'react';
import api, { cancelOrder } from './lib/api';
import { enterFullscreen, getTelegram, getTelegramUser } from './lib/telegram';
import { detectCurrentLocation } from './lib/location';
import { useToast } from './components/Toast';
import { filterAndRankProducts } from './lib/searchUtils';
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
import type { Category, CourierData, OrderRecord, OrderSuccess, ProfileBackendUser, TgUser, UserProfile } from './types';
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Instant, zero-flicker va o'zbekcha apostroflarga chidamli professional qidiruv
  const displayedProducts = useMemo(() => {
    const list = allProducts;
    const trimmed = searchQuery.trim();

    // Kategoriya bo'yicha aniq va barqaror saralash (ID va nom orqali smart tekshiruv)
    const matchesCategory = (p: Product, catId: number) => {
      const catObj = categories.find(c => Number(c.id) === Number(catId));
      if (!catObj) return Number(p.category_id) === Number(catId);

      const catNameClean = catObj.name.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const pName = (p.name || '').toLowerCase();

      // Taom turlarini aniq ajratish
      const isDesert = pName.includes('desert') || pName.includes('tort') || pName.includes('shirinlik') || pName.includes('chizkeyk') || pName.includes('cheesecake') || pName.includes('muzqaymoq') || pName.includes('cake') || pName.includes('donat') || pName.includes('kruassan') || pName.includes('piroj');
      const isLavash = pName.includes('lavash') || pName.includes('donar');
      const isHotDog = pName.includes('hot') || pName.includes('dog');
      const isBurger = pName.includes('burger') || pName.includes('gamburger') || pName.includes('chizburger');
      const isPizza = pName.includes('pitsa') || pName.includes('pizza');
      const isSnack = (pName.includes('fri') || pName.includes('gazak')) && !pName.includes('sendvich');
      const isSalad = pName.includes('salat') || pName.includes('salad') || pName.includes('tsezar') || pName.includes('olivye') || pName.includes('grek');
      const isChicken = pName.includes('tovuq') || pName.includes('strips') || pName.includes('qanot') || pName.includes('chiken') || pName.includes('chicken') || pName.includes('naggets') || pName.includes('nugget') || pName.includes('kfc');
      const isSandwich = pName.includes('sendvich') || pName.includes('sandwich') || pName.includes('toster') || pName.includes('toast') || pName.includes('klab') || pName.includes('panini');
      const isCombo = pName.includes('kombo') || pName.includes('combo') || pName.includes('set') || pName.includes('to\'plam');
      const isSauce = pName.includes('sous') || pName.includes('sauce') || pName.includes('ketchup') || pName.includes('mayonez');
      const isCoffee = pName.includes('qahva') || pName.includes('kofe') || pName.includes('coffee') || pName.includes('espresso') || pName.includes('kapuchino') || pName.includes('cappuccino') || pName.includes('latte') || pName.includes('amerikano') || pName.includes('americano') || pName.includes('makiyato') || pName.includes('macchiato') || ((pName.includes('choy') || pName.includes('tea')) && !pName.includes('fuse') && !pName.includes('lipton') && !pName.includes('ice'));
      const isDrink = !isCoffee && (
        pName.includes('mohito') || pName.includes('moxito') || pName.includes('mojito') ||
        pName.includes('cola') || pName.includes('kola') || pName.includes('pepsi') ||
        pName.includes('fanta') || pName.includes('sprite') || pName.includes('7up') ||
        pName.includes('mirinda') || pName.includes('flesh') || pName.includes('flash') ||
        pName.includes('redbull') || pName.includes('red bull') || pName.includes('monster') ||
        pName.includes('suv') || pName.includes('water') || pName.includes('bonaqua') ||
        (pName.includes('choy') && !pName.includes('choyxona')) || pName.includes('tea') ||
        pName.includes('lipton') || pName.includes('fuse') || pName.includes('ichimlik') ||
        pName.includes('sok') || pName.includes('sharbat') || pName.includes('juice') ||
        pName.includes('kokteyl') || pName.includes('cocktail') || pName.includes('milkshake') ||
        pName.includes('limonad') || pName.includes('lemonade') || pName.includes('ayron') ||
        pName.includes('ayran') || pName.includes('drink')
      );

      // 1. Desertlar
      if (catNameClean.includes('desert') || catNameClean.includes('shirin')) {
        return Number(p.category_id) === Number(catId) || isDesert;
      }

      // 2. Salatlar
      if (catNameClean.includes('salat') || catNameClean.includes('salad')) {
        return Number(p.category_id) === Number(catId) || isSalad;
      }

      // 3. Tovuq & Strips
      if (catNameClean.includes('tovuq') || catNameClean.includes('strip') || catNameClean.includes('chicken')) {
        return Number(p.category_id) === Number(catId) || isChicken;
      }

      // 4. Sendvichlar
      if (catNameClean.includes('sendvich') || catNameClean.includes('sandwich') || catNameClean.includes('toster')) {
        return Number(p.category_id) === Number(catId) || isSandwich;
      }

      // 5. Kombo & Setlar
      if (catNameClean.includes('kombo') || catNameClean.includes('combo') || catNameClean.includes('set')) {
        return Number(p.category_id) === Number(catId) || isCombo;
      }

      // 6. Souslar
      if (catNameClean.includes('sous') || catNameClean.includes('sauce')) {
        return Number(p.category_id) === Number(catId) || isSauce;
      }

      // 7. Qahva & Choy
      if (catNameClean.includes('qahva') || catNameClean.includes('kofe') || catNameClean.includes('coffee') || catNameClean.includes('choy') || catNameClean.includes('issiq')) {
        return Number(p.category_id) === Number(catId) || isCoffee;
      }

      // 8. Burgerlar
      if (catNameClean.includes('burger')) {
        if (isDesert || isLavash || isHotDog || isDrink || isPizza || isSalad || isChicken || isSandwich || isCombo || isSauce || isCoffee) return false;
        return Number(p.category_id) === Number(catId) || isBurger;
      }

      // 9. Lavashlar
      if (catNameClean.includes('lavash')) {
        if (isDesert || isHotDog || isBurger || isDrink || isPizza || isSalad || isChicken || isSandwich || isCombo || isSauce || isCoffee) return false;
        return Number(p.category_id) === Number(catId) || isLavash;
      }

      // 10. Hot-doglar
      if (catNameClean.includes('hot') || catNameClean.includes('dog')) {
        if (isDesert || isLavash || isBurger || isDrink || isPizza || isSalad || isChicken || isSandwich || isCombo || isSauce || isCoffee) return false;
        return Number(p.category_id) === Number(catId) || isHotDog;
      }

      // 11. Pitsalar
      if (catNameClean.includes('pits') || catNameClean.includes('pizza')) {
        if (isDesert || isLavash || isHotDog || isBurger || isDrink || isSalad || isChicken || isSandwich || isCombo || isSauce || isCoffee) return false;
        return Number(p.category_id) === Number(catId) || isPizza;
      }

      // 12. Gazaklar & Fri
      if (catNameClean.includes('fri') || catNameClean.includes('gazak')) {
        if (isDesert || isLavash || isHotDog || isBurger || isDrink || isPizza || isSalad || isChicken || isSandwich || isCombo || isSauce || isCoffee) return false;
        return Number(p.category_id) === Number(catId) || isSnack;
      }

      // 13. Ichimliklar
      if (catNameClean.includes('ichim') || catNameClean.includes('drink')) {
        if (isDesert || isLavash || isHotDog || isBurger || isSnack || isPizza || isSalad || isChicken || isSandwich || isCombo || isSauce || isCoffee) return false;
        return Number(p.category_id) === Number(catId) || isDrink;
      }

      // Qolgan toifalarga begona taomlar aralashmasin
      if (isDesert || isSalad || isChicken || isSandwich || isCombo || isSauce || isCoffee) return false;

      return Number(p.category_id) === Number(catId);
    };

    if (trimmed) {
      if (selectedCategory !== null) {
        const catFiltered = list.filter(p => matchesCategory(p, selectedCategory));
        const rankedInCat = filterAndRankProducts(catFiltered, trimmed);
        if (rankedInCat.length > 0) return rankedInCat;
      }
      return filterAndRankProducts(list, trimmed);
    }

    if (selectedCategory !== null) {
      return list.filter(p => matchesCategory(p, selectedCategory));
    }

    return list;
  }, [allProducts, selectedCategory, searchQuery, categories]);

  const [restaurantSettings, setRestaurantSettings] = useState({
    restaurant_name: 'Samira Fast Food',
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
    longitude: null,
    location_source: 'manual'
  });

  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [homeResetKey, setHomeResetKey] = useState(0);

  const handleGoToHome = () => {
    setActiveTab('menu');
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedProductDetail(null);
    setHomeResetKey(k => k + 1);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { cart, addToCart, removeFromCart, setCartQuantity, clearCart, totalAmount, totalItems } = useCart();

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
    // URL orqali kuryer sahifasiga kirilganligini tekshirish (masalan: /courier, ?tab=courier, ?role=courier yoki ?courier=1)
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const isCourierUrl = pathname.includes('courier') || 
                         pathname.includes('kuryer') || 
                         searchParams.get('tab') === 'courier' || 
                         searchParams.get('role') === 'courier' ||
                         searchParams.has('courier');

    if (isCourierUrl) {
      setIsCourier(true);
      setActiveTab('courier');
    }

    // Telegram WebApp context
    const tg = getTelegram();
    enterFullscreen();
    const onVisible = () => {
      if (document.visibilityState === 'visible') enterFullscreen();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Telegram foydalanuvchisini barcha manbalardan (initData, URL search, hash, localStorage) aniqlash
    const resolvedUser = getTelegramUser();

    if (resolvedUser && resolvedUser.id) {
      setTgUser(resolvedUser);
      try {
        localStorage.setItem('cached_tg_user', JSON.stringify(resolvedUser));
      } catch {}
      const fullName = `${resolvedUser.first_name || ''} ${resolvedUser.last_name || ''}`.trim();
      setOrderForm(prev => ({
        ...prev,
        name: prev.name || fullName || 'Hurmatli mijoz'
      }));
      checkCourierStatus(resolvedUser.id);
    }

    // Saqlangan mijoz ma'lumotlarini yuklash (oxirgi buyurtma bergan ism va telefon)
    try {
      const savedName = localStorage.getItem('last_customer_name');
      const savedPhone = localStorage.getItem('last_customer_phone');
      if (savedName || savedPhone) {
        setOrderForm(prev => ({
          ...prev,
          name: prev.name || savedName || '',
          phone: prev.phone || savedPhone || ''
        }));
      }
    } catch {}

    // Agar veb brauzerda /courier ochilgan bo'lsa va tgUser bo'lmasa, joriy kuryerni yuklash:
    if (isCourierUrl) {
      api.get('/couriers/current').then(res => {
        if (res.data?.courier) {
          setCourierData(res.data.courier);
          setIsCourier(true);
          setActiveTab('courier');
        } else {
          throw new Error('Kuryer topilmadi');
        }
      }).catch(err => {
        console.warn('Veb kuryer fallback bilan ochilmoqda:', err?.message);
        setCourierData({
          id: 1,
          telegram_id: 0,
          first_name: 'Kuryer',
          status: 'active',
          is_online: 1
        });
        setIsCourier(true);
        setActiveTab('courier');
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Har 5 sekundda orqa fonda avtomatik yangilash (yangi taomlar, o'zgarishlar, sozlamalar)
  useEffect(() => {
    let isMounted = true;

    const syncAppData = async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        const [prodRes, catRes, settingsRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
          api.get('/settings')
        ]);

        if (!isMounted) return;

        if (prodRes.data?.data) {
          setAllProducts(prodRes.data.data);
          // Agar tanlangan taom modali ochiq bo'lsa, uning ma'lumotlarini ham yangilash
          setSelectedProductDetail(prev => {
            if (!prev) return null;
            const updated = prodRes.data.data.find((p: Product) => p.id === prev.id);
            return updated || prev;
          });
        }

        if (catRes.data?.data) {
          setCategories(catRes.data.data);
        }

        if (settingsRes.data?.data) {
          setRestaurantSettings({
            restaurant_name: settingsRes.data.data.restaurant_name || 'Samira Fast Food',
            delivery_fee: parseFloat(settingsRes.data.data.delivery_fee) || 0
          });
        }
      } catch (err) {
        if (!silent) {
          console.error('API yuklashda xato:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Dastlabki yuklash (spinner bilan)
    syncAppData(false);

    // Har 5 sekundda orqa fonda jim (flicker'siz) yangilash
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncAppData(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      let orders: OrderRecord[] = [];
      let backendUser: ProfileBackendUser | null = null;

      // 1. Agar Telegram foydalanuvchisi mavjud bo'lsa, backend profilini so'raymiz
      const activeUser = tgUser || getTelegramUser();
      const currentTgId = activeUser?.id || Number(new URLSearchParams(window.location.search).get('tg_id')) || null;
      if (currentTgId) {
        try {
          const res = await api.get(`/users/profile/${currentTgId}`);
          if (res.data?.success && res.data?.data) {
            backendUser = res.data.data.user || null;
            if (Array.isArray(res.data.data.orders)) {
              orders = res.data.data.orders;
            }
            if (backendUser?.phone) {
              localStorage.setItem('last_customer_phone', backendUser.phone);
              setOrderForm(prev => ({ ...prev, phone: prev.phone || backendUser.phone }));
            }
          }
        } catch {
          // Foydalanuvchi hali buyurtma bermagan bo'lishi mumkin
        }
      }

      // 2. Brauzer yoki Telegram'dagi saqlangan buyurtma ID lari / telefon raqam bo'yicha buyurtmalarni olish
      let storedIds: number[] = [];
      try {
        const raw = localStorage.getItem('my_order_ids');
        if (raw) storedIds = JSON.parse(raw);
      } catch {}
      const savedPhone = localStorage.getItem('last_customer_phone') || orderForm.phone || '';

      if (storedIds.length > 0 || (orders.length === 0 && savedPhone) || currentTgId) {
        try {
          const params = new URLSearchParams();
          if (storedIds.length > 0) {
            params.set('ids', storedIds.join(','));
          }
          if (savedPhone) {
            params.set('phone', savedPhone);
          }
          if (currentTgId) {
            params.set('telegram_id', String(currentTgId));
          }
          const res = await api.get(`/orders/by-ids?${params.toString()}`);
          if (res.data?.success && Array.isArray(res.data?.data)) {
            const extraOrders: OrderRecord[] = res.data.data;
            const map = new Map<number, OrderRecord>();
            orders.forEach(o => map.set(o.id, o));
            extraOrders.forEach(o => map.set(o.id, o));
            orders = Array.from(map.values()).sort((a, b) => b.id - a.id);
          }
        } catch (err) {
          console.error('Buyurtmalarni yuklashda xatolik:', err);
        }
      }

      setUserProfile({
        user: backendUser,
        orders
      });

      // Foydalanuvchi telefonini formaga to'ldirish
      const phoneSource = backendUser?.phone || savedPhone;
      if (phoneSource) {
        const digits = String(phoneSource).replace(/\D/g, '').replace(/^998/, '').slice(0, 9);
        if (digits.length === 9) {
          setOrderForm(prev => prev.phone ? prev : ({
            ...prev,
            phone: `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
          }));
        }
      }
    } catch (err) {
      console.error('Profil yuklanmadi:', err);
    }
  };

  // Dastlabki yuklanishda buyurtmalar va profilni chaqirish
  useEffect(() => {
    fetchProfile();
  }, [tgUser?.id]);

  useEffect(() => {
    if (activeTab === 'profile' || activeTab === 'history') {
      fetchProfile();
      // Buyurtmalar tarixi va profil ochilganda ham har 5 sekundda statuslarni jonli yangilash
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchProfile();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, tgUser?.id]);

  const handleGetLocation = async () => {
    if (isLocating) return;
    try {
      setIsLocating(true);
      showToast('Lokatsiyangiz aniqlanmoqda, iltimos kuting...', 'info');
      const result = await detectCurrentLocation();
      
      setOrderForm(prev => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.address || prev.address,
        location_source: 'live_gps'
      }));

      showToast(`Lokatsiyangiz muvaffaqiyatli aniqlandi!`, 'success');
    } catch (err: any) {
      console.error('Lokatsiya olishda xatolik:', err);
      showToast(err?.message || 'Lokatsiyani aniqlashda xatolik yuz berdi. Manzilni qo\'lda kiriting.', 'error');
    } finally {
      setIsLocating(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    const cleanDigits = (orderForm.phone || '').replace(/\D/g, '').replace(/^998/, '');
    if (!orderForm.name || cleanDigits.length < 9) {
      showToast('Iltimos, ismingiz va to\'liq telefon raqamingizni (9 ta raqam) kiriting!', 'error');
      return;
    }
    if (orderForm.order_type === 'delivery' && !orderForm.address) {
      showToast('Iltimos, yetkazib berish manzilini kiriting yoki lokatsiyani belgilang!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const activeUser = tgUser || getTelegramUser();
      const formattedPhone = `+998 ${cleanDigits.slice(0, 2)} ${cleanDigits.slice(2, 5)} ${cleanDigits.slice(5, 7)} ${cleanDigits.slice(7, 9)}`;
      const hasLiveGps = Boolean(orderForm.latitude && orderForm.longitude);
      const payload = {
        telegram_id: activeUser?.id || null,
        customer_name: orderForm.name,
        customer_phone: formattedPhone,
        order_type: orderForm.order_type,
        address: orderForm.order_type === 'delivery' ? (orderForm.address || '') : '',
        latitude: orderForm.order_type === 'delivery' ? orderForm.latitude : null,
        longitude: orderForm.order_type === 'delivery' ? orderForm.longitude : null,
        location_source: (hasLiveGps && orderForm.order_type === 'delivery') ? (orderForm.location_source || 'live_gps') : 'manual',
        payment_method: orderForm.payment_method,
        notes: orderForm.notes,
        items: cart
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        setOrderSuccess(res.data);
        showToast('Buyurtmangiz qabul qilindi!', 'success');
        clearCart();

        // Buyurtma ID va mijoz ma'lumotlarini saqlash
        const newOrderId = res.data.order_id;
        try {
          const raw = localStorage.getItem('my_order_ids');
          const storedIds: number[] = raw ? JSON.parse(raw) : [];
          if (newOrderId && !storedIds.includes(newOrderId)) {
            storedIds.unshift(newOrderId);
            localStorage.setItem('my_order_ids', JSON.stringify(storedIds));
          }
          if (orderForm.name) {
            localStorage.setItem('last_customer_name', orderForm.name);
          }
          if (formattedPhone) {
            localStorage.setItem('last_customer_phone', formattedPhone);
          }
        } catch (e) {
          console.error('LocalStorage saqlashda xatolik:', e);
        }

        // Buyurtmalar tarixini darhol yangilash
        fetchProfile();
      }
    } catch (err) {
      showToast('Buyurtma yuborishda xatolik yuz berdi: ' + ((err as Error)?.message || ''), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      await cancelOrder(orderId, "Mijoz tomonidan bekor qilindi");
      showToast('Buyurtmangiz muvaffaqiyatli bekor qilindi', 'info');
      await fetchProfile();
    } catch (err: any) {
      showToast(err?.message || 'Buyurtmani bekor qilishda xatolik yuz berdi', 'error');
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8FAF7] dark:bg-[#0F1713] text-[#1A2E22] dark:text-[#E8F0EA] ${activeTab === 'courier' ? 'pb-8' : 'pb-28'} font-sans antialiased select-none transition-colors duration-300`}>
      {/* 1. Header (Home) */}
      {activeTab === 'menu' && (
        <header className="px-4.5 pt-3.5 pb-2 safe-top-pt">
          <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between">
            <div 
              onClick={handleGoToHome}
              className="flex items-center gap-2.5 cursor-pointer active:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/25 overflow-hidden flex items-center justify-center shadow-soft shrink-0">
                <img 
                  src="/samira-logo.webp" 
                  alt="Samira" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { 
                    if (e.currentTarget.src.endsWith('.webp')) {
                      e.currentTarget.src = '/samira-logo.png';
                    } else {
                      e.currentTarget.style.display = 'none'; 
                    }
                  }} 
                />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block leading-tight">
                  G'uzor • Tezkor Dostavka
                </span>
                <span className="text-xs font-black text-[#11311F] dark:text-[#E8F0EA] flex items-center gap-1">
                  {restaurantSettings.restaurant_name || 'Samira Fast Food'}
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
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#141D17]/90 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/70 px-4.5 py-3.5 shadow-xs transition-colors safe-top-sticky">
          <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between">
            {activeTab === 'courier' ? (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black shadow-xs">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-[#11311F] dark:text-[#E8F0EA] leading-tight">
                    Kuryer Boshqaruvi
                  </h1>
                  <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${courierData?.is_online === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                    <span>{courierData?.is_online === 1 ? 'Onlayn (Ishda)' : 'Oflayn'}</span>
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGoToHome}
                aria-label="Orqaga qaytish"
                className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-[#202E24] flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-[#283b2e] active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {activeTab !== 'courier' && (
              <h1 className="text-sm font-black text-[#11311F] dark:text-[#E8F0EA]">
                {activeTab === 'categories' && "Barcha Bo'limlar"}
                {activeTab === 'cart' && 'Savatcha & Checkout'}
                {activeTab === 'history' && 'Buyurtmalar Tarixi'}
                {activeTab === 'profile' && 'Mijoz Profili'}
              </h1>
            )}

            <div className="flex items-center gap-2">
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
            products={displayedProducts}
            loading={loading}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            onOpenCategories={() => setActiveTab('categories')}
            onSelectProduct={(p) => setSelectedProductDetail(p)}
            resetKey={homeResetKey}
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
            onGoToMenu={handleGoToHome}
            onGoToHistory={() => setActiveTab('history')}
            cart={cart}
            products={allProducts}
            totalItems={totalItems}
            totalAmount={totalAmount}
            clearCart={clearCart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            orderForm={orderForm}
            setOrderForm={setOrderForm}
            onGetLocation={handleGetLocation}
            isLocating={isLocating}
            onPlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            deliveryFee={restaurantSettings.delivery_fee}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            orders={userProfile?.orders || []}
            onGoToMenu={handleGoToHome}
            onCancelOrder={handleCancelOrder}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            tgUser={tgUser}
            userProfile={userProfile}
            isCourier={isCourier}
            onGoToCourier={() => setActiveTab('courier')}
            onGoToMenu={handleGoToHome}
            onGoToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'courier' && courierData && (
          <CourierView
            courier={courierData}
            onSwitchToCustomer={handleGoToHome}
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
        currentQuantity={
          selectedProductDetail && Array.isArray(cart)
            ? (cart.find((i) => i && i.id === selectedProductDetail.id)?.quantity || 0) 
            : 0
        }
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={addToCart}
        onSetCartQuantity={setCartQuantity}
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

      {/* Bottom Navigation (Faqat mijoz sahifalarida ko'rsatiladi, kuryer panelida yashiriladi) */}
      {activeTab !== 'courier' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#141D17]/95 backdrop-blur-md border-t border-neutral-200/60 dark:border-neutral-800/80 z-30 py-2 shadow-soft transition-colors">
          <div className="max-w-md mx-auto flex justify-between items-center px-6 relative">
            
            {/* Asosiy */}
            <button
              onClick={handleGoToHome}
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
                  (activeTab as string) === 'courier' ? 'scale-110 text-amber-500 stroke-[2.5]' : 'scale-100 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500 stroke-[1.8]'
                }`} />
                <span className={`text-[10px] transition-all duration-200 ${
                  (activeTab as string) === 'courier' ? 'text-amber-500 font-extrabold' : 'text-neutral-400 dark:text-neutral-500 font-medium'
                }`}>
                  Kuryer
                </span>
                <span className={`h-1 rounded-full bg-amber-500 transition-all duration-300 ease-out ${
                  (activeTab as string) === 'courier' ? 'w-3.5 opacity-100' : 'w-0 opacity-0'
                }`} />
              </button>
            )}

          </div>
        </nav>
      )}
    </div>
  );
}
