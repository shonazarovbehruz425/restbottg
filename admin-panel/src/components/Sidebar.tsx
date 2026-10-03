import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  Bike, 
  Settings, 
  LogOut,
  ShieldCheck,
  Activity,
  LucideIcon
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrders: number;
  onLogout: () => void;
  loggedInAdmin?: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingOrders,
  onLogout,
  loggedInAdmin
}: SidebarProps) {
  const primaryNav: NavItem[] = [
    { id: 'dashboard', label: 'Boshqaruv Markazi', icon: LayoutDashboard },
    { id: 'orders', label: 'Buyurtmalar Nazorati', icon: ShoppingBag, badge: pendingOrders },
    { id: 'products', label: 'Taomlar & Menyu', icon: UtensilsCrossed },
  ];

  const managementNav: NavItem[] = [
    { id: 'users', label: 'Mijozlar Bazasi', icon: Users },
    { id: 'couriers', label: 'Kuryerlar & Yetkazish', icon: Bike },
    { id: 'settings', label: 'Tizim & Bot Sozlamalari', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-[#0B0F19] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800/70 select-none relative z-30 shadow-2xl">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/70 bg-[#090D16]">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-[1.5px] shadow-lg shadow-amber-500/20">
                <div className="w-full h-full rounded-[14px] bg-[#0F172A] flex items-center justify-center overflow-hidden">
                  <img
                    src="./samira-logo.png"
                    alt="Samira"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0F19] animate-pulse"></span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-white text-base leading-tight tracking-tight truncate">
                  Samira Fast Food
                </h2>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-amber-400 font-extrabold tracking-wider uppercase bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  POS Cloud v2.5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-5 space-y-6">
          {/* Section 1: Asosiy bo'limlar */}
          <div>
            <span className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
              Asosiy Panellar
            </span>
            <nav className="space-y-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const hasPending = item.id === 'orders' && Boolean(item.badge && item.badge > 0);

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 font-extrabold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'bg-white/15 text-white' : 'text-slate-400 group-hover:text-amber-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    {hasPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white shadow-md shadow-red-500/40 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: Boshqaruv va Tizim */}
          <div>
            <span className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
              Boshqaruv & Integratsiya
            </span>
            <nav className="space-y-1">
              {managementNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 font-extrabold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'bg-white/15 text-white' : 'text-slate-400 group-hover:text-amber-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="tracking-tight">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Admin User Footer Card */}
      <div className="p-4 border-t border-slate-800/70 bg-[#090D16]">
        {/* System ping bar */}
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-300">Server Aloqasi:</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold">Faol (Jonli)</span>
        </div>

        <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              {loggedInAdmin ? loggedInAdmin[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-white block truncate tracking-tight">
                {loggedInAdmin || 'Administrator'}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                Boshqaruvchi
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Tizimdan chiqish"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
