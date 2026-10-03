import React, { useState, useEffect, useCallback, useRef, FormEvent, ChangeEvent } from 'react';
import { 
  ExternalLink, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  BellRing, 
  Volume2, 
  VolumeX, 
  UtensilsCrossed,
  Clock,
  Zap,
  Sliders,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import api, { MINI_APP_URL } from './lib/api';
import { startOrderAlert, stopOrderAlert, playChime, setSoundMuted, unlockAudio } from './lib/orderAudio';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import DashboardView from './pages/DashboardView';
import ProductsView from './pages/ProductsView';
import OrdersView from './pages/OrdersView';
import UsersView from './pages/UsersView';
import CouriersView from './pages/CouriersView';
import SettingsView from './pages/SettingsView';
import ProductModal from './components/ProductModal';
import {
  Product,
  Category,
  ProductFormData,
  Order,
  UserItem,
  SettingsData,
  StatsData,
  ToastItem,
  ConfirmState
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [loggedInAdmin, setLoggedInAdmin] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Live Clock in Header
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const toastId = useRef<number>(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const askConfirm = useCallback(({ title, message, confirmText, onConfirm }: ConfirmState) => {
    setConfirmState({ title, message, confirmText, onConfirm });
  }, []);

  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentOrders: []
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    category_id: '',
    description: '',
    price: '',
    image_url: '',
    is_available: 1
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');

  const [settings, setSettings] = useState<SettingsData>({
    restaurant_name: '',
    delivery_fee: '',
    channel_id: '',
    admin_username: 'admin',
    admin_password: ''
  });

  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('admin_sound_muted') === '1';
  });

  const [autoAccept, setAutoAccept] = useState<boolean>(() => {
    return localStorage.getItem('admin_auto_accept') === '1';
  });

  useEffect(() => {
    setSoundMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data?.data?.auto_accept_orders !== undefined) {
        const val = res.data.data.auto_accept_orders === '1' || res.data.data.auto_accept_orders === 'true';
        setAutoAccept(val);
        localStorage.setItem('admin_auto_accept', val ? '1' : '0');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') === 'expired') {
        setLoginError('Sessiya muddati tugadi. Iltimos, qayta kiring.');
        const url = new URL(window.location.href);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
    verifyStoredSession();
  }, []);

  const verifyStoredSession = async () => {
    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      setIsAuthenticated(false);
      setIsVerifyingSession(false);
      return;
    }

    try {
      const res = await api.get('/admin/verify-session');
      if (res.data.valid) {
        setIsAuthenticated(true);
        setLoggedInAdmin(res.data.username || 'admin');
      } else {
        throw new Error('Yaroqsiz sessiya');
      }
    } catch {
      localStorage.removeItem('admin_session_token');
      setIsAuthenticated(false);
    } finally {
      setIsVerifyingSession(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const res = await api.get('/dashboard-stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await api.get('/orders');
      const ords: Order[] = res.data.data || [];
      setOrders(ords);
      const pending = ords.filter((o) => o.status === 'pending');
      if (pending.length > 0) {
        startOrderAlert();
      } else {
        stopOrderAlert();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Real-vaqt zakazlar monitoringi
  useEffect(() => {
    if (!isAuthenticated) {
      stopOrderAlert();
      return;
    }

    const pollOrders = async () => {
      try {
        const [ordersRes, statsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/dashboard-stats')
        ]);
        if (ordersRes.data?.data) {
          const ords: Order[] = ordersRes.data.data;
          setOrders(ords);
          const pending = ords.filter((o) => o.status === 'pending');

          if (autoAccept && pending.length > 0) {
            setOrders((prev) => prev.map((o) => (o.status === 'pending' ? { ...o, status: 'accepted' } : o)));
            stopOrderAlert();
            playChime();
            pending.forEach((o) => {
              api.put(`/orders/${o.id}/status`, { status: 'accepted' }).catch(() => {});
            });
          } else if (pending.length > 0) {
            startOrderAlert();
          } else {
            stopOrderAlert();
          }
        }
        if (statsRes.data?.data) {
          setStats(statsRes.data.data);
        }
      } catch (err) {
        console.error('Avto-yangilashda xatolik:', err);
      }
    };

    const interval = setInterval(pollOrders, 3500);

    return () => {
      clearInterval(interval);
      stopOrderAlert();
    };
  }, [isAuthenticated, autoAccept]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await api.get('/settings');
      setSettings(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'dashboard') {
      fetchDashboard();
      fetchOrders();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Iltimos, login va parolni kiriting!');
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await api.post('/admin/login', {
        username: usernameInput.trim(),
        password: passwordInput.trim()
      });

      if (res.data.success && res.data.session_token) {
        unlockAudio();
        const token = res.data.session_token;
        localStorage.setItem('admin_session_token', token);
        setLoggedInAdmin(res.data.admin?.username || usernameInput.trim());
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Login yoki parol noto\'g\'ri!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    stopOrderAlert();
    try {
      await api.post('/admin/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('admin_session_token');
    setIsAuthenticated(false);
    setLoggedInAdmin('');
    setUsernameInput('');
    setPasswordInput('');
    setLoginError('');
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('category_id', String(productForm.category_id || (categories[0] ? categories[0].id : '')));
    formData.append('description', productForm.description);
    formData.append('price', String(productForm.price));
    formData.append('is_available', String(productForm.is_available ?? 1));
    if (productImageFile) {
      formData.append('image', productImageFile);
    } else if (productForm.image_url) {
      formData.append('image_url', productForm.image_url);
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductImageFile(null);
      setProductForm({ name: '', category_id: '', description: '', price: '', image_url: '', is_available: 1 });
      fetchProducts();
      showToast('Taom muvaffaqiyatli saqlandi!', 'success');
    } catch (err: any) {
      showToast('Taomni saqlashda xato: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleDeleteProduct = async (id: number | string) => {
    askConfirm({
      title: 'Taomni o‘chirish',
      message: 'Rostdan ham bu taomni o‘chirmoqchimisiz?',
      confirmText: 'Ha, o‘chirish',
      onConfirm: async () => {
        try {
          await api.delete(`/products/${id}`);
          fetchProducts();
          showToast('Taom o‘chirildi.', 'success');
        } catch (err: any) {
          showToast('O‘chirishda xatolik: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleUpdateOrderStatus = async (orderId: number | string, newStatus: string) => {
    try {
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
        const remainingPending = next.filter((o) => o.status === 'pending');
        if (remainingPending.length === 0) {
          stopOrderAlert();
        }
        return next;
      });

      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      fetchDashboard();
      showToast('Buyurtma holati yangilandi.', 'success');
    } catch (err: any) {
      showToast('Holatni o\'zgartirishda xato: ' + (err.response?.data?.error || err.message), 'error');
      fetchOrders();
    }
  };

  const handleDeleteOrder = async (orderId: number | string) => {
    askConfirm({
      title: 'Buyurtmani o‘chirish',
      message: `Buyurtma #${orderId} ni o'chirmoqchimisiz?`,
      confirmText: 'Ha, o‘chirish',
      onConfirm: async () => {
        try {
          setOrders((prev) => {
            const next = prev.filter((o) => o.id !== orderId);
            if (next.filter((o) => o.status === 'pending').length === 0) {
              stopOrderAlert();
            }
            return next;
          });
          await api.delete(`/orders/${orderId}`);
          fetchOrders();
          fetchDashboard();
          showToast('Buyurtma o‘chirildi.', 'success');
        } catch (err: any) {
          showToast('O\'chirishda xatolik: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleToggleAutoAccept = async (newVal: boolean) => {
    setAutoAccept(newVal);
    localStorage.setItem('admin_auto_accept', newVal ? '1' : '0');
    try {
      await api.post('/settings', { auto_accept_orders: newVal ? '1' : '0' });
      showToast(
        newVal 
          ? "Avtomatik qabul qilish rejimi yoqildi! Yangi buyurtmalar darhol qabul qilinadi." 
          : "Qo'lda qabul qilish rejimi yoqildi. Yangi buyurtmalar tasdiq kutadi.",
        'success'
      );
      if (newVal) {
        handleAcceptAllPending();
      }
    } catch (err: any) {
      showToast("Sozlamani saqlashda xatolik: " + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleAcceptAllPending = async () => {
    const pending = orders.filter((o) => o.status === 'pending');
    if (!pending.length) return;
    try {
      setOrders((prev) => prev.map((o) => (o.status === 'pending' ? { ...o, status: 'accepted' } : o)));
      stopOrderAlert();
      await Promise.all(pending.map((o) => api.put(`/orders/${o.id}/status`, { status: 'accepted' })));
      fetchOrders();
      fetchDashboard();
      showToast(`${pending.length} ta buyurtma qabul qilindi!`, 'success');
    } catch (err: any) {
      showToast("Buyurtmalarni qabul qilishda xato: " + (err.response?.data?.error || err.message), 'error');
      fetchOrders();
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings', settings);
      showToast('Sozlamalar muvaffaqiyatli saqlandi!', 'success');
    } catch (err: any) {
      showToast('Saqlashda xatolik: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white text-sm">
        <div className="flex items-center gap-3 bg-slate-900/90 px-8 py-5 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-extrabold text-xs text-slate-300 tracking-wider uppercase">Sessiya tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="bg-[#0F172A]/90 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl space-y-7 relative z-10 border border-slate-800/80">
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div className="w-18 h-18 bg-gradient-to-tr from-amber-600 to-amber-400 p-[1.5px] rounded-3xl shadow-xl shadow-amber-500/25 mx-auto">
                <div className="w-full h-full bg-[#0B0F19] rounded-[22px] flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0F172A] animate-pulse"></span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Samira Fast Food</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Boshqaruv markaziga kirish uchun ma'lumotlarni kiriting</p>
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold rounded-2xl text-center animate-fade-in">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Login (Foydalanuvchi nomi)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="admin"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Admin Parol</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-white rounded-xl font-black text-xs shadow-xl shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 tracking-wider uppercase"
            >
              {isLoggingIn ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingOrders={pendingOrdersCount}
        onLogout={handleLogout}
        loggedInAdmin={loggedInAdmin}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div>
            {/* Breadcrumb line */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mb-0.5">
              <span>Boshqaruv</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-amber-700 font-extrabold capitalize">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'orders' && 'Buyurtmalar'}
                {activeTab === 'products' && 'Taomlar Menyu'}
                {activeTab === 'users' && 'Mijozlar'}
                {activeTab === 'couriers' && 'Kuryerlar'}
                {activeTab === 'settings' && 'Sozlamalar'}
              </span>
            </div>

            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'dashboard' && 'Umumiy Ko\'rsatkichlar'}
              {activeTab === 'orders' && 'Buyurtmalar Nazorati'}
              {activeTab === 'products' && 'Taomlar va Menyu Boshqaruvi'}
              {activeTab === 'users' && 'Bot Foydalanuvchilari'}
              {activeTab === 'couriers' && 'Kuryerlar & Navbatchilik'}
              {activeTab === 'settings' && 'Tizim Sozlamalari'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Digital Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-mono font-bold text-slate-700 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>

            {/* Pending Alert High-Contrast Badge */}
            {pendingOrdersCount > 0 && (
              <button
                onClick={() => {
                  unlockAudio();
                  setActiveTab('orders');
                  setOrderFilter('pending');
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-500/30 animate-pulse transition-all cursor-pointer"
                title="Kutilayotgan buyurtmalarni qabul qilish"
              >
                <BellRing className="w-4 h-4 animate-bounce" />
                <span>Yangi ({pendingOrdersCount})</span>
              </button>
            )}

            {/* Sound Equalizer & Toggle */}
            <button
              onClick={() => {
                unlockAudio();
                const next = !isMuted;
                setIsMuted(next);
                localStorage.setItem('admin_sound_muted', next ? '1' : '0');
                if (!next) {
                  playChime();
                  showToast("Ovozli signal yoqildi (Sinov chimesi chalindi)", 'info');
                } else {
                  showToast("Ovozli signal o'chirildi", 'info');
                }
              }}
              title={isMuted ? "Ovoz o'chirilgan (Yoqish uchun bosing)" : "Ovoz yoqilgan"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-xs ${
                isMuted
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 bg-amber-600 rounded-full animate-sound-1"></span>
                  <span className="w-0.5 bg-amber-600 rounded-full animate-sound-2"></span>
                  <span className="w-0.5 bg-amber-600 rounded-full animate-sound-3"></span>
                </div>
              )}
              <span>{isMuted ? "Ovoz: O'chiq" : "Ovoz: Faol"}</span>
            </button>

            {/* Auto Accept Status Pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs ${
              autoAccept
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {autoAccept ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>Avto-qabul: Faol</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Qo'lda qabul</span>
                </>
              )}
            </div>

            {/* Mini App Link */}
            <a
              href={MINI_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer active:scale-95"
            >
              <span>Mini App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-8 space-y-8 max-w-7xl">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={dashboardLoading}
              onGoToOrders={() => setActiveTab('orders')}
              onGoToProducts={() => setActiveTab('products')}
              onGoToCouriers={() => setActiveTab('couriers')}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              loading={productsLoading}
              onAddProduct={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  category_id: categories[0]?.id || '',
                  description: '',
                  price: '',
                  image_url: '',
                  is_available: 1
                });
                setIsProductModalOpen(true);
              }}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setProductForm({
                  name: p.name,
                  category_id: p.category_id || '',
                  description: p.description || '',
                  price: p.price,
                  image_url: p.image_url || '',
                  is_available: p.is_available
                });
                setIsProductModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              loading={ordersLoading}
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              onUpdateStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              autoAccept={autoAccept}
              onToggleAutoAccept={handleToggleAutoAccept}
              onAcceptAllPending={handleAcceptAllPending}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              users={users}
              loading={usersLoading}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
            />
          )}

          {activeTab === 'couriers' && (
            <CouriersView showToast={showToast} askConfirm={askConfirm} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              onSaveSettings={handleSaveSettings}
              loading={settingsLoading}
              showToast={showToast}
              askConfirm={askConfirm}
            />
          )}
        </main>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        isEditing={!!editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        categories={categories}
        onFileChange={(e: ChangeEvent<HTMLInputElement> | { target: { files: any[] } }) => {
          const files = (e.target as HTMLInputElement).files;
          setProductImageFile(files && files[0] ? files[0] : null);
        }}
        onSave={handleSaveProduct}
      />

      <Toast toasts={toasts} />
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        onConfirm={confirmState?.onConfirm}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
