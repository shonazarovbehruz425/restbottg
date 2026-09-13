import axios from 'axios';
import { sendInitData } from './telegram';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const initData = sendInitData();
  if (initData) {
    config.headers.set('x-telegram-init-data', initData);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const friendly =
      error?.response?.data?.error || error?.message || "So'rovda xatolik yuz berdi";
    if (error && typeof error === 'object') {
      error.message = friendly;
    }
    return Promise.reject(error);
  },
);

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

/**
 * Mahsulot rasmi URL'ini yasaydi.
 * - bo'sh bo'lsa fallback qaytaradi
 * - absolut URL bo'lsa o'zini qaytaradi
 * - `/uploads...` bo'lsa API host'i bilan birlashtiradi (hardcode'siz)
 */
export function getImageUrl(path?: string | null): string {
  if (!path) return FALLBACK_IMAGE;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  if (path.startsWith('/uploads')) {
    try {
      const base = new URL(API_BASE_URL);
      return `${base.protocol}//${base.host}${path}`;
    } catch {
      return path;
    }
  }
  return path;
}

export default api;
