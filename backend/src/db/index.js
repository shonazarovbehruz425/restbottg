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

// Dastlabki default kategoriyalar va sozlamalarni kiritish agar bo'sh bo'lsa
const countCat = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (countCat.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
  const defaultCats = [
    ['🍔 Fast Food', '🍔', 1],
    ['🍕 Pitsa & Piroglar', '🍕', 2],
    ['🍲 Milliy Taomlar', '🍲', 3],
    ['🥗 Salatlar', '🥗', 4],
    ['🥤 Ichimliklar', '🥤', 5],
    ['🍰 Desertlar', '🍰', 6]
  ];
  defaultCats.forEach(c => insertCat.run(c[0], c[1], c[2]));

  // Demo taomlar olib tashlandi, taomlar admin panel orqali qo'shiladi
}

// Boshlang'ich sozlamalar
const checkSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (checkSettings.count === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('restaurant_name', 'Lazzat Restoran');
  insertSetting.run('delivery_fee', '15000');
  insertSetting.run('channel_id', ''); // Foydalanuvchi keyin kiritadi yoki admin paneldan sozlaydi
  insertSetting.run('admin_username', 'admin'); // Web admin logini
  insertSetting.run('admin_password', 'admin123'); // Web admin parol
}

// admin_username sozlamasini mavjudligini tekshirib qo'shish
const checkAdminUser = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get();
if (!checkAdminUser) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_username', 'admin')").run();
}

module.exports = db;
