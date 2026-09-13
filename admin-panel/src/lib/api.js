import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_URL = API_URL.replace(/\/api\/?$/, '');
export const MINI_APP_URL = import.meta.env.VITE_MINI_APP_URL || 'http://localhost:5173';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_session_token');
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('session') !== 'expired') {
          url.searchParams.set('session', 'expired');
          window.location.href = url.toString();
        } else {
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);

export function getImageUrl(path, fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500') {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${SERVER_URL}${path}`;
  return path;
}

export default api;
