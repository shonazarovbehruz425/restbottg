// Telegram WebApp SDK uchun yagona wrapper.
// To'g'ridan-to'g'ri `window.Telegram` ga murojaat qilish o'rniga
// shu moduldagi helper'lardan foydalaning.

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  requestFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  isFullscreen?: boolean;
  initData: string;
  initDataUnsafe?: { user?: TelegramUser };
  colorScheme?: 'light' | 'dark';
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export function getTelegram(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function haptic(type: HapticType = 'light'): void {
  try {
    const tg = getTelegram();
    if (!tg?.HapticFeedback) return;
    if (type === 'success' || type === 'error' || type === 'warning') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Telegram kontekstidan tashqarida (brauzerda) indamay o'tkazamiz
  }
}

export function openLink(url: string): void {
  const tg = getTelegram();
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/** Telegram BackButton'ni ko'rsatish/berkitish. Cleanup funksiya qaytaradi. */
export function backButton(show: boolean, onClick: () => void): () => void {
  const btn = getTelegram()?.BackButton;
  if (!btn) return () => {};
  if (show) {
    btn.show();
    btn.onClick(onClick);
  } else {
    btn.hide();
    btn.offClick(onClick);
  }
  return () => {
    try {
      btn.offClick(onClick);
    } catch {
      // ignore
    }
  };
}

/** Backend tekshiruvi uchun `x-telegram-init-data` header qiymati. */
export function sendInitData(): string {
  return getTelegram()?.initData || '';
}

/**
 * Mini App'ni ochilishi bilanoq FULLSCREEN rejimda ochish.
 * Yangi client'larda requestFullscreen, eskilarda expand.
 * Vertical swipe bilan yopilish ham o'chiriladi (fullscreen saqlanadi).
 */
export function enterFullscreen(): void {
  try {
    const tg = getTelegram();
    if (!tg) return;
    tg.ready();
    if (typeof tg.requestFullscreen === 'function') {
      tg.requestFullscreen();
    } else {
      tg.expand();
    }
    try {
      tg.disableVerticalSwipes?.();
    } catch {
      // eski client — indamay o'tkazamiz
    }
    try {
      tg.setHeaderColor?.('bg_color');
      tg.setBackgroundColor?.('bg_color');
    } catch {
      // ignore
    }
  } catch {
    // Telegram kontekstidan tashqarida (brauzerda) indamay o'tkazamiz
  }
}
