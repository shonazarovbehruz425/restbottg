const fs = require('fs');
const path = require('path');

const databaseUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PGDATABASE_URL || '').trim();
const isPostgres = Boolean(databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')));

let db = null;

if (isPostgres) {
  // ========================================================
  // POSTGRESQL (NEON.TECH) ENGINE
  // ========================================================
  console.log('🐘 [DB] Neon PostgreSQL rejimida ishlamoqda...');
  const { Pool, types } = require('pg');

  // BigInt (20) va Numeric (1700) ni JavaScript Number ga o'girish
  types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
  types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));

  const cleanDbUrl = databaseUrl.replace(/([?&])sslmode=require(&|$)/, '$1sslmode=verify-full$2');
  const pool = new Pool({
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (err) => {
    console.error('❌ [DB] PostgreSQL pool xatoligi:', err.message);
  });

  function toPgSql(sql) {
    let i = 1;
    let converted = sql.replace(/\?/g, () => `$${i++}`);

    // SQLite maxsus sintaksislarini PostgreSQL ga o'girish
    if (/INSERT\s+OR\s+REPLACE\s+INTO\s+settings/i.test(converted)) {
      converted = converted.replace(/INSERT\s+OR\s+REPLACE\s+INTO\s+settings/i, 'INSERT INTO settings');
      converted += ' ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value';
    } else if (/INSERT\s+OR\s+IGNORE\s+INTO\s+settings/i.test(converted)) {
      converted = converted.replace(/INSERT\s+OR\s+IGNORE\s+INTO\s+settings/i, 'INSERT INTO settings');
      converted += ' ON CONFLICT (key) DO NOTHING';
    } else if (/INSERT\s+OR\s+REPLACE\s+INTO\s+categories/i.test(converted)) {
      converted = converted.replace(/INSERT\s+OR\s+REPLACE\s+INTO\s+categories/i, 'INSERT INTO categories');
      converted += ' ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order';
    } else if (/INSERT\s+OR\s+REPLACE\s+INTO\s+users/i.test(converted)) {
      converted = converted.replace(/INSERT\s+OR\s+REPLACE\s+INTO\s+users/i, 'INSERT INTO users');
      converted += ' ON CONFLICT (telegram_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, username = EXCLUDED.username, phone = EXCLUDED.phone';
    } else if (/INSERT\s+OR\s+REPLACE\s+INTO\s+products/i.test(converted)) {
      converted = converted.replace(/INSERT\s+OR\s+REPLACE\s+INTO\s+products/i, 'INSERT INTO products');
      converted += ' ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, is_available = EXCLUDED.is_available';
    } else if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(converted)) {
      converted = converted.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
      if (!/ON\s+CONFLICT/i.test(converted)) {
        converted += ' ON CONFLICT DO NOTHING';
      }
    }

    // Double quotes to single quotes for string literals like REPLACE(p.name, "\'", "")
    converted = converted.replace(/"\\'"/g, "''''").replace(/"‘"/g, "'‘'").replace(/"’"/g, "'’'");

    // Case-insensitive search
    converted = converted.replace(/\bLIKE\b/g, 'ILIKE');

    // INSERT lar uchun lastInsertRowid ni olish maqsadida RETURNING id qo'shish
    if (/^\s*INSERT\s+INTO/i.test(converted) && !/RETURNING/i.test(converted)) {
      if (/INSERT\s+INTO\s+settings/i.test(converted)) {
        converted += ' RETURNING key';
      } else {
        converted += ' RETURNING id';
      }
    }

    return converted;
  }

  // Jadvallarni ishga tushirish (self-init)
  (async () => {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✅ [DB] Neon PostgreSQL jadvallari tekshirildi va tayyor.');
      }
    } catch (e) {
      console.error('⚠️ [DB] Neon PostgreSQL schema init xatoligi:', e.message);
    }
  })();

  db = {
    isPostgres: true,
    pool,
    async query(sql, params = []) {
      const pgSql = toPgSql(sql);
      const res = await pool.query(pgSql, params);
      return res;
    },
    async exec(sql) {
      return pool.query(sql);
    },
    prepare(sql) {
      const pgSql = toPgSql(sql);
      return {
        async get(...args) {
          const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          const res = await pool.query(pgSql, params);
          return res.rows[0] || null;
        },
        async all(...args) {
          const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          const res = await pool.query(pgSql, params);
          return res.rows;
        },
        async run(...args) {
          const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          const res = await pool.query(pgSql, params);
          const firstRow = res.rows && res.rows[0];
          return {
            lastInsertRowid: firstRow && firstRow.id ? firstRow.id : null,
            changes: res.rowCount || 0
          };
        }
      };
    },
    async transaction(callback) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
  };
} else {
  // ========================================================
  // SQLITE (FALLBACK / LOCAL DEV) ENGINE
  // ========================================================
  console.log('📁 [DB] SQLite (restaurant.db) rejimida ishlamoqda...');
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'restaurant.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');

  // Jadvallarni yaratish
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      phone TEXT,
      photo_url TEXT,
      is_blocked INTEGER DEFAULT 0,
      warnings_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🍔',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      image_file_id TEXT,
      is_available INTEGER DEFAULT 1,
      rating TEXT,
      prep_time TEXT,
      quality_badge TEXT,
      tag TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS couriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      is_online INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courier_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      is_used INTEGER DEFAULT 0,
      used_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      telegram_id INTEGER,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      order_type TEXT DEFAULT 'delivery',
      customer_name TEXT,
      customer_phone TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      channel_message_id INTEGER,
      courier_id INTEGER REFERENCES couriers(id),
      cancelled_by TEXT,
      cancel_reason TEXT,
      location_source TEXT DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT,
      price REAL,
      quantity INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS user_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      telegram_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      admin_username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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

  // Default kategoriyalar
  const allStandardCats = [
    [1, '🍔 Burgerlar', '🍔', 1],
    [2, '🌯 Lavashlar', '🌯', 2],
    [3, '🌭 Hot-doglar', '🌭', 3],
    [4, '🍕 Pitsalar', '🍕', 4],
    [5, '🍟 Gazaklar & Fri', '🍟', 5],
    [6, '🥤 Ichimliklar', '🥤', 6],
    [7, '🍰 Desertlar', '🍰', 7],
    [8, '🥗 Salatlar', '🥗', 8],
    [9, '🍗 Tovuq & Strips', '🍗', 9],
    [10, '🥪 Sendvichlar', '🥪', 10],
    [11, '🍱 Kombo & Setlar', '🍱', 11],
    [12, '🥫 Souslar', '🥫', 12],
    [13, '☕ Qahva & Choy', '☕', 13]
  ];

  for (const [catId, catName, catIcon, catSort] of allStandardCats) {
    try {
      const existing = sqlite.prepare('SELECT id FROM categories WHERE id = ? OR name = ?').get(catId, catName);
      if (!existing) {
        sqlite.prepare('INSERT OR REPLACE INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)').run(catId, catName, catIcon, catSort);
      }
    } catch (e) {}
  }

  // Standart sozlamalar
  const checkSettings = sqlite.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (checkSettings.count === 0) {
    const insertSetting = sqlite.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('restaurant_name', 'Samira Fast Food');
    insertSetting.run('phone', '+998 70 219 55 55');
    insertSetting.run('address', "Qashqadaryo viloyati, G'uzor tumani");
    insertSetting.run('description', 'ENG MAZALI FAST FOOD: Burger, Lavash, Hotdog');
    insertSetting.run('delivery_fee', '0');
    insertSetting.run('channel_id', '');
    insertSetting.run('admin_username', 'admin');
    insertSetting.run('admin_password', 'admin123');
  }

  // Unified wrapper: SQLite ham async Promise qaytaradi
  db = {
    isPostgres: false,
    sqlite,
    async query(sql, params = []) {
      return sqlite.prepare(sql).all(...params);
    },
    async exec(sql) {
      return sqlite.exec(sql);
    },
    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      return {
        async get(...args) {
          const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          return stmt.get(...params) || null;
        },
        async all(...args) {
          const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          return stmt.all(...params);
        },
        async run(...args) {
          const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          const info = stmt.run(...params);
          return {
            lastInsertRowid: info.lastInsertRowid,
            changes: info.changes
          };
        }
      };
    },
    async transaction(callback) {
      const tx = sqlite.transaction(callback);
      return tx();
    }
  };
}

module.exports = db;
