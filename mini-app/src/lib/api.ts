import axios from 'axios';
import { sendInitData } from './telegram';

const envApi = import.meta.env.VITE_API_URL;
export const API_BASE_URL =
  (envApi && envApi.trim()) ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');

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

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

/**
 * Mahsulot rasmi URL'ini yasaydi.
 * - bo'sh bo'lsa fallback qaytaradi
 * - absolut URL bo'lsa o'zini qaytaradi
 * - `/uploads...` yoki fayl nomi bo'lsa to'liq host bilan birlashtiradi
 */
export function getImageUrl(path?: string | null): string {
  if (!path || !path.trim()) return FALLBACK_IMAGE;
  const p = path.trim();
  if (
    p.startsWith('http://') ||
    p.startsWith('https://') ||
    p.startsWith('data:') ||
    p.startsWith('blob:')
  ) {
    return p;
  }

  const uploadPath = p.startsWith('/uploads') ? p : `/uploads/${p.replace(/^\/+/, '')}`;

  if (API_BASE_URL && (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://'))) {
    const origin = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${origin}${uploadPath}`;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    if (window.location.port === '5173') {
      return `http://localhost:5000${uploadPath}`;
    }
    return `${window.location.origin}${uploadPath}`;
  }
  return uploadPath;
}

export async function cancelOrder(orderId: number, reason?: string) {
  const res = await api.post(`/orders/${orderId}/cancel`, { reason });
  return res.data;
}

export default api;
