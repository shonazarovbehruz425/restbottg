import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Bike,
  Plus,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { Courier, CourierInvite } from '../types';

interface CouriersViewProps {
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  askConfirm?: (opts: {
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }) => void;
}

export default function CouriersView({ showToast, askConfirm }: CouriersViewProps) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'couriers' | 'invites'>('couriers');

  const notify = showToast || (() => {});
  const confirmAction = askConfirm || (({ onConfirm }) => onConfirm?.());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, iRes] = await Promise.all([
        api.get('/couriers/list'),
        api.get('/couriers/invites')
      ]);
      setCouriers(cRes.data.data || []);
      setInvites(iRes.data.data || []);
    } catch (err) {
      console.error('Kuryerlar ma\'lumotini yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const res = await api.post('/couriers/generate-invite');
      if (res.data.success) {
        setGeneratedInvite(res.data);
        fetchData();
        notify('Taklif havolasi yaratildi!', 'success');
      }
    } catch (err: any) {
      notify('Taklif havolasi yaratishda xato: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleCopyLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = async (courier: Courier) => {
    const newStatus = courier.status === 'active' ? 'blocked' : 'active';
    confirmAction({
      title: 'Kuryer statusi',
      message: `Kuryerni ${newStatus === 'blocked' ? 'bloklashni' : 'faollashtirishni'} xohlaysizmi?`,
      confirmText: 'Ha, tasdiqlayman',
      onConfirm: async () => {
        try {
          await api.patch(`/couriers/${courier.id}/status`, { status: newStatus });
          fetchData();
          notify('Kuryer statusi yangilandi.', 'success');
        } catch (err: any) {
          notify('Statusni o\'zgartirishda xatolik: ' + (err.response?.data?.error || err.message), 'error');
        }
      },
    });
  };

  const handleDeleteCourier = async (id: number | string) => {
    confirmAction({
      title: 'Kuryerni o‘chirish',
      message: 'Ushbu kuryerni ro\'yxatdan o\'chirishni tasdiqlaysizmi?',
      confirmText: 'Ha, o‘chirish',
      onConfirm: async () => {
        try {
          await api.delete(`/couriers/${id}`);
          fetchData();
          notify('Kuryer o‘chirildi.', 'success');
        } catch (err: any) {
          notify('O\'chirishda xatolik: ' + (err.response?.data?.error || err.message), 'error');
        }
      },
    });
  };

  const handleDeleteInvite = async (id: number | string) => {
    confirmAction({
      title: 'Taklifni o‘chirish',
      message: 'Ushbu taklif havolasini o\'chirmoqchimisiz?',
      confirmText: 'Ha, o‘chirish',
      onConfirm: async () => {
        try {
          await api.delete(`/couriers/invites/${id}`);
          fetchData();
          notify('Taklif havolasi o‘chirildi.', 'success');
        } catch (err: any) {
          notify('O\'chirishda xatolik: ' + (err.response?.data?.error || err.message), 'error');
        }
      },
    });
  };

  const totalCouriers = couriers.length;
  const onlineCouriers = couriers.filter((c) => Number(c.is_online) === 1 && c.status === 'active').length;
  const totalCompletedOrders = couriers.reduce((sum, c) => sum + (c.completed_orders || 0), 0);

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Header & Havola generatsiya qilish tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Kuryerlar Boshqaruvi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/60">
              {totalCouriers} nafar
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kuryerlarni taklif qilish, maxsus ro'yxatdan o'tish havolasi yaratish va navbatchilik nazorati
          </p>
        </div>

        <button
          onClick={handleGenerateInvite}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Kuryer Taklif Havolasi</span>
        </button>
      </div>

      {/* 2. Yangi generatsiya qilingan havola modali / bildirishnomasi */}
      {generatedInvite && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-850 rounded-3xl p-5 space-y-3 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Yangi Kuryer Taklif Havolasi Tayyor!</span>
            </div>
            <button
              onClick={() => setGeneratedInvite(null)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-bold cursor-pointer"
            >
              Yopish
            </button>
          </div>

          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            Ushbu havolani yangi kuryerga yuboring. Kuryer bitta botning o'zida havolani bosib kirganda tizim uni avtomatik kuryer deb taniydi va kuryer ishchi kabineti ochiladi:
          </p>

          <div className="flex items-center gap-2 bg-white dark:bg-[#0F172A] p-2 rounded-2xl border border-amber-200 dark:border-slate-800">
            <input
              type="text"
              readOnly
              value={generatedInvite.invite_url || `Token: courier_${generatedInvite.token}`}
              className="w-full text-xs font-mono text-slate-800 dark:text-slate-100 bg-transparent outline-none px-3 font-semibold"
            />
            <button
              onClick={() => handleCopyLink(generatedInvite.invite_url)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Nusxalandi!" : "Nusxalash"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Statistika kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Jami Kuryerlar</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalCouriers} nafar</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Bike className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Hozir Ishda (Onlayn)</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{onlineCouriers} nafar</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Yetkazilgan Zakazlar</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalCompletedOrders} ta</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Tablar: Ro'yxatdagi kuryerlar va Taklif havolalari */}
      <div className="flex flex-wrap sm:flex-nowrap bg-slate-200/70 dark:bg-slate-900 p-1 rounded-2xl w-full sm:w-fit gap-1 text-xs font-bold border border-transparent dark:border-slate-800 max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('couriers')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'couriers' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Kuryerlar Ro'yxati ({couriers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('invites')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'invites' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Yaratilgan Taklif Havolalari ({invites.length})
        </button>
      </div>

      {/* 5. Asosiy jadvallar */}
      {activeSubTab === 'couriers' ? (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
          ) : couriers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center mx-auto mb-2">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Hozircha kuryerlar mavjud emas</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Yuqoridagi "Yangi Kuryer Taklif Havolasi" tugmasini bosing va havolani xodimingizga yuboring.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-400 font-extrabold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Kuryer</th>
                    <th className="px-6 py-4">Telegram ID</th>
                    <th className="px-6 py-4">Holati</th>
                    <th className="px-6 py-4">Ish Rejimi</th>
                    <th className="px-6 py-4">Yetkazgan zakazlari</th>
                    <th className="px-6 py-4">A'zo bo'lgan sana</th>
                    <th className="px-6 py-4 pr-6 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {couriers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center text-xs shrink-0">
                            {c.first_name ? c.first_name[0].toUpperCase() : 'K'}
                          </div>
                          <div>
                            <span className="block font-extrabold text-slate-900 dark:text-white">{c.first_name} {c.last_name || ''}</span>
                            <span className="text-[11px] text-slate-400">
                              {c.username ? `@${c.username}` : 'Username yo\'q'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 font-medium">
                        {c.telegram_id}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span>{c.status === 'active' ? 'Faol' : 'Bloklangan'}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          Number(c.is_online) === 1
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${Number(c.is_online) === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>{Number(c.is_online) === 1 ? 'Onlayn (Ishda)' : 'Oflayn'}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {c.completed_orders || 0} ta
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('uz-UZ')}
                      </td>

                      <td className="px-6 py-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            c.status === 'active'
                              ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300'
                              : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300'
                          }`}
                        >
                          {c.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
                        </button>

                        <button
                          onClick={() => handleDeleteCourier(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
          ) : invites.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Hozircha generatsiya qilingan takliflar mavjud emas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-400 font-extrabold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Token</th>
                    <th className="px-6 py-4">Holati</th>
                    <th className="px-6 py-4">Foydalangan foydalanuvchi</th>
                    <th className="px-6 py-4">Yaratilgan vaqt</th>
                    <th className="px-6 py-4 pr-6 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invites.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-400">#{inv.id}</td>
                      <td className="px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">{inv.token}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          Number(inv.is_used) === 1
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${Number(inv.is_used) === 1 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <span>{Number(inv.is_used) === 1 ? 'Ishlatilgan' : 'Kutilmoqda (Faol)'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {inv.used_by ? (
                           <span>{inv.first_name || ''} {inv.last_name || ''} ({inv.used_by})</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(inv.created_at).toLocaleString('uz-UZ')}
                      </td>
                      <td className="px-6 py-4 pr-6 text-right">
                        <button
                          onClick={() => handleDeleteInvite(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
