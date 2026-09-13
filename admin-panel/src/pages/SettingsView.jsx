import React, { useState } from 'react';
import api from '../lib/api';
import {
  Save,
  Store,
  Send,
  Lock,
  Database,
  Check,
  HelpCircle,
  UploadCloud,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsView({ settings, setSettings, onSaveSettings, loading, showToast, askConfirm }) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const notify = showToast || (() => {});
  const confirmAction = askConfirm || (({ onConfirm }) => onConfirm?.());

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings(e);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleBackupUsers = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.post('/backup-users');
      const d = res.data;
      notify(d.message || d.error || 'Baza kanalga yuborildi!', 'success');
    } catch (e) {
      notify('Xatolik: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreUsers = async () => {
    confirmAction({
      title: 'Bazani tiklash',
      message: 'Rostdan ham zaxira faylidan foydalanuvchilarni qayta tiklamoqchimisiz?',
      confirmText: 'Ha, tiklash',
      onConfirm: async () => {
        try {
          setIsRestoring(true);
          const res = await api.post('/restore-users');
          const d = res.data;
          notify(d.message || d.error || 'Tiklash muvaffaqiyatli amalga oshirildi!', 'success');
        } catch (e) {
          notify('Xatolik: ' + (e.response?.data?.error || e.message), 'error');
        } finally {
          setIsRestoring(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 animate-tab-content">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-100 rounded-lg" />
          <div className="h-3 w-72 bg-slate-100 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
          <p className="text-xs text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-tab-content">
      {/* 1. Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Tizim va Telegram Bot Sozlamalari
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Restoran parametrlari, Telegram kanallari integratsiyasi va admin panel xavfsizligi
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Barcha sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Restoran parametrlari */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Restoran Ma'lumotlari & Yetkazib Berish
              </h3>
              <p className="text-[11px] text-slate-400">
                Mijozlar Mini Appda ko'radigan asosiy nom va tariflar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Restoran Nomi
              </label>
              <input
                type="text"
                placeholder="Masalan: Rayhon Milliy Taomlar"
                value={settings.restaurant_name || ''}
                onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yetkazib berish narxi (so'mda)
              </label>
              <input
                type="number"
                placeholder="15000"
                value={settings.delivery_fee || ''}
                onChange={(e) => setSettings({ ...settings, delivery_fee: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Telegram Kanallar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Telegram Kanallari Integratsiyasi
              </h3>
              <p className="text-[11px] text-slate-400">
                Buyurtmalar va zaxira ma'lumotlari yuboriladigan kanallar
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Buyurtmalar tushadigan Telegram Kanal ID si
                </label>
                <span className="text-[10px] text-slate-400 font-mono">-100xxxxxxxxx yoki @kanal</span>
              </div>
              <input
                type="text"
                placeholder="-1001234567890"
                value={settings.channel_id || ''}
                onChange={(e) => setSettings({ ...settings, channel_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Bot ushbu kanalga admin qilib qo'shilgan bo'lishi shart.</span>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Foydalanuvchilar zaxira bazasi (.js) tushadigan Kanal ID si
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Ixtiyoriy</span>
              </div>
              <input
                type="text"
                placeholder="-100xxxxxxxxxx"
                value={settings.backup_channel_id || ''}
                onChange={(e) => setSettings({ ...settings, backup_channel_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Agar bo'sh qoldirsangiz, yuqoridagi asosiy buyurtmalar kanaliga yuboriladi.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Admin Login & Parol */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Admin Panel Xavfsizligi
              </h3>
              <p className="text-[11px] text-slate-400">
                Web boshqaruv paneliga kirish login va paroli
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Web Admin Logini
              </label>
              <input
                type="text"
                placeholder="admin"
                value={settings.admin_username || ''}
                onChange={(e) => setSettings({ ...settings, admin_username: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Web Admin Paroli
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  placeholder="Yangi parol..."
                  value={settings.admin_password || ''}
                  onChange={(e) => setSettings({ ...settings, admin_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showAdminPassword ? 'Parolni bekitish' : 'Parolni ko‘rsatish'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Sozlamalarni Saqlash</span>
          </button>
        </div>
      </form>

      {/* Card 4: Bazani Zaxiralash va Tiklash */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Foydalanuvchilar Bazasini Boshqarish (.js)
            </h3>
            <p className="text-[11px] text-slate-400">
              Bot va serverdagi ma'lumotlarni Telegram kanalga zaxira fayl sifatida yuborish yoki tiklash
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={isBackingUp}
            onClick={handleBackupUsers}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span>{isBackingUp ? 'Yuborilmoqda...' : 'Bazani Kanalga Jo\'natish (.js)'}</span>
          </button>

          <button
            type="button"
            disabled={isRestoring}
            onClick={handleRestoreUsers}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Tiklanmoqda...' : 'Bazani Tiklash (Restore)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
