const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOrderToChannel, backupUsersToChannel, restoreUsersFromChannel } = require('../bot');

// Rasm yuklash sozlamalari
const uploadDir = path.join(__dirname, '../../uploads');
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
const upload = multer({ storage });

// ==========================================
// KATEGORIYALAR API
// ==========================================
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, icon, sort_order } = req.body;
    const stmt = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    const info = stmt.run(name, icon || '🍽', sort_order || 0);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', upload.single('image'), (req, res) => {
  try {
    const { category_id, name, description, price, is_available } = req.body;
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
      parseFloat(price),
      image_url,
      is_available !== undefined ? parseInt(is_available) : 1
    );

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
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
    res.json({ success: true, message: 'Taom muvaffaqiyatli yangilandi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, message: 'Taom o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// BUYURTMALAR (ORDERS) API
// ==========================================
router.post('/orders', async (req, res) => {
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
      items
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'Savatcha bo\'sh' });
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

    // Jami summani hisoblash
    let total_amount = 0;
    items.forEach(item => {
      total_amount += (item.price * item.quantity);
    });

    // Dostavka pulini qo'shish (agar delivery bo'lsa)
    if (order_type === 'delivery') {
      const feeSetting = db.prepare("SELECT value FROM settings WHERE key = 'delivery_fee'").get();
      const fee = feeSetting ? parseFloat(feeSetting.value) || 0 : 0;
      total_amount += fee;
    }

    const orderStmt = db.prepare(`
      INSERT INTO orders (
        user_id, total_amount, status, order_type, customer_name,
        customer_phone, address, latitude, longitude, payment_method, notes
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orderInfo = orderStmt.run(
      userId,
      total_amount,
      order_type || 'delivery',
      customer_name,
      customer_phone,
      address || '',
      latitude || null,
      longitude || null,
      payment_method || 'cash',
      notes || ''
    );

    const orderId = orderInfo.lastInsertRowid;

    // Taomlarni saqlash
    const itemStmt = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      itemStmt.run(orderId, item.id, item.name, item.price, item.quantity);
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
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/orders', (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit));

    const orders = db.prepare(query).all(...params);

    // Har bir buyurtma taomlarini biriktirish
    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    res.json({ success: true, data: ordersWithItems });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'Status yangilandi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    res.json({ success: true, message: 'Buyurtma o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/orders/clear/all', (req, res) => {
  try {
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM orders').run();
    res.json({ success: true, message: 'Barcha buyurtmalar tozalandi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// FOYDALANUVCHILAR (USERS) STATISTIKASI API
// ==========================================
router.get('/users', (req, res) => {
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Foydalanuvchi profili va o'z buyurtmalari (Mini App uchun)
router.get('/users/profile/:telegram_id', (req, res) => {
  try {
    const { telegram_id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(user.id);
    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    res.json({
      success: true,
      data: {
        user,
        orders: ordersWithItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// DASHBOARD VA SOZLAMALAR API
// ==========================================
router.get('/dashboard-stats', (req, res) => {
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
    res.status(500).json({ success: false, error: err.message });
  }
});

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
    if (process.env.ADMIN_USERNAME) {
      settings.admin_username = process.env.ADMIN_USERNAME;
    }
    if (!settings.admin_username) {
      settings.admin_username = 'admin';
    }
    if (process.env.ADMIN_PASSWORD) {
      settings.admin_password = process.env.ADMIN_PASSWORD;
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin kirish (Login va Parol tekshirish) + Sessiya yaratish
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const userRow = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get();
    const passRow = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get();

    const expectedUser = process.env.ADMIN_USERNAME || (userRow ? userRow.value : 'admin');
    const expectedPass = process.env.ADMIN_PASSWORD || (passRow ? passRow.value : 'admin123');

    if (username === expectedUser && password === expectedPass) {
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    const settings = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, String(value));
    }

    // Agar kanal o'zgartirilgan bo'lsa, yangi kanalga darhol bazani yuborish
    if (settings.backup_channel_id || settings.channel_id) {
      backupUsersToChannel().catch(() => {});
    }

    res.json({ success: true, message: 'Sozlamalar saqlandi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Foydalanuvchilar bazasini qo'lda kanalga jo'natish (Admin panel orqali)
router.post('/backup-users', async (req, res) => {
  try {
    const success = await backupUsersToChannel();
    if (success) {
      res.json({ success: true, message: 'Foydalanuvchilar bazasi (.js) kanalga muvaffaqiyatli yuborildi!' });
    } else {
      res.status(400).json({ success: false, error: 'Telegram Bot ishga tushmagan yoki kanal ID si kiritilmagan.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Kanaldan / fayldan foydalanuvchilar bazasini tiklash (Restore)
router.post('/restore-users', async (req, res) => {
  try {
    const success = await restoreUsersFromChannel();
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    res.json({ success: true, message: `Foydalanuvchilar bazasi tiklandi! Hozirda jami ${count} ta foydalanuvchi mavjud.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
