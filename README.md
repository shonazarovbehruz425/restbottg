# Restoran Telegram Mini App va Web Admin Panel Tizimi

Ushbu loyiha Yandex Eats va Uzum Tezkor formatida yaratilgan zamonaviy restoran tizimidir.

## Loyiha tarkibi:
1. **`backend/`** — Node.js / Express API server, SQLite ma'lumotlar bazasi va Telegram Bot logikasi (oshxona kanaliga zakaz tashlash).
2. **`mini-app/`** — Foydalanuvchilar (mijozlar) uchun Telegram Mini App (React + Tailwind CSS). Menyu, profil, savat va buyurtma rasmiylashtirish.
3. **`admin-panel/`** — Restoran egalari uchun Google Chrome orqali boshqariladigan Web Admin Panel (React + Tailwind CSS).

---

## Tezkor ishga tushirish (Windows)

### 1-qadam — Environment fayllarni tayyorlash (birinchi marta):
```bat
copy backend\.env.example backend\.env
copy mini-app\.env.example mini-app\.env
copy admin-panel\.env.example admin-panel\.env
```
So'ng `backend\.env` ichiga real Bot token va kuchli `ADMIN_PASSWORD` yozing.
`.env` fayllar GitHub'ga chiqmaydi (`.gitignore` da yopilgan).

### 2-qadam — Ishga tushirish:
Ildiz papkadagi **`start.bat`** faylini ikki marta bosing. Bu barcha 3 ta qismni avtomatik ishga tushiradi:
- **Backend API:** `http://localhost:5000`
- **Foydalanuvchi Mini App:** `http://localhost:5173`
- **Web Admin Panel:** `http://localhost:5174`

Admin panelga kirish paroli: **`admin123`**

---

## Telegram Bot va Oshxona Kanalini ulash bo'yicha qo'llanma

### 1. Bot Token va Kanal ID larini .env da sozlash:
`backend/.env` faylini oching. Unda barcha parametrlar aniq va tushunarli nomlar bilan ajratilgan:

```env
# 1. Server porti
PORT=5000

# 2. Telegram Bot Tokeni (@BotFather dan olingan token)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# 3. Buyurtmalar (Oshxona / Zakazlar) Telegram Kanal ID si
TELEGRAM_ORDERS_CHANNEL_ID=-1001234567890

# 4. Foydalanuvchilar bazasi (.js) Backup tashlanadigan Telegram Kanal ID si
TELEGRAM_USERS_BACKUP_CHANNEL_ID=-1009876543210

# 5. Telegram Mini App Web URL manzili
TELEGRAM_MINI_APP_URL=http://localhost:5173

# 6. Web Admin Panel Paroli
ADMIN_PASSWORD=admin123

# 7. CORS ruxsat berilgan originlar
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 2. Kanallarni ulash va Botni Admin qilish:
1. Telegramda buyurtmalar uchun kanal (yoki guruh) oching va botni **Admin** qiling. Uning ID sini `TELEGRAM_ORDERS_CHANNEL_ID` ga yozing.
2. Agar foydalanuvchilar bazasi uchun alohida kanal ochmoqchi bo'lsangiz, uni ham ochib botni **Admin** qiling va ID sini `TELEGRAM_USERS_BACKUP_CHANNEL_ID` ga yozing. (Agar bo'sh qoldirsangiz, buyurtmalar kanalining o'ziga tashlaydi).
3. Bot kanalga admin bo'lishi bilanoq barcha foydalanuvchilar bazasini avtomatik `.js` formatda kanalga yuboradi.

Endi har safar mijoz Mini App orqali buyurtma bersa:
- Buyurtma to'liq shaklda oshxona kanaliga yuboriladi.
- Oshpazlar kanaldagi **"Qabul qilish"**, **"Kuryerga berish"** yoki **"Bekor qilish"** tugmalarini bosish orqali holatni boshqara oladilar.
- Mijozga esa o'zining shaxsiy Telegramida buyurtmasi holati yangilanganligi haqida xabar boradi.

---

## Imkoniyatlar

- **Mijozlar uchun:**
  - Real-vaqtda qidiruv, kategoriyalar, taomlar narxi va tavsifi.
  - Savatcha hisob-kitobi, yetkazib berish (dostavka) yoki olib ketish (samovivoz).
  - Geomanzilni bitta tugma orqali aniqlash va kuryerga yuborish.
  - Profil bo'limida avvalgi barcha buyurtmalar tarixini ko'rish.

- **Restoran Administratori uchun:**
  - Yangi taomlar qo'shish (rasmi bilan birga), narxlarni yangilash, stop-list (mavjud emas) qilish.
  - Foydalanuvchilar statistikasi: qachon qo'shilgan, jami nechta xarid qilgan, telefon raqami.
  - Jami tushum va yangi buyurtmalar nazorati.

---

## Xavfsizlik (2026-09 fixlar)

- Admin API (`products/users/orders/settings/couriers`) `Bearer session token` bilan himoyalangan. Login: `POST /api/admin/login`.
- `GET /api/settings` endi `admin_password` qaytarmaydi. Parol DB'da `bcrypt` hash'da saqlanadi (eski plaintext avtomatik migrate bo'ladi).
- `POST /api/orders` narxni DB'dan hisoblaydi — client yuborgan narxga ishonilmaydi. Mavjud bo'lmagan/to'xtatilgan taomga 400.
- Fayl yuklash: faqat `jpeg/png/webp`, max `5MB`. Eski rasmlar avtomatik o'chiriladi.
- `/uploads/*.js` (user backup) endi `403` — public'dan yopilgan.
- `CORS` whitelist (`CORS_ORIGINS`), `helmet`, `rate-limit` (global 300/15min, login 20/15min).
- Telegram `initData` imzo tekshiruvi (`x-telegram-init-data` header) — noto'g'ri imzo `403`.
- Kuryer invite bir martalik (`is_used` tekshiruvi), token `16 byte`.
- Frontend'da API manzillar `VITE_API_URL` env'dan olinadi, `?courier_tg=` backdoor olib tashlangan.
