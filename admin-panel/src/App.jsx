import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, User, Lock, Eye, EyeOff } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './pages/DashboardView';
import ProductsView from './pages/ProductsView';
import OrdersView from './pages/OrdersView';
import UsersView from './pages/UsersView';
import CouriersView from './pages/CouriersView';
import SettingsView from './pages/SettingsView';
import ProductModal from './components/ProductModal';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [loggedInAdmin, setLoggedInAdmin] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentOrders: []
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    image_url: '',
    is_available: 1
  });
  const [productImageFile, setProductImageFile] = useState(null);

  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('');

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  const [settings, setSettings] = useState({
    restaurant_name: '',
    delivery_fee: '',
    channel_id: '',
    admin_username: 'admin',
    admin_password: ''
  });

  useEffect(() => {
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get(`${API_BASE}/admin/verify-session`);
      if (res.data.valid) {
        setIsAuthenticated(true);
        setLoggedInAdmin(res.data.username || 'admin');
      } else {
        throw new Error('Yaroqsiz sessiya');
      }
    } catch (err) {
      localStorage.removeItem('admin_session_token');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    } finally {
      setIsVerifyingSession(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
      fetchProducts();
      fetchOrders();
      fetchUsers();
      fetchSettings();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Iltimos, login va parolni kiriting!');
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await axios.post(`${API_BASE}/admin/login`, {
        username: usernameInput.trim(),
        password: passwordInput.trim()
      });

      if (res.data.success && res.data.session_token) {
        const token = res.data.session_token;
        localStorage.setItem('admin_session_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setLoggedInAdmin(res.data.admin?.username || usernameInput.trim());
        setIsAuthenticated(true);
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login yoki parol noto\'g\'ri!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/admin/logout`);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('admin_session_token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setLoggedInAdmin('');
    setUsernameInput('');
    setPasswordInput('');
    setLoginError('');
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard-stats`);
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API_BASE}/products`),
        axios.get(`${API_BASE}/categories`)
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders`, {
        params: { status: orderFilter || undefined }
      });
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      setSettings(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('category_id', productForm.category_id || (categories[0] ? categories[0].id : ''));
    formData.append('description', productForm.description);
    formData.append('price', productForm.price);
    formData.append('is_available', productForm.is_available);
    if (productImageFile) {
      formData.append('image', productImageFile);
    } else if (productForm.image_url) {
      formData.append('image_url', productForm.image_url);
    }

    try {
      if (editingProduct) {
        await axios.put(`${API_BASE}/products/${editingProduct.id}`, formData);
      } else {
        await axios.post(`${API_BASE}/products`, formData);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductImageFile(null);
      setProductForm({ name: '', category_id: '', description: '', price: '', image_url: '', is_available: 1 });
      fetchProducts();
    } catch (err) {
      alert('Taomni saqlashda xato: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Rostdan ham bu taomni o\'chirmoqchimisiz?')) {
      await axios.delete(`${API_BASE}/products/${id}`);
      fetchProducts();
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      fetchDashboard();
    } catch (err) {
      alert('Holatni o\'zgartirishda xato: ' + err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (confirm(`Buyurtma #${orderId} ni o'chirmoqchimisiz?`)) {
      try {
        await axios.delete(`${API_BASE}/orders/${orderId}`);
        fetchOrders();
        fetchDashboard();
      } catch (err) {
        alert('O\'chirishda xatolik: ' + err.message);
      }
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/settings`, settings);
      alert('Sozlamalar muvaffaqiyatli saqlandi!');
    } catch (err) {
      alert('Saqlashda xatolik: ' + err.message);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        <div className="flex items-center gap-3 bg-slate-900/90 px-7 py-4 rounded-2xl border border-slate-800 shadow-xl">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold text-xs text-slate-300">Sessiya tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient background glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative z-10 border border-slate-100">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-400 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/30">
              🍽
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Restoran Admin Panel</h1>
            <p className="text-xs text-slate-500">Tizimga kirish uchun login va parolingizni kiriting</p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl text-center animate-fade-in">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Login (Foydalanuvchi nomi)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="admin"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Parol</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 tracking-wide"
            >
              {isLoggingIn ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-800">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingOrders={stats.pendingOrders}
        onLogout={handleLogout}
        loggedInAdmin={loggedInAdmin}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-black text-slate-900 capitalize tracking-tight">
              {activeTab === 'dashboard' && 'Umumiy Ko\'rsatkichlar'}
              {activeTab === 'orders' && 'Buyurtmalar Nazorati'}
              {activeTab === 'products' && 'Taomlar va Menyu Boshqaruvi'}
              {activeTab === 'users' && 'Bot Foydalanuvchilari'}
              {activeTab === 'couriers' && 'Kuryerlar Boshqaruvi'}
              {activeTab === 'settings' && 'Tizim Sozlamalari'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">Real-vaqt monitoringi va restoran boshqaruvi</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sessiya: {loggedInAdmin || 'admin'}</span>
            </div>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>Mijoz Mini Appini ko'rish</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        <main className="p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <DashboardView 
              stats={stats} 
              onGoToOrders={() => setActiveTab('orders')}
              onGoToProducts={() => setActiveTab('products')}
              onGoToCouriers={() => setActiveTab('couriers')}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
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
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              onUpdateStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              users={users}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
            />
          )}

          {activeTab === 'couriers' && (
            <CouriersView />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              onSaveSettings={handleSaveSettings}
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
        onFileChange={(e) => setProductImageFile(e.target.files[0])}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
