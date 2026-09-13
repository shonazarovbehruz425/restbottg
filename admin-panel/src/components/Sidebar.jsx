import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  Bike, 
  Settings, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingOrders, onLogout, loggedInAdmin }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Buyurtmalar', icon: ShoppingBag, badge: pendingOrders },
    { id: 'products', label: 'Taomlar & Menyu', icon: UtensilsCrossed },
    { id: 'users', label: 'Mijozlar', icon: Users },
    { id: 'couriers', label: 'Kuryerlar', icon: Bike },
    { id: 'settings', label: 'Sozlamalar & Bot', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800/80 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25 shrink-0">
              🍽
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold text-white text-base leading-tight tracking-tight truncate">
                Restoran Admin
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
                  Boshqaruv Tizimi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-6">
          <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2">
            Asosiy Bo'limlar
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white shadow-xs animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Admin User Footer Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
              {loggedInAdmin ? loggedInAdmin[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {loggedInAdmin || 'Administrator'}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Faol Sessiya
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Chiqish"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
