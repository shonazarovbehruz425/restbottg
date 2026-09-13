# Restoran Telegram Mini App va Web Admin Panel Tizimi

Ushbu loyiha Yandex Eats va Uzum Tezkor formatida yaratilgan zamonaviy restoran tizimidir.

## Loyiha tarkibi:
1. **`backend/`** — Node.js / Express API server, SQLite ma'lumotlar bazasi va Telegram Bot logikasi (oshxona kanaliga zakaz tashlash).
2. **`mini-app/`** — Foydalanuvchilar (mijozlar) uchun Telegram Mini App (React + Tailwind CSS). Menyu, profil, savat va buyurtma rasmiylashtirish.
3. **`admin-panel/`** — Restoran egalari uchun Google Chrome orqali boshqariladigan Web Admin Panel (React + Tailwind CSS).

---

## Tezkor ishga tushirish (Windows)

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
