import React, { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  CreditCard,
  MapPin,
  Clock,
  Globe,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Moon,
  Sun,
  Bike,
  Phone
} from 'lucide-react';
import type { TgUser, UserProfile } from '../types';
import { useTheme } from '../ThemeContext';
import { API_BASE_URL } from '../lib/api';
import { getTelegramUser } from '../lib/telegram';

interface ProfileViewProps {
  tgUser: TgUser | null;
  userProfile: UserProfile | null;
  isCourier?: boolean;
  onGoToCourier?: () => void;
  onGoToMenu: () => void;
  onGoToHistory: () => void;
}

export default function ProfileView({ 
  tgUser, 
  userProfile, 
  isCourier,
  onGoToCourier,
  onGoToMenu, 
  onGoToHistory 
}: ProfileViewProps) {
  const { isDark, toggleTheme } = useTheme();
  const orders = userProfile?.orders || [];
  const totalOrdersCount = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Avatar rasm yuklanmasa ikonka fallback ko'rsatiladi
  const [avatarError, setAvatarError] = useState(false);
  // ID nusxalanganda kichik toast ko'rsatiladi
  const [copied, setCopied] = useState(false);

  // tgUser yoki getTelegramUser orqali foydalanuvchini aniqlash
  const activeUser = tgUser || getTelegramUser();
  const displayName = activeUser
    ? `${activeUser.first_name || ''} ${activeUser.last_name || ''}`.trim()
    : [userProfile?.user?.first_name, userProfile?.user?.last_name].filter(Boolean).join(' ') || (typeof window !== 'undefined' ? localStorage.getItem('last_customer_name') : '') || 'Mijoz profili';
  
  const displayUsername = activeUser?.username || userProfile?.user?.username || '';
  const displayId = activeUser?.id ?? userProfile?.user?.telegram_id ?? null;
  const displayPhone = userProfile?.user?.phone || (typeof window !== 'undefined' ? localStorage.getItem('last_customer_phone') : '') || '';

  // Avatar manbasi zanjiri:
  // 1. activeUser.photo_url
  // 2. userProfile.user.photo_url
  // 3. /api/users/avatar/:id (backend Telegram'dan olib beradi yoki SVG avatar yaratadi)
  const userPhoto = activeUser?.photo_url || userProfile?.user?.photo_url;
  const avatarSrc = userPhoto || (displayId != null ? `${API_BASE_URL}/users/avatar/${displayId}` : null);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

  const initialChar = (displayName || 'M').trim().charAt(0).toUpperCase() || 'M';

  // ID chiptini bosilganda nusxalash + kichik toast
  const copyId = async () => {
    if (displayId == null) return;
    try {
      await navigator.clipboard.writeText(String(displayId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Nusxalash qo'llab-quvvatlanmasa jim o'tadi
    }
  };

  return (
    <main className="max-w-md mx-auto px-4.5 pt-2 pb-6 space-y-4">
      {/* 1. Mijoz profili kartasi (Telegram ma'lumotlari) */}
      <div className="relative bg-white dark:bg-[#1A241E] rounded-[28px] p-5 border border-neutral-200/70 dark:border-neutral-800 shadow-soft flex items-center space-x-4">
        {/* Avatar rasmi: kichkina dumaloq ichida (rounded-full) */}
        {avatarSrc && !avatarError ? (
          <img
            src={avatarSrc}
            alt={displayName}
            onError={() => setAvatarError(true)}
            className="w-13 h-13 rounded-full object-cover shrink-0 border-2 border-emerald-400 dark:border-emerald-600 shadow-sm"
          />
        ) : (
          <div className="w-13 h-13 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 text-white flex items-center justify-center font-extrabold text-xl border-2 border-emerald-400 dark:border-emerald-600 shrink-0 shadow-sm">
            {initialChar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-extrabold text-sm text-[#11311F] dark:text-[#E8F0EA] truncate">
              {displayName || 'Mijoz profili'}
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
            {displayUsername ? `@${displayUsername}` : (displayId ? `ID: ${displayId}` : 'Telegram foydalanuvchisi')}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium truncate mt-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{displayPhone || 'Telefon kiritilmagan'}</span>
          </p>
          {displayId != null && (
            <button
              type="button"
              onClick={copyId}
              title="Bosing — ID nusxalanadi"
              className="mt-1.5 inline-flex items-center text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              ID: {displayId}
            </button>
          )}
        </div>
        {/* ID nusxalandi toast */}
        {copied && (
          <div className="absolute top-2 right-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
            ID nusxalandi ✓
          </div>
        )}
      </div>

      {/* Telegram'dan tashqarida (brauzerda) ochilganda ogohlantirish */}
      {!tgUser && !displayId && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-[20px] p-4 border border-amber-200/70 dark:border-amber-800/40 text-xs font-bold text-amber-800 dark:text-amber-300">
          Profil ma'lumotlari ko'rinmayaptimi? Ilovani Telegram'dagi bot tugmasi orqali oching — shunda ismingiz, rasmingiz va raqamingiz shu yerda chiqadi.
        </div>
      )}

      {/* 2. Mijoz Statistikasi (Buyurtmalar & Xaridlar) */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          onClick={onGoToHistory}
          className="bg-white dark:bg-[#1A241E] rounded-[24px] p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-soft cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mb-2">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 block">Jami buyurtmalar</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-base font-black text-[#11311F] dark:text-[#E8F0EA]">{totalOrdersCount} ta</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A241E] rounded-[24px] p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-soft">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mb-2">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 block">Jami xaridlar</span>
          <span className="text-base font-black text-emerald-800 dark:text-emerald-400 mt-0.5 block truncate">
            {totalSpent.toLocaleString()} <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold">so'm</span>
          </span>
        </div>
      </div>

      {/* 3. Foydali Bo'limlar & Sozlamalar */}
      <div className="bg-white dark:bg-[#1A241E] rounded-[26px] p-2 border border-neutral-200/70 dark:border-neutral-800 shadow-soft divide-y divide-neutral-100 dark:divide-neutral-800">
        
        {/* Tungi rejim (Dark Mode) */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-neutral-100 text-neutral-700'
            }`}>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs font-bold text-[#11311F] dark:text-[#E8F0EA] block">Tungi rejim</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {isDark ? "Qorong'u mavzu yoqilgan" : "Yorug' mavzu yoqilgan"}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            type="button"
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer flex items-center ${
              isDark ? 'bg-emerald-600 justify-end' : 'bg-neutral-200 justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Buyurtmalar tarixiga tezkor o'tish */}
        <button
          onClick={onGoToHistory}
          className="w-full p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-[#223027] rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#11311F] dark:text-[#E8F0EA] block">Buyurtmalar tarixi</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Barcha berilgan buyurtmalarni kuzatish</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
        </button>

        {/* Kuryer Paneli (Kuryer bo'lsa) */}
        {isCourier && onGoToCourier && (
          <button
            onClick={onGoToCourier}
            className="w-full p-3.5 flex items-center justify-between hover:bg-amber-50/70 dark:hover:bg-amber-950/30 rounded-2xl transition-colors cursor-pointer border border-amber-200/70 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Bike className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-amber-900 dark:text-amber-300 block">Kuryer Boshqaruv Paneli</span>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Tayyor buyurtmalarni yetkazib berish</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </button>
        )}

        {/* Taom buyurtma qilish */}
        <button
          onClick={onGoToMenu}
          className="w-full p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-[#223027] rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#11311F] dark:text-[#E8F0EA] block">Menyudan taom tanlash</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Yangi va lazzatli taomlar ro'yxati</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
        </button>

        {/* Restoran haqida va Ish vaqti */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#11311F] dark:text-[#E8F0EA] block">Ish vaqti & Yetkazib berish</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Har kuni: 09:00 — 23:00 gacha</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/40">
            Ochiq
          </span>
        </div>

        {/* Ilova tili */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#202E24] text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#11311F] dark:text-[#E8F0EA]">Ilova tili</span>
          </div>
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">O'zbekcha</span>
        </div>

        {/* Qo'llab-quvvatlash */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#11311F] dark:text-[#E8F0EA] block">Yordam va aloqa</span>
              <a 
                href="tel:+998702195555" 
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                title="Qo'ng'iroq qilish"
              >
                <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">+998 70 219 55 55</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">• Operator</span>
              </a>
            </div>
          </div>
          <a
            href="tel:+998702195555"
            className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer border border-emerald-100 dark:border-emerald-800/40 flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0"
            title="+998 70 219 55 55 raqamiga qo'ng'iroq qilish"
          >
            <Phone className="w-3 h-3 stroke-[2.5]" />
            <span>Qo'ng'iroq</span>
          </a>
        </div>

      </div>

      {/* Versiya */}
      <div className="text-center pt-2">
        <p className="text-[10px] font-bold text-neutral-300 dark:text-neutral-600">
          Lazzat Restoran Telegram Mini App • v1.0.0
        </p>
      </div>
    </main>
  );
}
