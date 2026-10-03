const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const courierRoutes = require('./routes/courierRoutes');
const { initBot, getBot } = require('./bot');
const db = require('./db');

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

// Taom rasmlarini Render qayta yuklanganda Telegram bulutidan avtomatik tiklash (Self-healing CDN)
app.get('/uploads/:filename', async (req, res, next) => {
  const filename = req.params.filename;
  if (!filename || filename.endsWith('.js') || filename.includes('..')) {
    return next();
  }
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    return next();
  }

  // Fayl diskda yo'q - bazadan shu rasmga tegishli image_file_id ni qidiramiz
  try {
    const product = db.prepare(`
      SELECT image_file_id FROM products 
      WHERE (image_url = ? OR image_url = ?) 
      AND image_file_id IS NOT NULL AND image_file_id != ''
      LIMIT 1
    `).get(`/uploads/${filename}`, filename);

    if (product && product.image_file_id) {
      const bot = getBot();
      if (bot) {
        const fileLink = await bot.telegram.getFileLink(product.image_file_id);
        const fetchRes = await fetch(fileLink.href);
        if (fetchRes.ok) {
          const buf = Buffer.from(await fetchRes.arrayBuffer());
          fs.writeFileSync(filePath, buf);
          console.log(`⚡ [Self-Heal] Rasm so'rov vaqtida Telegramdan tiklandi: ${filename}`);
          const ext = path.extname(filename).toLowerCase();
          const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          return res.send(buf);
        }
      }
    }
  } catch (err) {
    console.error(`[Uploads Self-Heal] Xatolik (${filename}):`, err && err.message);
  }

  next();
});

app.use('/uploads', express.static(uploadsDir));

// Asosiy API yo'nalishlari
app.use('/api', apiRoutes);
app.use('/api/couriers', courierRoutes);

// Server holati
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ---- Single-service rejim: frontend build'lar topilsa, shu serverdan serve qilish ----
// mini-app -> / , admin-panel -> ADMIN_PATH (default /admin)
const miniDist = path.join(__dirname, '../../mini-app/dist');
const adminDist = path.join(__dirname, '../../admin-panel/dist');
const miniIndex = path.join(miniDist, 'index.html');
const adminIndex = path.join(adminDist, 'index.html');
const hasMini = fs.existsSync(miniIndex);
const hasAdmin = fs.existsSync(adminIndex);

// .env orqali admin va kuryer link/yo'llarini sozlash
const rawAdminPath = (process.env.ADMIN_PATH || '/admin').trim().replace(/\/+$/, '') || '/admin';
const adminPath = rawAdminPath.startsWith('/') ? rawAdminPath : '/' + rawAdminPath;

const rawCourierPath = (process.env.COURIER_PATH || '/courier').trim().replace(/\/+$/, '') || '/courier';
const courierPath = rawCourierPath.startsWith('/') ? rawCourierPath : '/' + rawCourierPath;

if (hasAdmin) {
  // Trailing slash redirect: agar /admin deb kirilsa, nisbiy assetlar to'g'ri ishlashi uchun /admin/ ga yo'naltirish
  app.get(adminPath, (req, res, next) => {
    if (!req.originalUrl.endsWith('/')) {
      const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      return res.redirect(301, `${adminPath}/${q}`);
    }
    next();
  });

  // Admin panel statik fayllari
  app.use(adminPath, express.static(adminDist));
  app.use(`${adminPath}/assets`, express.static(path.join(adminDist, 'assets')));
}
if (hasMini) {
  app.use(express.static(miniDist));
}
// SPA fallback'lar (faqat GET; API/uploads/health ga tegmaydi; Express 5-safe)
if (hasAdmin) {
  app.use(adminPath, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/assets') || req.path.includes('.')) return next();
    res.sendFile(adminIndex);
  });
  // Agar boshqa ADMIN_PATH belgilangan bo'lsa va kimdir eski /admin ga kirsa, yangi manzilga yo'naltirish
  if (adminPath !== '/admin') {
    app.use('/admin', (req, res) => res.redirect(adminPath + '/'));
  }
}
if (hasMini) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health' || req.path.startsWith(adminPath)) return next();
    res.sendFile(miniIndex);
  });
}
if (hasMini || hasAdmin) {
  console.log(`🖥️ Frontend serve: mini-app ${hasMini ? 'ON (/)' : 'OFF'}, admin ${hasAdmin ? `ON (${adminPath})` : 'OFF'}, courier (${courierPath})`);
}

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
  console.log(`🔑 Admin Panel: http://localhost:${PORT}${adminPath}`);
  console.log(`🚴 Kuryer Paneli: http://localhost:${PORT}${courierPath}`);
  console.log(`📁 Taomlar rasmlari: http://localhost:${PORT}/uploads/`);
});
