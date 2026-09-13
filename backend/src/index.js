require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const courierRoutes = require('./routes/courierRoutes');
const { initBot } = require('./bot');

let helmet = null;
try {
  helmet = require('helmet');
} catch (e) {
  console.warn('helmet topilmadi, xavfsizlik headerlarisiz davom etiladi.');
}

let rateLimit = null;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  console.warn('express-rate-limit topilmadi, rate limit siz davom etiladi.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Render proxy ortida ishlaydi — rate-limit to'g'ri IP olishi uchun
app.set('trust proxy', 1);

// Middleware lar
app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',').map((s) => s.trim()).filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (helmet) {
  // Rasmlar boshqa domenlardan (mini-app/admin-panel) yuklanishi uchun
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
}

if (rateLimit) {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
  app.use('/api/admin/login', loginLimiter);
}

// Backup .js fayllarni static orqali bermaslik (Express 5-safe: wildcard o'rniga middleware)
app.use('/uploads', (req, res, next) => {
  if (req.path.endsWith('.js')) {
    return res.status(403).end();
  }
  next();
});

// Rasmlar uchun statik papka (Render Disk bo'lsa UPLOADS_DIR)
const fs = require('fs');
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Asosiy API yo'nalishlari
app.use('/api', apiRoutes);
app.use('/api/couriers', courierRoutes);

// Server holati
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Telegram Botni ishga tushirish
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').trim();
initBot(BOT_TOKEN);

// Markaziy xato handleri: ichki xabarlarni client'ga sizdirmaydi
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Rasm hajmi 5MB dan oshmasligi kerak' });
  }
  if (err && (err.code === 'LIMIT_UNEXPECTED_FILE' || err.status === 400)) {
    return res.status(400).json({ error: err.message || 'Fayl yuklashda xatolik' });
  }
  res.status((err && err.status) || 500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Restoran Backend Server http://localhost:${PORT} da ishga tushdi!`);
  console.log(`📁 Taomlar rasmlari: http://localhost:${PORT}/uploads/`);
});
