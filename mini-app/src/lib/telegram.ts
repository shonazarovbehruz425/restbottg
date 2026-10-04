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

export interface TelegramLocationData {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  course?: number | null;
  speed?: number | null;
  horizontal_accuracy?: number | null;
  vertical_accuracy?: number | null;
  course_accuracy?: number | null;
  speed_accuracy?: number | null;
}

export interface TelegramLocationManager {
  isInited: boolean;
  isLocationAvailable: boolean;
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  init: (callback?: () => void) => void;
  getLocation: (callback: (data: TelegramLocationData | null) => void) => void;
  openSettings: () => void;
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
  LocationManager?: TelegramLocationManager;
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

/**
 * Telegram native LocationManager orqali aniq geolokatsiyani so'rash (Bot API 8.0+)
 */
export async function getTelegramLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const tg = getTelegram();
    const lm = tg?.LocationManager;
    if (!lm) return null;

    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 7000);

      const onGotLocation = (data: TelegramLocationData | null) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            resolve({ latitude: data.latitude, longitude: data.longitude });
          } else {
            resolve(null);
          }
        }
      };

      if (!lm.isInited) {
        lm.init(() => {
          try {
            lm.getLocation(onGotLocation);
          } catch {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(null);
            }
          }
        });
      } else {
        lm.getLocation(onGotLocation);
      }
    });
  } catch (err) {
    console.warn('getTelegramLocation error:', err);
    return null;
  }
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

/**
 * Telegram foydalanuvchisini har qanday kontekstdan (initDataUnsafe, initData string,
 * URL hash #tgWebAppData, URL search query ?tg_id=..., va localStorage) aniqlash.
 */
export function getTelegramUser(): TelegramUser | null {
  try {
    const tg = getTelegram();
    // 1. Direct object
    if (tg?.initDataUnsafe?.user?.id) {
      return tg.initDataUnsafe.user;
    }

    // 2. Parse from tg.initData string
    if (tg?.initData) {
      try {
        const params = new URLSearchParams(tg.initData);
        const userStr = params.get('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u && u.id) return u;
        }
      } catch {}
    }

    // 3. Parse from location.hash (#tgWebAppData=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        const hash = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);
        const webAppData = hashParams.get('tgWebAppData');
        if (webAppData) {
          const dataParams = new URLSearchParams(webAppData);
          const userStr = dataParams.get('user');
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u && u.id) return u;
          }
        }
        const directUser = hashParams.get('user');
        if (directUser) {
          const u = JSON.parse(directUser);
          if (u && u.id) return u;
        }
      } catch {}
    }

    // 4. Parse from location.search (?tg_id=...)
    if (typeof window !== 'undefined' && window.location.search) {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const qId = Number(searchParams.get('tg_id') || searchParams.get('id'));
        if (qId) {
          return {
            id: qId,
            first_name: searchParams.get('tg_first_name') || searchParams.get('first_name') || '',
            last_name: searchParams.get('tg_last_name') || searchParams.get('last_name') || '',
            username: searchParams.get('tg_username') || searchParams.get('username') || '',
            photo_url: searchParams.get('tg_photo_url') || ''
          };
        }
      } catch {}
    }

    // 5. Fallback from localStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_tg_user');
        if (cached) {
          const u = JSON.parse(cached);
          if (u && u.id) return u;
        }
      } catch {}
    }
  } catch (e) {
    console.error('getTelegramUser error:', e);
  }
  return null;
}
