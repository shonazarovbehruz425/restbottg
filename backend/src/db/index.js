const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Render Disk (persistent) ishlatilsa DB_PATH env orqali beriladi.
// Masalan: DB_PATH=/opt/render/project/src/backend/data/restaurant.db
const dbPath = process.env.DB_PATH || path.join(__dirname, 'restaurant.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

// Chet kalitlarni (Foreign keys) yoqish
db.pragma('foreign_keys = ON');

// Jadvallarni yaratish
db.exec(`
  -- Foydalanuvchilar (Telegram foydalanuvchilari)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Taom kategoriyalari (Fast Food, Ichimliklar, Milliy va h.k.)
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🍔',
    sort_order INTEGER DEFAULT 0
  );

  -- Taomlar (Mahsulotlar)
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Buyurtmalar
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, preparing, on_the_way, completed, cancelled
    order_type TEXT DEFAULT 'delivery', -- delivery, takeaway
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    payment_method TEXT DEFAULT 'cash', -- cash, card
    notes TEXT,
    channel_message_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Buyurtma tarkibi (Har bir buyurtmadagi taomlar)
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name TEXT,
    price REAL,
    quantity INTEGER
  );

  -- Admin sozlamalari (Masalan: kanal ID, restoran ish vaqti, dostavka narxi)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- Kuryerlar jadvali
  CREATE TABLE IF NOT EXISTS couriers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active', -- active, blocked
    is_online INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Kuryer taklif tokenlari (Admin panel orqali generatsiya qilinadi)
  CREATE TABLE IF NOT EXISTS courier_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Admin sessiyalari (Session tokenlar)
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  );
`);

// orders jadvaliga courier_id qo'shish (agar bo'lmasa)
try {
  db.prepare('ALTER TABLE orders ADD COLUMN courier_id INTEGER REFERENCES couriers(id)').run();
} catch (e) {
  // Column mavjud bo'lsa xatoni e'tiborsiz qoldiramiz
}

// users jadvaliga photo_url qo'shish (agar bo'lmasa)
try {
  db.prepare('ALTER TABLE users ADD COLUMN photo_url TEXT').run();
} catch (e) {
  // Column mavjud bo'lsa xatoni e'tiborsiz qoldiramiz
}

// orders jadvaliga telegram_id qo'shish (agar bo'lmasa)
try {
  db.prepare('ALTER TABLE orders ADD COLUMN telegram_id INTEGER').run();
} catch (e) {
  // Column mavjud bo'lsa xatoni e'tiborsiz qoldiramiz
}

// Barcha mavjud user_id yoki telegram_id bo'sh bo'lgan buyurtmalarni foydalanuvchilar profiliga avtomatik bog'lash
try {
  const allUsers = db.prepare('SELECT id, telegram_id, phone FROM users').all();
  for (const u of allUsers) {
    if (u.phone) {
      const cleanPhone = String(u.phone).replace(/\D/g, '');
      const last9 = cleanPhone.slice(-9);
      if (last9.length >= 7) {
        db.prepare(`
          UPDATE orders 
          SET user_id = ?, telegram_id = COALESCE(telegram_id, ?)
          WHERE (user_id IS NULL OR telegram_id IS NULL)
            AND REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '+', ''), '-', '') LIKE ?
        `).run(u.id, u.telegram_id, `%${last9}%`);
      }
    }
    if (u.telegram_id) {
      db.prepare(`
        UPDATE orders 
        SET user_id = ?
        WHERE telegram_id = ? AND user_id IS NULL
      `).run(u.id, u.telegram_id);
    }
  }

  // Agar bazada faqat 1 ta foydalanuvchi bo'lsa (barcha sinov zakazlarini o'z profiliga biriktirish)
  if (allUsers.length === 1) {
    const mainUser = allUsers[0];
    db.prepare(`
      UPDATE orders 
      SET user_id = ?, telegram_id = COALESCE(telegram_id, ?)
      WHERE user_id IS NULL
    `).run(mainUser.id, mainUser.telegram_id);
  }
} catch (e) {
  // e'tiborsiz qoldiramiz
}

// products jadvaliga image_file_id qo'shish (Telegram cloud saqlash uchun)
try {
  db.prepare('ALTER TABLE products ADD COLUMN image_file_id TEXT').run();
} catch (e) {
  // Column mavjud bo'lsa xatoni e'tiborsiz qoldiramiz
}

// products jadvaliga rating, prep_time, quality_badge, tag qo'shish (ixtiyoriy nishonlar)
try {
  db.prepare('ALTER TABLE products ADD COLUMN rating TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE products ADD COLUMN prep_time TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE products ADD COLUMN quality_badge TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE products ADD COLUMN tag TEXT').run();
} catch (e) {}

// users jadvaliga is_blocked va warnings_count qo'shish (agar bo'lmasa)
try {
  db.prepare('ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE users ADD COLUMN warnings_count INTEGER DEFAULT 0').run();
} catch (e) {}

// user_warnings jadvali (berilgan tanbehlar tarixi)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    telegram_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    admin_username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Dastlabki default kategoriyalar va sozlamalarni kiritish agar bo'sh bo'lsa
const countCat = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (countCat.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
  const defaultCats = [
    ['🍔 Burgerlar', '🍔', 1],
    ['🌯 Lavashlar', '🌯', 2],
    ['🌭 Hot-doglar', '🌭', 3],
    ['🍕 Pitsalar', '🍕', 4],
    ['🍟 Gazaklar & Fri', '🍟', 5],
    ['🥤 Ichimliklar', '🥤', 6]
  ];
  defaultCats.forEach(c => insertCat.run(c[0], c[1], c[2]));
}

// Boshlang'ich sozlamalar
const checkSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (checkSettings.count === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('restaurant_name', 'Samira Fast Food');
  insertSetting.run('phone', '+998 70 219 55 55');
  insertSetting.run('address', "Qashqadaryo viloyati, G'uzor tumani");
  insertSetting.run('description', 'ENG MAZALI FAST FOOD: Burger, Lavash, Hotdog');
  insertSetting.run('delivery_fee', '0');
  insertSetting.run('channel_id', '');
  insertSetting.run('admin_username', 'admin');
  insertSetting.run('admin_password', 'admin123');
}

// admin_username sozlamasini mavjudligini tekshirib qo'shish
const checkAdminUser = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get();
if (!checkAdminUser) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_username', 'admin')").run();
}

// Baza bo'sh bo'lganda (masalan yangi o'rnatilganda) snapshot'dan faqat menyu, kategoriya va sozlamalarni yuklash
try {
  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get()?.c || 0;

  if (productCount === 0) {
    const snapshotPath = path.join(__dirname, 'database_snapshot.json');
    if (fs.existsSync(snapshotPath)) {
      const raw = fs.readFileSync(snapshotPath, 'utf8');
      const data = JSON.parse(raw);

      const asArray = (v) => (Array.isArray(v) ? v : []);
      const runTable = (rows, sql, mapFn) => {
        if (!Array.isArray(rows) || rows.length === 0) return 0;
        try {
          const stmt = db.prepare(sql);
          const tx = db.transaction((list) => {
            let n = 0;
            for (const r of list) {
              try {
                const args = mapFn(r);
                if (args) {
                  stmt.run(...args);
                  n++;
                }
              } catch (e) {}
            }
            return n;
          });
          return tx(rows);
        } catch (e) {
          return 0;
        }
      };

      if (data.users && data.users.length > 0) {
        runTable(asArray(data.users),
          `INSERT OR REPLACE INTO users (id, telegram_id, first_name, last_name, username, phone, photo_url, is_blocked, warnings_count, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
          (r) => (r && (r.telegram_id || r.id) ? [
            r.id || null,
            r.telegram_id || r.id,
            r.first_name || '',
            r.last_name || '',
            r.username || '',
            r.phone || null,
            r.photo_url || null,
            r.is_blocked ? 1 : 0,
            r.warnings_count || 0,
            r.created_at || null
          ] : null)
        );
      }

      if (data.categories && data.categories.length > 0) {
        runTable(asArray(data.categories),
          'INSERT OR REPLACE INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
          (r) => (r && r.name ? [r.id || null, r.name, r.icon || '🍔', r.sort_order || 0] : null)
        );
      }

      if (data.products && data.products.length > 0) {
        runTable(asArray(data.products),
          `INSERT OR REPLACE INTO products (id, category_id, name, description, price, image_url, image_file_id, is_available, rating, prep_time, quality_badge, tag, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
          (r) => (r && r.name ? [
            r.id || null,
            r.category_id || null,
            r.name,
            r.description || '',
            Number(r.price) || 0,
            r.image_url || null,
            r.image_file_id || null,
            r.is_available ?? 1,
            r.rating || null,
            r.prep_time || null,
            r.quality_badge || null,
            r.tag || null,
            r.created_at || null
          ] : null)
        );
      }

      if (data.settings && data.settings.length > 0) {
        runTable(asArray(data.settings),
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          (r) => (r && r.key ? [r.key, r.value ?? ''] : null)
        );
      }

      console.log(`🚀 [DB Init] Menyu va sozlamalar database_snapshot.json dan avtomatik yuklandi! (Taomlar: ${data.products?.length || 0})`);
    }
  }
} catch (err) {
  console.error('[DB Init] Snapshot yuklashda xatolik:', err.message);
}

module.exports = db;
