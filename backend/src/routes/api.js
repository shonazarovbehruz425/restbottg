const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOrderToChannel, backupUsersToChannel, restoreUsersFromChannel, getBot } = require('../bot');
const requireAdmin = require('../middleware/requireAdmin');
const { verifyTelegram } = require('../middleware/verifyTelegram');

let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  console.warn('bcryptjs topilmadi, parol tekshiruvi plaintext fallback bilan ishlaydi.');
}

const ORDER_STATUSES = ['pending', 'accepted', 'on_the_way', 'ready', 'completed', 'cancelled'];
const ORDER_TYPES = ['delivery', 'pickup'];
const PAYMENT_METHODS = ['cash', 'card', 'click', 'payme'];

// Rasm yuklash sozlamalari
// Render Disk ishlatilsa UPLOADS_DIR env orqali beriladi.
const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      const err = new Error('Faqat JPG/PNG/WebP rasmlarga ruxsat berilgan');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  }
});

// Multer xatolarini 400 JSON ga aylantiruvchi wrapper
function uploadSingleImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err && err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'Rasm hajmi 5MB dan oshmasligi kerak' });
      }
      return res.status(400).json({ success: false, error: err.message || 'Rasm yuklashda xatolik' });
    }
    next();
  });
}

// Orphan rasmlarni diskdan tozalash
function deleteOldImage(imageUrl) {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') return;
    if (!imageUrl.startsWith('/uploads/')) return;
    const filename = path.basename(imageUrl);
    if (!filename || filename.includes('..')) return;
    const fullPath = path.join(uploadDir, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (e) {
    console.error('Eski rasmni o\'chirishda xatolik:', e && e.message);
  }
}

// N+1 oldini olish: order_items ni bitta query bilan olib, memory'da group'lash
function attachItems(orders) {
  if (!orders || orders.length === 0) return [];
  const ids = [...new Set(orders.map((o) => o.id))];
  const placeholders = ids.map(() => '?').join(',');
  const allItems = db.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`).all(...ids);
  const grouped = new Map(ids.map((id) => [id, []]));
  for (const item of allItems) {
    if (grouped.has(item.order_id)) grouped.get(item.order_id).push(item);
  }
  return orders.map((order) => ({ ...order, items: grouped.get(order.id) || [] }));
}

// ==========================================
// KATEGORIYALAR API
// ==========================================
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('GET /categories error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/categories', requireAdmin, (req, res) => {
  try {
    const { name, icon, sort_order } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Kategoriya nomi majburiy' });
    }
    const stmt = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    const info = stmt.run(name, icon || '🍽', sort_order || 0);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('POST /categories error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// TAOMLAR (PRODUCTS) API
// ==========================================
router.get('/products', (req, res) => {
  try {
    const { category_id, search } = req.query;
    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const params = [];

    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.id DESC';
    const products = db.prepare(query).all(...params);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('GET /products error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/products', requireAdmin, uploadSingleImage, (req, res) => {
  try {
    const { category_id, name, description, price, is_available } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Taom nomi majburiy' });
    }
    const parsedPrice = parseFloat(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, error: 'Narx noto\'g\'ri' });
    }
    let image_url = req.body.image_url || '';

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const stmt = db.prepare(`
      INSERT INTO products (category_id, name, description, price, image_url, is_available)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      category_id ? parseInt(category_id) : null,
      name,
      description || '',
      parsedPrice,
      image_url,
      is_available !== undefined ? parseInt(is_available) : 1
    );

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('POST /products error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/products/:id', requireAdmin, uploadSingleImage, (req, res) => {
  try {
    const { id } = req.params;
    const old = db.prepare('SELECT image_url FROM products WHERE id = ?').get(id);
    if (!old) {
      return res.status(404).json({ success: false, error: 'Taom topilmadi' });
    }
    const { category_id, name, description, price, is_available } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    let query = `UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, is_available = ?`;
    const params = [
      category_id ? parseInt(category_id) : null,
      name,
      description,
      parseFloat(price),
      parseInt(is_available)
    ];

    if (image_url !== undefined) {
      query += `, image_url = ?`;
      params.push(image_url);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.prepare(query).run(...params);

    // Eski rasmni diskdan o'chirish (orphan tozalash)
    if (image_url !== undefined && old.image_url && old.image_url !== image_url) {
      deleteOldImage(old.image_url);
    }

    res.json({ success: true, message: 'Taom muvaffaqiyatli yangilandi' });
  } catch (err) {
    console.error('PUT /products/:id error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const old = db.prepare('SELECT image_url FROM products WHERE id = ?').get(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (old && old.image_url) {
      deleteOldImage(old.image_url);
    }
    res.json({ success: true, message: 'Taom o\'chirildi' });
  } catch (err) {
    console.error('DELETE /products/:id error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// BUYURTMALAR (ORDERS) API
// ==========================================
router.post('/orders', verifyTelegram, async (req, res) => {
  try {
    const {
      telegram_id,
      customer_name,
      customer_phone,
      order_type,
      address,
      latitude,
      longitude,
      payment_method,
      notes,
      items,
      status
    } = req.body || {};

    if (!items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, error: 'Savatcha bo\'sh' });
    }

    if (status !== undefined && status !== null && status !== '' && !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status noto\'g\'ri' });
    }
    const finalType = order_type || 'delivery';
    if (!ORDER_TYPES.includes(finalType)) {
      return res.status(400).json({ success: false, error: 'order_type noto\'g\'ri' });
    }
    const finalPayment = (payment_method === undefined || payment_method === null || payment_method === '')
      ? 'cash'
      : payment_method;
    if (!PAYMENT_METHODS.includes(finalPayment)) {
      return res.status(400).json({ success: false, error: 'payment_method noto\'g\'ri' });
    }

    // Foydalanuvchini topish yoki yaratish
    let userId = null;
    if (telegram_id) {
      let user = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegram_id);
      if (!user) {
        const info = db.prepare('INSERT INTO users (telegram_id, first_name, phone) VALUES (?, ?, ?)').run(telegram_id, customer_name, customer_phone);
        userId = info.lastInsertRowid;
        // Yangi foydalanuvchi qo'shildi -> kanalga bazani backup qilish
        backupUsersToChannel().catch(() => {});
      } else {
        userId = user.id;
        // Telefonini yangilash
        if (customer_phone) {
          db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(customer_phone, userId);
        }
      }
    }

    // Narxni serverda hisoblash: client yuborgan price/name ga ishonmaymiz
    const getProduct = db.prepare('SELECT id, name, price, is_available FROM products WHERE id = ?');
    let total_amount = 0;
    const validatedItems = [];
    for (const item of items) {
      const productId = item.product_id ?? item.id ?? item.productId;
      const quantity = parseInt(item.quantity, 10);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Buyurtma tarkibi noto\'g\'ri' });
      }
      const product = getProduct.get(productId);
      if (!product) {
        return res.status(400).json({ success: false, error: `Mahsulot topilmadi: ${productId}` });
      }
      if (Number(product.is_available) === 0) {
        return res.status(400).json({ success: false, error: `Mahsulot mavjud emas: ${product.name}` });
      }
      const dbPrice = Number(product.price);
      total_amount += dbPrice * quantity;
      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: dbPrice,
        quantity
      });
    }

    // Dostavka pulini qo'shish (agar delivery bo'lsa)
    if (finalType === 'delivery') {
      const feeSetting = db.prepare("SELECT value FROM settings WHERE key = 'delivery_fee'").get();
      const fee = feeSetting ? parseFloat(feeSetting.value) || 0 : 0;
      total_amount += fee;
    }

    const finalStatus = (status && ORDER_STATUSES.includes(status)) ? status : 'pending';

    const orderStmt = db.prepare(`
      INSERT INTO orders (
        user_id, total_amount, status, order_type, customer_name,
        customer_phone, address, latitude, longitude, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orderInfo = orderStmt.run(
      userId,
      total_amount,
      finalStatus,
      finalType,
      customer_name,
      customer_phone,
      address || '',
      latitude || null,
      longitude || null,
      finalPayment,
      notes || ''
    );

    const orderId = orderInfo.lastInsertRowid;

    // Taomlarni saqlash
    const itemStmt = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of validatedItems) {
      itemStmt.run(orderId, item.product_id, item.product_name, item.price, item.quantity);
    }

    // TELEGRAM KANALGA XABAR YUBORISH (OSHPAZ / ADMINLAR UCHUN)
    await sendOrderToChannel(orderId);

    res.json({
      success: true,
      order_id: orderId,
      total_amount,
      message: 'Buyurtma qabul qilindi!'
    });
  } catch (err) {
    console.error('POST /orders error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/orders', requireAdmin, (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: 'Status noto\'g\'ri' });
      }
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit));

    const orders = db.prepare(query).all(...params);
    const ordersWithItems = attachItems(orders);

    res.json({ success: true, data: ordersWithItems });
  } catch (err) {
    console.error('GET /orders error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/orders/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status noto\'g\'ri' });
    }
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'Status yangilandi' });
  } catch (err) {
    console.error('PUT /orders/:id/status error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/orders/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    res.json({ success: true, message: 'Buyurtma o\'chirildi' });
  } catch (err) {
    console.error('DELETE /orders/:id error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/orders/clear/all', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM orders').run();
    res.json({ success: true, message: 'Barcha buyurtmalar tozalandi' });
  } catch (err) {
    console.error('DELETE /orders/clear/all error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// FOYDALANUVCHILAR (USERS) STATISTIKASI API
// ==========================================
router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT
        u.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `).all();

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('GET /users error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Foydalanuvchi profili va o'z buyurtmalari (Mini App uchun)
router.get('/users/profile/:telegram_id', verifyTelegram, (req, res) => {
  try {
    const { telegram_id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(user.id);
    const ordersWithItems = attachItems(orders);

    res.json({
      success: true,
      data: {
        user,
        orders: ordersWithItems
      }
    });
  } catch (err) {
    console.error('GET /users/profile error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Telegram avatar proxysi: bot token client'ga sizmasligi uchun rasm shu yerda proxy qilib beriladi
// (redirect emas). initData'da photo_url bo'lmaganda ham Mini App ism rasmini ko'rsatadi.
router.get('/users/avatar/:telegram_id', verifyTelegram, async (req, res) => {
  try {
    const { telegram_id } = req.params;
    const bot = getBot();
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot ishlamayapti' });
    }
    const photos = await bot.telegram.getUserProfilePhotos(Number(telegram_id), 0, 1);
    if (!photos || photos.total === 0 || !photos.photos || !photos.photos.length || !photos.photos[0].length) {
      return res.status(404).json({ success: false, error: 'Avatar topilmadi' });
    }
    // Eng katta o'lchamdagi size (massivning oxirgi elementi — width eng kattasi)
    const sizes = photos.photos[0];
    const size = sizes[sizes.length - 1];
    const fileLink = await bot.telegram.getFileLink(size.file_id);
    // Express'ning res o'zgaruvchisini soyab qolmaslik uchun fetch javobi alohida nomlanadi
    const fileRes = await fetch(fileLink.href);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    res.setHeader('Content-Type', fileRes.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('GET /users/avatar error:', err && err.message);
    res.status(404).json({ success: false, error: 'Avatar yuklanmadi' });
  }
});

// ==========================================
// DASHBOARD VA SOZLAMALAR API
// ==========================================
router.get('/dashboard-stats', requireAdmin, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'").get().total;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;

    const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue,
        pendingOrders,
        recentOrders
      }
    });
  } catch (err) {
    console.error('GET /dashboard-stats error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Ochiq (parolsiz) sozlamalar: mijoz Mini App uchun. admin_* kalitlar hech qachon sizdirilmaydi.
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);

    // .env dagi qiymatlar bilan to'ldirish (agar bazada bo'lmasa yoki envda ko'rsatilgan bo'lsa)
    if (process.env.TELEGRAM_ORDERS_CHANNEL_ID) {
      settings.channel_id = process.env.TELEGRAM_ORDERS_CHANNEL_ID;
    }
    if (process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID) {
      settings.backup_channel_id = process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID;
    }

    // Parol sizishini oldini olish: admin kalitlarni javobdan olib tashlash
    delete settings.admin_username;
    delete settings.admin_password;

    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('GET /settings error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin kirish (Login va Parol tekshirish) + Sessiya yaratish
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(401).json({ success: false, error: 'Login yoki parol noto\'g\'ri!' });
    }
    const userRow = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get();
    const passRow = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get();

    const expectedUser = process.env.ADMIN_USERNAME || (userRow ? userRow.value : 'admin');
    const storedPass = process.env.ADMIN_PASSWORD || (passRow ? passRow.value : 'admin123');
    const passwordFromEnv = !!process.env.ADMIN_PASSWORD;

    let ok = false;
    if (username === expectedUser) {
      if (passwordFromEnv) {
        ok = password === storedPass;
      } else if (bcrypt) {
        try {
          ok = bcrypt.compareSync(password, storedPass);
        } catch (e) {
          console.error('bcrypt.compare error:', e && e.message);
          ok = false;
        }
        // Migratsiya: eski plaintext parol to'g'ri bo'lsa, hash'lab saqlash
        if (!ok && password === storedPass) {
          ok = true;
          try {
            const hashed = bcrypt.hashSync(password, 10);
            db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_password'").run(hashed);
          } catch (e) {
            console.error('Parolni hash\'lashda xatolik:', e && e.message);
          }
        }
      } else {
        ok = password === storedPass;
      }
    }

    if (ok) {
      // 7 kunlik xavfsiz sessiya yaratish
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      db.prepare(`
        INSERT INTO admin_sessions (session_token, username, ip_address, user_agent, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(sessionToken, username, ipAddress, userAgent, expiresAt);

      res.json({
        success: true,
        message: 'Kirish muvaffaqiyatli',
        session_token: sessionToken,
        expires_at: expiresAt,
        admin: { username }
      });
    } else {
      res.status(401).json({ success: false, error: 'Login yoki parol noto\'g\'ri!' });
    }
  } catch (err) {
    console.error('POST /admin/login error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin sessiyasini tekshirish (Sahifa yangilanganda yoki avtomatik kirishda)
router.get('/admin/verify-session', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] || req.query.token);

    if (!token) {
      return res.status(401).json({ success: false, valid: false, error: 'Sessiya tokeni topilmadi' });
    }

    const session = db.prepare(`
      SELECT * FROM admin_sessions
      WHERE session_token = ? AND expires_at > ?
    `).get(token, new Date().toISOString());

    if (!session) {
      return res.status(401).json({ success: false, valid: false, error: 'Sessiya yaroqsiz yoki muddati tugagan' });
    }

    res.json({
      success: true,
      valid: true,
      username: session.username,
      expires_at: session.expires_at
    });
  } catch (err) {
    console.error('GET /admin/verify-session error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin sessiyadan chiqish (Logout)
router.post('/admin/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] || req.body?.session_token);

    if (token) {
      db.prepare('DELETE FROM admin_sessions WHERE session_token = ?').run(token);
    }

    res.json({ success: true, message: 'Sessiya yakunlandi' });
  } catch (err) {
    console.error('POST /admin/logout error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/settings', requireAdmin, (req, res) => {
  try {
    const settings = req.body || {};
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(settings)) {
      if (key === 'admin_password') {
        if (value === undefined || value === null || String(value).trim() === '') continue;
        let toStore = String(value);
        if (bcrypt) {
          try {
            toStore = bcrypt.hashSync(String(value), 10);
          } catch (e) {
            console.error('Parolni hash\'lashda xatolik:', e && e.message);
          }
        }
        stmt.run(key, toStore);
        continue;
      }
      stmt.run(key, String(value));
    }

    // Agar kanal o'zgartirilgan bo'lsa, yangi kanalga darhol bazani yuborish
    if (settings.backup_channel_id || settings.channel_id) {
      backupUsersToChannel().catch(() => {});
    }

    res.json({ success: true, message: 'Sozlamalar saqlandi' });
  } catch (err) {
    console.error('POST /settings error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// To'liq bazani qo'lda kanalga jo'natish (Admin panel orqali, har doim force)
router.post('/backup-users', requireAdmin, async (req, res) => {
  try {
    const result = await backupUsersToChannel(null, true);
    if (result && result.success) {
      const c = result.counts;
      res.json({ success: true, message: `Baza backup kanalga yuborildi! Userlar: ${c.users}, Taomlar: ${c.products}, Buyurtmalar: ${c.orders}`, counts: c });
    } else {
      res.status(400).json({ success: false, error: 'Telegram Bot ishga tushmagan yoki kanal ID si kiritilmagan.' });
    }
  } catch (err) {
    console.error('POST /backup-users error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Kanaldan / fayldan bazani tiklash (Restore)
router.post('/restore-users', requireAdmin, async (req, res) => {
  try {
    const result = await restoreUsersFromChannel();
    if (result && result.success) {
      const c = result.counts;
      res.json({ success: true, message: `Baza tiklandi! Userlar: ${c.users}, Taomlar: ${c.products}, Buyurtmalar: ${c.orders}`, counts: c });
    } else {
      const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      res.json({ success: true, message: `Mahalliy backup topilmadi. Hozirda ${count} ta foydalanuvchi mavjud. Kanaldagi pinlangan .js faylni botga forward qiling.` });
    }
  } catch (err) {
    console.error('POST /restore-users error:', err && err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
