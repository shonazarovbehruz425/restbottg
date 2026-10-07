import React, { useState, FormEvent } from 'react';
import api from '../lib/api';
import {
  Save,
  Store,
  Database,
  Check,
  Radio,
  Send,
  Cloud,
  HardDrive,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { SettingsData } from '../types';

interface SettingsViewProps {
  settings: SettingsData;
  setSettings: React.Dispatch<React.SetStateAction<SettingsData>>;
  onSaveSettings: (e: FormEvent) => void | Promise<void>;
  loading?: boolean;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  askConfirm?: (opts: {
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }) => void;
}

export default function SettingsView({
  settings,
  setSettings,
  onSaveSettings,
  loading,
  showToast
}: SettingsViewProps) {
  const [isTestingChannel, setIsTestingChannel] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const notify = showToast || (() => {});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSaveSettings(e);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestChannel = async () => {
    if (!settings.channel_id || !settings.channel_id.trim()) {
      notify("Iltimos, avval Telegram Kanal ID yoki username'ini kiriting!", 'error');
      return;
    }

    try {
      setIsTestingChannel(true);
      const res = await api.post('/channel/test', {
        channel_id: settings.channel_id.trim()
      });
      notify(res.data?.message || 'Kanalga sinov xabari muvaffaqiyatli bordi!', 'success');
    } catch (err: any) {
      notify(err.response?.data?.error || err.message || "Kanalga ulanib bo'lmadi", 'error');
    } finally {
      setIsTestingChannel(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 animate-tab-content">
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
          <p className="text-xs text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const isChannelConfigured = Boolean(settings.channel_id && settings.channel_id.trim());
  const isPostgresActive = settings.database_type === 'neon_postgresql';
  const isR2Active = Boolean(settings.r2_configured);

  return (
    <div className="max-w-4xl space-y-6 animate-tab-content">
      {/* 1. Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Tizim Sozlamalari
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Telegram buyurtmalar kanali, yetkazib berish narxlari va bulutli ma'lumotlar bazasi
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold animate-fade-in shadow-xs">
            <Check className="w-3.5 h-3.5" />
            <span>Sozlamalar saqlandi!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ==========================================
            CARD 1: TELEGRAM BUYURTMALAR KANALI INTEGRATSIYASI
            ========================================== */}
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Telegram Buyurtmalar Kanali</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    isChannelConfigured
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  }`}>
                    {isChannelConfigured ? '🟢 Ulangan' : '🟡 Kiritilmagan'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Barcha yangi buyurtmalar darhol shu kanalga boradi va Admin Panel bilan 2 tomonlama to'liq bog'lanadi
                </p>
              </div>
            </div>

            {/* Test Ping tugmasi */}
            <button
              type="button"
              onClick={handleTestChannel}
              disabled={isTestingChannel || !isChannelConfigured}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 shrink-0"
              title="Kanalga bot admin qilinganligini va aloqa faolligini tekshirish"
            >
              <Send className={`w-3.5 h-3.5 ${isTestingChannel ? 'animate-bounce' : ''}`} />
              <span>{isTestingChannel ? 'Tekshirilmoqda...' : 'Kanalni tekshirish'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Telegram Kanal ID yoki Username
              </label>
              <input
                type="text"
                placeholder="Masalan: -1002345678901 yoki @samira_fastfood_orders"
                value={settings.channel_id || ''}
                onChange={(e) => setSettings({ ...settings, channel_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all dark:text-white dark:placeholder-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Yopiq kanallar uchun ID odatda <code>-100</code> bilan boshlanadi. Ochiq kanallar uchun esa <code>@kanal_nomi</code> ko'rinishida yozish mumkin.
              </p>
            </div>

            {/* Qo'llanma / Yo'riqnoma */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Kanalni ulash bo'yicha tezkor qo'llanma:</span>
              </span>
              <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside">
                <li>Telegram'da restoran buyurtmalari uchun kanal oching.</li>
                <li>Botni kanalingizga a'zo qilib qo'shing va unga <b>"Admin"</b> maqomini bering (xabar yozish huquqi bilan).</li>
                <li>Kanal ID sini (masalan <code>-100...</code>) yoki username'ini yuqoriga yozib <b>"Sozlamalarni Saqlash"</b> tugmasini bosing.</li>
                <li><b>"Kanalni tekshirish"</b> tugmasi orqali test xabar yuborib integratsiyani tekshiring.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ==========================================
            CARD 2: RESTORAN VA YETKAZIB BERISH
            ========================================== */}
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Restoran Ma'lumotlari
              </h3>
              <p className="text-[11px] text-slate-400">
                Ilovada ko'rinadigan restoran nomi va yetkazib berish haqi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Restoran Nomi
              </label>
              <input
                type="text"
                placeholder="Masalan: Samira Fast Food"
                value={settings.restaurant_name || ''}
                onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Yetkazib berish narxi (so'mda)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={settings.delivery_fee || ''}
                onChange={(e) => setSettings({ ...settings, delivery_fee: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Saqlash tugmasi */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Sozlamalarni Saqlash</span>
          </button>
        </div>
      </form>

      {/* ==========================================
          CARD 3: BULUTLI MA'LUMOTLAR BAZASI & STORAGE
          ========================================== */}
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Bulutli Infratuzilma Holati (Neon.tech & Cloudflare R2)
            </h3>
            <p className="text-[11px] text-slate-400">
              Eski Telegram zaxiralari o'rniga zamonaviy bulutli ma'lumotlar bazasi va rasm ombori
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Neon PostgreSQL Status */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span>PostgreSQL (Neon.tech)</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                isPostgresActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}>
                {isPostgresActive ? '🟢 Neon PostgreSQL Faol' : '⚪ SQLite Rejimi'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isPostgresActive
                ? "Barcha jadvallar, foydalanuvchilar va buyurtmalar Neon.tech bulutli serverida saqlanmoqda."
                : "Hozirda lokal SQLite ishlamoqda. Neon.tech ga o'tish uchun .env faylida DATABASE_URL sozlang."}
            </p>
          </div>

          {/* Cloudflare R2 Status */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <Cloud className="w-4 h-4 text-amber-500" />
                <span>Cloudflare R2 Storage</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                isR2Active
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}>
                {isR2Active ? '🟢 Cloudflare R2 Faol' : '⚪ Mahalliy Disk'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isR2Active
                ? "Barcha taom va xabar rasmlari Cloudflare R2 bulutli omboriga to'g'ridan-to'g'ri yuklanadi."
                : "Cloudflare R2 sozlanmagan bo'lsa, rasmlar serverning mahalliy /uploads katalogida saqlanadi."}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/60 dark:border-blue-900/40 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-500" />
          <span className="text-[11px]">
            Eski Telegram .js zaxiralash mexanizmi butunlay olib tashlandi. Buyurtmalar Telegram kanalga to'xtovsiz yetib boradi.
          </span>
        </div>
      </div>
    </div>
  );
}
