# Lazzat Restoran - Topshirish va Ornatish Qo'llanmasi

Bu qo'llanma botni noldan ishga tushirish, token ulash, xostga joylash va stikerlarni yangilash bosqichlarini tushuntiradi.

---

## 1. Loyiha tuzilishi

```
Mini App Restraunt/
├── backend/            # Express API + Telegram bot (Telegraf) + SQLite baza
│   ├── src/bot/
│   │   ├── index.js           # Bot: /start, profil bloki, kontakt, buyurtmalar
│   │   ├── stickers.js        # Stiker yuborish (lokal fayl → CDN → matn zanjiri)
│   │   ├── stickerCatalog.js  # 1903 ta iOS stiker katalogi (9 kategoriya)
│   │   └── backupService.js   # Bazani Telegram kanalga zaxiralash
│   ├── assets/stickers/       # Lokal stiker PNG fayllari (21 ta asosiy)
│   ├── scripts/sync-stickers.js  # Stiker katalogini qayta generatsiya qilish
│   └── src/db/restaurant.db   # SQLite baza (users, orders, products...)
├── mini-app/           # Telegram Mini App (React 19 + Vite + Tailwind 4)
│   └── src/views/ProfileView.tsx  # "Mijoz profili" kartasi (ism, rasm, ID)
├── admin-panel/        # Web admin panel (/admin) - foydalanuvchilar ro'yxati
├── render.yaml         # Render.com Blueprint (bitta servisda hammasi)
└── start.bat           # Lokal ishga tushirish (Windows)
```

**Asosiy imkoniyatlar:**
- `/start` bosilganda bot iOS stiker-rasm yuboradi + foydalanuvchi **ismi**, **raqamli Telegram ID si** va **@username** ko'rsatilgan profil bloki chiqadi.
- Har bir `/start` foydalanuvchisi `users` jadvaliga yoziladi (UPSERT: ism/username yangilanadi, telefon va sana saqlanadi). Admin panelda ko'rinadi.
- Mini App ochilishi bilan **darhol to'liq ekran** (`requestFullscreen`, eskicha clientlarda `expand`).
- Mini App "Mijoz profili" kartasi: avatar rasm (Telegram `photo_url` → backend avatar proxysi → ikonka fallback), ism + yashil online nuqta, Telegram izohi, telefon, **bosilganda nusxalanadigan ID chip**.
- Bot xabarlarida oddiy emoji o'rniga **Apple Color Emoji (iOS) stiker-rasmlari** yuboriladi.

---

## 2. Bot tokenini ulash

1. Telegram'da **@BotFather** ni oching.
2. `/newbot` buyrug'ini yuboring, botga nom bering.
3. BotFather bergan tokenni nusxalang (format: `123456789:AAF...`).
4. `backend/.env` faylini oching va yozing:
   ```
   TELEGRAM_BOT_TOKEN=123456789:AAF........
   ```
5. Mini App manzilini belgilang (lokaldagi test uchun):
   ```
   TELEGRAM_MINI_APP_URL=https://<sizning-https-manzilingiz>
   ```
   DIQQAT: Telegram Mini App faqat **HTTPS** manzilni qabul qiladi. Lokal testda ngrok ishlating:
   ```
   ngrok http 5173
   ```
   va ngrok bergan `https://....ngrok-free.app` manzilini `TELEGRAM_MINI_APP_URL` ga yozing.
6. BotFather → `/mybots` → sizning botingiz → **Bot Settings → Menu Button** → Mini App manzilini kiriting (shunda chatdagi tugma Mini App'ni ochadi).

---

## 3. Lokal ishga tushirish (Windows)

```
# 1) Kutubxonalarni ornatish (bir marta)
npm install --prefix backend
npm install --include=dev --prefix mini-app
npm install --include=dev --prefix admin-panel

# 2) Barcha xizmatlarni ishga tushirish
start.bat
```

Xizmatlar manzillari:

| Xizmat | Manzil |
|---|---|
| Backend API + Bot | http://localhost:5000 |
| Mini App (mijoz) | http://localhost:5173 |
| Admin Panel | http://localhost:5174 (parol: `admin123`) |

Sinov:
1. Telegram'da o'z botingizga `/start` yuboring → stiker + ism/ID profil bloki keladi.
2. Mini App tugmasini bosing → ilova to'liq ekranda ochiladi, profil kartasida ism/rasm/ID ko'rinadi.
3. Admin panel → "Mijozlar" bo'limida yangi foydalanuvchi ro'yxati (ism, ID, sana) ko'rinadi.

---

## 4. Xostga joylash (Render.com - bitta servis)

Repo'da tayyor `render.yaml` Blueprint bor.

1. Loyihani GitHub'ga push qiling.
2. **render.com** → New → **Blueprint** → repo'ni tanlang.
3. Render deploy paytida secret'larni so'raydi, kiriting:
   - `TELEGRAM_BOT_TOKEN` - BotFather tokeni
   - `TELEGRAM_MINI_APP_URL` - deploy tugagach Render bergan URL (masalan `https://restoran-app.onrender.com`)
   - `CORS_ORIGINS` - shu URLning o'zi
   - `ADMIN_PASSWORD` - admin panel paroli
4. Deploy tugagach:
   - Bot avtomatik ishga tushadi (token bor bo'lsa).
   - BotFather'da Menu Button'ni `https://restoran-app.onrender.com` ga yonaltiring.
   - Mini App: `https://restoran-app.onrender.com/`, Admin: `/admin`.

**E'tibor bering (bepul plan):**
- SQLite fayl har deployda tozalanadi. Malumot saqlanishi uchun **Starter plan** + Disk ulang va env qoshing:
  - `DB_PATH=/opt/render/project/src/backend/data/restaurant.db`
  - `UPLOADS_DIR=/opt/render/project/src/backend/data/uploads`
- Zaxira sug'urtasi: botni biror kanalga **admin** qilib qoshsangiz, baza avtomatik kanalga backup qilinadi va yangi deployda tiklanadi (`/backup`, `/restore` buyruqlari admin uchun).

---

## 5. Stikerlarni yangilash (C:\IOS STIKERS)

Bot iOS stikerlarini `C:\IOS STIKERS\*.html` fayllaridagi katalogdan oladi (1903 ta Apple Color Emoji, 9 kategoriya).

**Yangi stikerlar qoshish / katalogni yangilash:**

1. `C:\IOS STIKERS\` papkasidagi HTML fayllarni yangilang (yoki yangi fayl qoshing) - ular ichida `const EMOJI_DATA = [ ... ]` massivi bolishi kerak.
2. Katalogni qayta generatsiya qiling:
   ```
   node backend/scripts/sync-stickers.js
   ```
   Skript: barcha HTML fayllardan `EMOJI_DATA` ni ajratadi, dedup qiladi, `backend/src/bot/stickerCatalog.js` ni yangilaydi (eskisini `.bak` ga zaxiralaydi).
3. Backend'ni qayta ishga tushiring.

**Stiker qanday yuboriladi:** bot kodida `replyWithSticker(ctx, '🍕', 'matn')` - lokal fayl (`backend/assets/stickers/<kod>.png`) bolsa shundan, bolmasa CDN'dan (`emoji-datasource-apple@16.0.0`), u ham xato bolsa oddiy matn yuboriladi. Shu sababli stikerlar hech qachon xabarni "yo'qotmaydi".

**Lokal stiker qoshish (tezlik uchun):** CDN'dan PNG yuklab `backend/assets/stickers/` papkasiga fayl kodining nomi bilan saqlang (masalan `1f355.png`) - bot avtomatik lokal fayldan beradi.

---

## 6. Malumotlar bazasi

- Jadval: `users` (`telegram_id` UNIQUE, `first_name`, `last_name`, `username`, `phone`, `created_at`).
- Har bir `/start` - UPSERT (qayta start qilsa ism yangilanadi, yozuv dubliq bolmaydi).
- Korish: **Admin Panel → Mijozlar** (ism, Telegram ID, telefon, qoshilgan sana, buyurtmalar soni) yoki:
  ```
  sqlite3 backend/src/db/restaurant.db "SELECT * FROM users;"
  ```

---

## 7. Tez yordam (Troubleshooting)

| Muammo | Yechim |
|---|---|
| Bot javob bermaydi | `backend/.env` dagi tokenni tekshiring; konsolda "Telegram Bot muvaffaqiyatli ishga tushdi" chiqishini kutib turing |
| Mini App ochilmaydi | `TELEGRAM_MINI_APP_URL` https bilan boshlanishini tekshiring; BotFather Menu Button sozlanganini tekshiring |
| Toliq ekran bolmaydi | Telegram'ni yangi versiyaga yangilang (eski clientlarda `expand` ishlaydi - ilova baribir ochiq boladi) |
| Avatar korinmaydi | Bot ishlayotganini tekshiring (avatar backend orqali proxy qilinadi); foydalanuvchi Telegram'da rasm qoygan bolishi kerak |
| Stiker yuborilmaydi | Internet/CDN'ni tekshiring - bot baribir matn yuboradi, xatolar konsolga tushadi |
| Admin panel paroli | `backend/.env` → `ADMIN_PASSWORD` yoki default `admin123` |