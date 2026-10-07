const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const { Pool, types } = require('pg');
const fs = require('fs');

types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    console.error('❌ Xatolik: .env faylida DATABASE_URL kiritilmagan!');
    console.error('Iltimos, Neon.tech dan olingan postgresql://... ulanish manzilini DATABASE_URL ga yozing.');
    process.exit(1);
  }

  console.log('🔌 Neon PostgreSQL ga ulanmoqda...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('✅ Ulandi! Jadvallar yaratilmoqda (schema.sql)...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Barcha jadvallar va indekslar muvaffaqiyatli yaratildi!');

    // SQLite yoki snapshot dan ma'lumotlarni o'qish
    let sqliteData = null;
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../db/restaurant.db');
    if (fs.existsSync(dbPath)) {
      try {
        const Database = require('better-sqlite3');
        const sqlite = new Database(dbPath);
        sqliteData = {
          categories: sqlite.prepare('SELECT * FROM categories').all(),
          products: sqlite.prepare('SELECT * FROM products').all(),
          settings: sqlite.prepare('SELECT * FROM settings').all(),
          users: sqlite.prepare('SELECT * FROM users').all(),
          couriers: sqlite.prepare('SELECT * FROM couriers').all(),
          courier_invites: sqlite.prepare('SELECT * FROM courier_invites').all(),
          orders: sqlite.prepare('SELECT * FROM orders').all(),
          order_items: sqlite.prepare('SELECT * FROM order_items').all(),
          user_warnings: sqlite.prepare('SELECT * FROM user_warnings').all()
        };
        console.log('📦 Mahalliy restaurant.db bazasidan ma\'lumotlar o\'qildi.');
      } catch (err) {
        console.warn('⚠️ SQLite restaurant.db ni o\'qishda xatolik:', err.message);
      }
    }

    if (!sqliteData) {
      const snapshotPath = path.join(__dirname, '../db/database_snapshot.json');
      if (fs.existsSync(snapshotPath)) {
        const raw = fs.readFileSync(snapshotPath, 'utf8');
        sqliteData = JSON.parse(raw);
        console.log('📦 database_snapshot.json dan ma\'lumotlar o\'qildi.');
      }
    }

    if (sqliteData) {
      console.log('🚀 Ma\'lumotlarni Neon PostgreSQL ga ko\'chirish boshlandi...');

      // 1. Categories
      if (Array.isArray(sqliteData.categories) && sqliteData.categories.length > 0) {
        for (const c of sqliteData.categories) {
          await client.query(`
            INSERT INTO categories (id, name, icon, sort_order)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order
          `, [c.id, c.name, c.icon || '🍔', c.sort_order || 0]);
        }
        await client.query("SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1))");
        console.log(`  📂 Kategoriyalar: ${sqliteData.categories.length} ta ko'chirildi`);
      }

      // 2. Settings
      if (Array.isArray(sqliteData.settings) && sqliteData.settings.length > 0) {
        for (const s of sqliteData.settings) {
          if (s.key) {
            await client.query(`
              INSERT INTO settings (key, value)
              VALUES ($1, $2)
              ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `, [s.key, s.value || '']);
          }
        }
        console.log(`  ⚙️ Sozlamalar: ${sqliteData.settings.length} ta ko'chirildi`);
      }

      // 3. Products
      if (Array.isArray(sqliteData.products) && sqliteData.products.length > 0) {
        for (const p of sqliteData.products) {
          await client.query(`
            INSERT INTO products (id, category_id, name, description, price, image_url, image_file_id, is_available, rating, prep_time, quality_badge, tag, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13::timestamp with time zone, CURRENT_TIMESTAMP))
            ON CONFLICT (id) DO UPDATE SET
              category_id = EXCLUDED.category_id,
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              price = EXCLUDED.price,
              image_url = EXCLUDED.image_url,
              image_file_id = EXCLUDED.image_file_id,
              is_available = EXCLUDED.is_available,
              rating = EXCLUDED.rating,
              prep_time = EXCLUDED.prep_time,
              quality_badge = EXCLUDED.quality_badge,
              tag = EXCLUDED.tag
          `, [
            p.id,
            p.category_id || null,
            p.name,
            p.description || '',
            Number(p.price) || 0,
            p.image_url || null,
            p.image_file_id || null,
            p.is_available !== undefined ? p.is_available : 1,
            p.rating || null,
            p.prep_time || null,
            p.quality_badge || null,
            p.tag || null,
            p.created_at || null
          ]);
        }
        await client.query("SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1))");
        console.log(`  🍔 Taomlar: ${sqliteData.products.length} ta ko'chirildi`);
      }

      // 4. Users
      if (Array.isArray(sqliteData.users) && sqliteData.users.length > 0) {
        for (const u of sqliteData.users) {
          if (u.telegram_id) {
            await client.query(`
              INSERT INTO users (id, telegram_id, first_name, last_name, username, phone, photo_url, is_blocked, warnings_count, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::timestamp with time zone, CURRENT_TIMESTAMP))
              ON CONFLICT (telegram_id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                username = EXCLUDED.username,
                phone = EXCLUDED.phone,
                photo_url = EXCLUDED.photo_url,
                is_blocked = EXCLUDED.is_blocked,
                warnings_count = EXCLUDED.warnings_count
            `, [
              u.id || null,
              u.telegram_id,
              u.first_name || '',
              u.last_name || '',
              u.username || '',
              u.phone || null,
              u.photo_url || null,
              u.is_blocked || 0,
              u.warnings_count || 0,
              u.created_at || null
            ]);
          }
        }
        await client.query("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))");
        console.log(`  👥 Foydalanuvchilar: ${sqliteData.users.length} ta ko'chirildi`);
      }

      // 5. Couriers
      if (Array.isArray(sqliteData.couriers) && sqliteData.couriers.length > 0) {
        for (const c of sqliteData.couriers) {
          if (c.telegram_id) {
            await client.query(`
              INSERT INTO couriers (id, telegram_id, first_name, last_name, username, phone, status, is_online, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamp with time zone, CURRENT_TIMESTAMP))
              ON CONFLICT (telegram_id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                username = EXCLUDED.username,
                phone = EXCLUDED.phone,
                status = EXCLUDED.status,
                is_online = EXCLUDED.is_online
            `, [
              c.id || null,
              c.telegram_id,
              c.first_name || '',
              c.last_name || '',
              c.username || '',
              c.phone || null,
              c.status || 'active',
              c.is_online || 1,
              c.created_at || null
            ]);
          }
        }
        await client.query("SELECT setval(pg_get_serial_sequence('couriers', 'id'), COALESCE((SELECT MAX(id) FROM couriers), 1))");
        console.log(`  🛵 Kuryerlar: ${sqliteData.couriers.length} ta ko'chirildi`);
      }

      // 6. Orders
      if (Array.isArray(sqliteData.orders) && sqliteData.orders.length > 0) {
        for (const o of sqliteData.orders) {
          await client.query(`
            INSERT INTO orders (id, user_id, telegram_id, total_amount, status, order_type, customer_name, customer_phone, address, latitude, longitude, payment_method, notes, channel_message_id, courier_id, cancelled_by, cancel_reason, location_source, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, COALESCE($19::timestamp with time zone, CURRENT_TIMESTAMP))
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              channel_message_id = EXCLUDED.channel_message_id,
              courier_id = EXCLUDED.courier_id
          `, [
            o.id,
            o.user_id || null,
            o.telegram_id || null,
            Number(o.total_amount) || 0,
            o.status || 'pending',
            o.order_type || 'delivery',
            o.customer_name || null,
            o.customer_phone || null,
            o.address || null,
            o.latitude ? Number(o.latitude) : null,
            o.longitude ? Number(o.longitude) : null,
            o.payment_method || 'cash',
            o.notes || null,
            o.channel_message_id ? Number(o.channel_message_id) : null,
            o.courier_id ? Number(o.courier_id) : null,
            o.cancelled_by || null,
            o.cancel_reason || null,
            o.location_source || 'manual',
            o.created_at || null
          ]);
        }
        await client.query("SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1))");
        console.log(`  📋 Buyurtmalar: ${sqliteData.orders.length} ta ko'chirildi`);
      }

      // 7. Order Items
      if (Array.isArray(sqliteData.order_items) && sqliteData.order_items.length > 0) {
        for (const it of sqliteData.order_items) {
          await client.query(`
            INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
          `, [
            it.id,
            it.order_id,
            it.product_id || null,
            it.product_name || '',
            Number(it.price) || 0,
            it.quantity || 1
          ]);
        }
        await client.query("SELECT setval(pg_get_serial_sequence('order_items', 'id'), COALESCE((SELECT MAX(id) FROM order_items), 1))");
        console.log(`  🍽️ Buyurtma tarkiblari: ${sqliteData.order_items.length} ta ko'chirildi`);
      }
    }

    console.log('\n🎉 TABRIKLAYMIZ! Neon PostgreSQL bazasi to\'liq tayyorlandi va ma\'lumotlar muvaffaqiyatli ko\'chirildi!');
  } catch (err) {
    console.error('❌ Migratsiya xatoligi:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
