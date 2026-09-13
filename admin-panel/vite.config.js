import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Single-service rejimda (Render'da bitta Web Service) admin-panel
// backend manzili + /admin ostida serve qilinadi:
//   Render Environment'da SINGLE_SERVICE=1 bo'lsa build base '/admin/' bo'ladi.
// Lokal'da (npm run dev / oddiy build) hech narsa o'zgarmaydi.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' && process.env.SINGLE_SERVICE === '1' ? '/admin/' : '/',
  server: {
    port: 5174,
    host: true
  }
}))
