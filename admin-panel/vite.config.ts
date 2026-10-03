import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Single-service rejimda (Render'da bitta Web Service) admin-panel
// backend manzili + /admin ostida serve qilinadi:
//   Render Environment'da SINGLE_SERVICE=1 bo'lsa build base '/admin/' bo'ladi.
// Lokal'da (npm run dev / oddiy build) hech narsa o'zgarmaydi.
// Admin panel build paytida nisbiy (relative) yo'llardan foydalanadi (base: './').
// Bu orqali admin panel istalgan yo'ldan (masalan /admin/, /boshqaruv/, yoki http://localhost:5174/)
// o'zining JS va CSS assetlarini xatosiz yuklay oladi.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? './' : '/',
  server: {
    port: 5174,
    host: true
  }
}))
