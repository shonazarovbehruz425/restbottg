import axios, { InternalAxiosRequestConfig } from 'axios';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  (typeof window !== 'undefined' &&
  (window.location.port === '5000' || !window.location.port || window.location.hostname !== 'localhost')
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');

export const SERVER_URL: string = API_URL.replace(/\/api\/?$/, '');

export const MINI_APP_URL: string =
  (import.meta.env.VITE_MINI_APP_URL as string) ||
  (typeof window !== 'undefined' && window.location.port === '5000' ? '/' : 'http://localhost:5173');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('admin_session_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const urlStr = err.config?.url || '';
      const isAuthEndpoint = urlStr.includes('/admin/login') || urlStr.includes('/admin/verify-session');
      if (!isAuthEndpoint) {
        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_username');
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.get('session') !== 'expired') {
            url.searchParams.set('session', 'expired');
            window.location.href = url.toString();
          }
        } catch {
          // ignore
        }
      }
    }
    return Promise.reject(err);
  }
);

export function getImageUrl(
  path?: string | null,
  fallback: string = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
): string {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${SERVER_URL}${path}`;
  return path;
}

export default api;
