const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const db = require('../db');

let bot = null;

// Yangi backup fayl nomi + eski nom (backward compat)
const BACKUP_FILE = 'restaurant_backup.js';
const LEGACY_FILE = 'users_database_backup.js';

// Backup formati versiyasi
const BACKUP_VERSION = 2;

// Ketma-ket backup'lar orasidagi minimal pauza (spam bo'lmasligi uchun).
// force=true bo'lsa (admin /backup tugmasi, /backup buyrug'i) cheklov ishlamaydi.
const BACKUP_THROTTLE_MS = 15 * 60 * 1000;
let lastBackupAt = 0;
let lastBackupMessage = null; // { channelId, messageId } — eskisini unpin qilish uchun

function getUploadsDir() {
  return process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
}

// Bazadagi barcha jadvallarni bitta snapshot obyektga yig'ish
function collectSnapshot() {
  const safeAll = (sql) => {
    try {
      return db.prepare(sql).all();
    } catch (e) {
      return [];
    }
  };
  const users = safeAll('SELECT * FROM users ORDER BY id ASC');
  const categories = safeAll('SELECT * FROM categories ORDER BY id ASC');
  const products = safeAll('SELECT * FROM products ORDER BY id ASC');
  const settings = safeAll('SELECT * FROM settings ORDER BY key ASC');
  const couriers = safeAll('SELECT * FROM couriers ORDER BY id ASC');
  const courierInvites = safeAll('SELECT * FROM courier_invites ORDER BY id ASC');
  const orders = safeAll('SELECT * FROM orders ORDER BY id ASC');
  const orderItems = safeAll('SELECT * FROM order_items ORDER BY id ASC');

  return {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    counts: {
      users: users.length,
      categories: categories.length,
      products: products.length,
      settings: settings.length,
      couriers: couriers.length,
      courier_invites: courierInvites.length,
      orders: orders.length,
      order_items: orderItems.length
    },
    users,
    categories,
    products,
    settings,
    couriers,
    courier_invites: courierInvites,
    orders,
    order_items: orderItems
  };
}

// Snapshot'ni .js faylga yozish (kanalga yuborish + lokal nusxa uchun)
function writeSnapshotFile(snapshot) {
  const dir = getUploadsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const jsContent = `/**
 * RESTORAN TIZIMI — TO'LIQ BAZA BACKUP (v${BACKUP_VERSION})
 * Eksport qilingan vaqt: ${snapshot.exported_at}
 * Tarkib: users, categories, products, settings, couriers, courier_invites, orders, order_items
 * Tiklash: shu faylni botga forward qiling yoki admin panelda "Tiklash" tugmasini bosing.
 */

module.exports = ${JSON.stringify(snapshot, null, 2)};
`;
  const backupFilePath = path.join(dir, BACKUP_FILE);
  fs.writeFileSync(backupFilePath, jsContent, 'utf8');
  return backupFilePath;
}

function formatDateUz(date = new Date()) {
  try {
    return date.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
  } catch (e) {
    return date.toLocaleString();
  }
}

// Kanal ID sini avval .env dan, so'ng settings dan olish
function getBackupChannelId() {
  // 1. .env dagi maxsus backup kanal ID
  if (process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID && process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID.trim()) {
    return process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID.trim();
  }

  // 2. Bazadagi backup kanal sozlamasi
  try {
    const backupSetting = db.prepare("SELECT value FROM settings WHERE key = 'backup_channel_id'").get();
    if (backupSetting && backupSetting.value && backupSetting.value.trim()) {
      return backupSetting.value.trim();
    }
  } catch (e) { /* jadval hali yo'q bo'lishi mumkin */ }

  // 3. .env dagi asosiy buyurtmalar kanali ID si
  if (process.env.TELEGRAM_ORDERS_CHANNEL_ID && process.env.TELEGRAM_ORDERS_CHANNEL_ID.trim()) {
    return process.env.TELEGRAM_ORDERS_CHANNEL_ID.trim();
  }

  // 4. Bazadagi asosiy kanal sozlamasi
  try {
    const mainSetting = db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
    return (mainSetting && mainSetting.value) ? mainSetting.value.trim() : null;
  } catch (e) {
    return null;
  }
}

// To'liq bazani backup kanaliga tartibli (.js + pin) yuborish
// force=false bo'lsa 15 daqiqalik throttle ishlaydi (yangi user'dagi avto-chaqiruvlar uchun)
async function backupUsersToChannel(customChannelId = null, force = false) {
  if (!bot) return false;

  const targetChannelId = customChannelId || getBackupChannelId();
  if (!targetChannelId) {
    console.log('⚠️ Backup kanali belgilanmagan.');
    return false;
  }

  const now = Date.now();
  if (!force && now - lastBackupAt < BACKUP_THROTTLE_MS) {
    console.log('⏳ Backup throttle: oxirgi backup yaqinda yuborilgan, tashlab yuborildi.');
    return false;
  }

  try {
    const snapshot = collectSnapshot();
    const backupFilePath = writeSnapshotFile(snapshot);
    const c = snapshot.counts;

    const caption = `📦 *BAZA BACKUP* \`#backup\`\n\n` +
      `🕒 *Vaqt:* ${formatDateUz()}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👥 Userlar: *${c.users}* | 🍔 Taomlar: *${c.products}*\n` +
      `📂 Kategoriya: *${c.categories}* | 🛵 Kuryer: *${c.couriers}*\n` +
      `📋 Buyurtmalar: *${c.orders}* | ⚙️ Sozlamalar: *${c.settings}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `♻️ Tiklash: faylni botga forward qiling yoki admin panel → Tiklash`;

    const sent = await bot.telegram.sendDocument(targetChannelId, {
      source: backupFilePath,
      filename: BACKUP_FILE
    }, {
      caption,
      parse_mode: 'Markdown'
    });

    lastBackupAt = now;

    // Kanal tartibli turishi uchun: eski backup pin'ini olib, yangisini pin qilish
    try {
      if (lastBackupMessage && String(lastBackupMessage.channelId) === String(targetChannelId)) {
        await bot.telegram.unpinChatMessage(targetChannelId, lastBackupMessage.messageId).catch(() => {});
      }
      if (sent && sent.message_id) {
        await bot.telegram.pinChatMessage(targetChannelId, sent.message_id, { disable_notification: true }).catch(() => {});
        lastBackupMessage = { channelId: String(targetChannelId), messageId: sent.message_id };
      }
    } catch (e) {
      console.error('Backup pin qilishda xatolik:', e.message);
    }

    console.log(`✅ To'liq baza backup (${c.users} user, ${c.products} taom) ${targetChannelId} kanaliga yuborildi!`);
    return { success: true, counts: c };
  } catch (err) {
    console.error('Kanalga backup yuborishda xatolik:', err.message);
    return false;
  }
}

// Kanaldan .js faylni yuklab olib, bazani tiklash (Restore)
// Eslatma: Bot API kanal tarixini o'qiy olmaydi, shuning uchun:
//  1) avval mahalliy backup fayl (yangi nom, keyin eski nom) tekshiriladi;
//  2) topilmasa false qaytadi — admin oxirgi .js ni botga forward qilishi kerak.
async function restoreUsersFromChannel() {
  if (!bot) return false;
  const channelId = getBackupChannelId();
  if (!channelId) return false;

  console.log(`🔍 [Restore] Mahalliy backup fayl tekshirilmoqda (kanal: ${channelId})...`);

  const dir = getUploadsDir();
  const candidates = [path.join(dir, BACKUP_FILE), path.join(dir, LEGACY_FILE)];
  for (const localBackup of candidates) {
    if (!fs.existsSync(localBackup)) continue;
    try {
      delete require.cache[require.resolve(localBackup)];
      const backupData = require(localBackup);
      const counts = importBackupData(backupData);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total > 0) {
        console.log(`📥 [Restore] Mahalliy backup faylidan tiklandi: ${JSON.stringify(counts)}`);
        return { success: true, counts };
      }
    } catch (e) {
      console.error('Mahalliy backupdan tiklashda xatolik:', e.message);
    }
  }

  return false;
}

// Server yangi (bo'sh baza) ishga tushsa — backup kanaliga tiklash yo'riqnomasini yuborish
async function notifyIfDatabaseEmpty() {
  if (!bot) return false;
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (count > 0) return false; // Baza bo'sh emas — hech narsa qilmaymiz
    const channelId = getBackupChannelId();
    if (!channelId) return false;
    await bot.telegram.sendMessage(channelId,
      `⚠️ *Baza bo'sh — tiklash kerak*\n\n` +
      `Server yangi ishga tushdi va foydalanuvchilar bazasi topilmadi.\n\n` +
      `♻️ *Tiklash uchun:*\n` +
      `1. Kanaldagi 📌 pinlangan oxirgi \`restaurant_backup.js\` faylini botga *forward* qiling\n` +
      `2. Yoki admin panel → *Sozlamalar* → *Tiklash* tugmasini bosing`,
      { parse_mode: 'Markdown' }
    ).catch(() => {});
    console.log('⚠️ Baza bo\'shligi haqida kanalga xabar yuborildi.');
    return true;
  } catch (e) {
    console.error('notifyIfDatabaseEmpty xatolik:', e.message);
    return false;
  }
}

// Foydalanuvchilar massivini bazaga kiritish (Dublikatlarsiz tiklash, v1 format)
function importUsersArray(users) {
  if (!Array.isArray(users) || users.length === 0) return 0;

  const insertOrIgnore = db.prepare(`
    INSERT OR REPLACE INTO users (id, telegram_id, first_name, last_name, username, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
  `);

  const tx = db.transaction((userList) => {
    let count = 0;
    for (const u of userList) {
      if (u && u.telegram_id) {
        insertOrIgnore.run(
          u.id || null,
          u.telegram_id,
          u.first_name || '',
          u.last_name || '',
          u.username || '',
          u.phone || null,
          u.created_at || null
        );
        count++;
      }
    }
    return count;
  });

  const inserted = tx(users);
  console.log(`✅ [Restore] ${inserted} ta foydalanuvchi bazaga muvaffaqiyatli tiklandi!`);
  return inserted;
}

// Backup ma'lumotini import qilish — v1 (massiv) va v2 (to'liq obyekt) formatlarni qabul qiladi.
// Qaytaradi: { users, categories, products, settings, couriers, courier_invites, orders, order_items }
function importBackupData(data) {
  const empty = { users: 0, categories: 0, products: 0, settings: 0, couriers: 0, courier_invites: 0, orders: 0, order_items: 0 };
  if (!data) return empty;

  // v1: faqat userlar massivi
  if (Array.isArray(data)) {
    return { ...empty, users: importUsersArray(data) };
  }
  if (typeof data !== 'object') return empty;

  const counts = { ...empty };
  const asArray = (v) => (Array.isArray(v) ? v : []);

  if (Array.isArray(data.users)) {
    counts.users = importUsersArray(data.users);
  }

  const runTable = (rows, sql, mapFn) => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    let stmt;
    try {
      stmt = db.prepare(sql);
    } catch (e) {
      return 0;
    }
    const tx = db.transaction((list) => {
      let n = 0;
      for (const r of list) {
        try {
          const args = mapFn(r);
          if (!args) continue;
          stmt.run(...args);
          n++;
        } catch (e) { /* yaroqsiz qatorni tashlab yuboramiz */ }
      }
      return n;
    });
    try {
      return tx(rows);
    } catch (e) {
      return 0;
    }
  };

  counts.categories = runTable(asArray(data.categories),
    'INSERT OR REPLACE INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
    (r) => (r && r.name ? [r.id || null, r.name, r.icon || '🍔', r.sort_order || 0] : null));

  counts.products = runTable(asArray(data.products),
    'INSERT OR REPLACE INTO products (id, category_id, name, description, price, image_url, is_available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
    (r) => (r && r.name ? [r.id || null, r.category_id || null, r.name, r.description || '', Number(r.price) || 0, r.image_url || null, r.is_available ?? 1, r.created_at || null] : null));

  counts.settings = runTable(asArray(data.settings),
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    (r) => (r && r.key ? [r.key, r.value ?? ''] : null));

  counts.couriers = runTable(asArray(data.couriers),
    'INSERT OR REPLACE INTO couriers (id, telegram_id, first_name, last_name, username, phone, status, is_online, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
    (r) => (r && r.telegram_id ? [r.id || null, r.telegram_id, r.first_name || '', r.last_name || '', r.username || '', r.phone || null, r.status || 'active', r.is_online ?? 1, r.created_at || null] : null));

  counts.courier_invites = runTable(asArray(data.courier_invites),
    'INSERT OR REPLACE INTO courier_invites (id, token, is_used, used_by, created_at) VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
    (r) => (r && r.token ? [r.id || null, r.token, r.is_used || 0, r.used_by || null, r.created_at || null] : null));

  counts.orders = runTable(asArray(data.orders),
    'INSERT OR REPLACE INTO orders (id, user_id, total_amount, status, order_type, customer_name, customer_phone, address, latitude, longitude, payment_method, notes, channel_message_id, courier_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
    (r) => (r && r.id ? [r.id, r.user_id || null, Number(r.total_amount) || 0, r.status || 'pending', r.order_type || 'delivery', r.customer_name || null, r.customer_phone || null, r.address || null, r.latitude || null, r.longitude || null, r.payment_method || 'cash', r.notes || null, r.channel_message_id || null, r.courier_id || null, r.created_at || null] : null));

  counts.order_items = runTable(asArray(data.order_items),
    'INSERT OR REPLACE INTO order_items (id, order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
    (r) => (r && r.order_id ? [r.id || null, r.order_id, r.product_id || null, r.product_name || '', Number(r.price) || 0, Number(r.quantity) || 1] : null));

  console.log(`✅ [Restore] To'liq backup import qilindi: ${JSON.stringify(counts)}`);
  return counts;
}

module.exports = {
  backupUsersToChannel,
  restoreUsersFromChannel,
  notifyIfDatabaseEmpty,
  importUsersArray,
  importBackupData,
  collectSnapshot,
  getBackupChannelId,
  setBotInstance: (b) => { bot = b; }
};
