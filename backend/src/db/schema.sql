-- ========================================================
-- SAMIRA FAST FOOD — POSTGRESQL (NEON.TECH) SCHEMA
-- ========================================================

-- 1. Foydalanuvchilar (Telegram foydalanuvchilari)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  phone TEXT,
  photo_url TEXT,
  is_blocked INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Taom kategoriyalari
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍔',
  sort_order INTEGER DEFAULT 0
);

-- 3. Taomlar (Mahsulotlar)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  image_file_id TEXT,
  is_available INTEGER DEFAULT 1,
  rating TEXT,
  prep_time TEXT,
  quality_badge TEXT,
  tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Kuryerlar jadvali
CREATE TABLE IF NOT EXISTS couriers (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  is_online INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Kuryer taklif tokenlari
CREATE TABLE IF NOT EXISTS courier_invites (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  is_used INTEGER DEFAULT 0,
  used_by BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Buyurtmalar
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  telegram_id BIGINT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  order_type TEXT DEFAULT 'delivery',
  customer_name TEXT,
  customer_phone TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  channel_message_id BIGINT,
  courier_id INTEGER REFERENCES couriers(id),
  cancelled_by TEXT,
  cancel_reason TEXT,
  location_source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Buyurtma tarkibi
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name TEXT,
  price NUMERIC,
  quantity INTEGER
);

-- 8. Admin sozlamalari
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 9. Foydalanuvchilarga tanbehlar tarixi
CREATE TABLE IF NOT EXISTS user_warnings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  admin_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Admin sessiyalari
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indekslar (Tezkor qidiruv va filtrlash uchun)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
