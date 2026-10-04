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

// Ketma-ket backup'lar orasidagi minimal pauza (spam bo'lmasligi uchun: 30 soniya).
// force=true bo'lsa (admin /backup tugmasi, /backup buyrug'i) cheklov ishlamaydi.
const BACKUP_THROTTLE_MS = 30 * 1000;
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

  // Doimiy snapshot json faylini ham yangilab boramiz (Git repo va sinxron start uchun katalog urug'i)
  try {
    const dbSnapshotPath = path.join(__dirname, '../db/database_snapshot.json');
    const catalogSeed = {
      ...snapshot,
      orders: [],
      order_items: [],
      counts: {
        ...snapshot.counts,
        orders: 0,
        order_items: 0
      }
    };
    fs.writeFileSync(dbSnapshotPath, JSON.stringify(catalogSeed, null, 2), 'utf8');
  } catch (e) {
    console.error('db/database_snapshot.json yozishda xato:', e.message);
  }

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

    if (sent && sent.document && sent.document.file_id) {
      try {
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup_file_id', ?)").run(sent.document.file_id);
      } catch (e) {}
    }

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

    console.log(`✅ To'liq baza backup (${c.users} user, ${c.products} taom, ${c.orders} buyurtma) ${targetChannelId} kanaliga yuborildi!`);
    return { success: true, counts: c };
  } catch (err) {
    console.error('Kanalga backup yuborishda xatolik:', err.message);
    return false;
  }
}

// Kanaldan .js/.json faylni yuklab olib, bazani tiklash (Restore)
// force = false bo'lsa (server ishga tushgandagi avtomatik tiklash):
// Agar bazada allaqachon buyurtmalar va mahsulotlar bo'lsa, qayta yozib yubormaslik uchun o'tkazib yuboriladi.
// Lekin buyurtmalar 0 bo'lsa (yangi deploy qilinganda), albatta tiklaydi!
async function restoreUsersFromChannel(force = false) {
  console.log('🔍 [Restore] Backupdan tiklash tekshiruvi boshlandi...');

  // 1. Mahalliy runtime backup fayli mavjud bo'lsa darhol tiklaymiz (botga bog'liq emas)
  const dir = getUploadsDir();
  const backupFile = path.join(dir, BACKUP_FILE);
  if (fs.existsSync(backupFile)) {
    try {
      delete require.cache[require.resolve(backupFile)];
      const backupData = require(backupFile);
      const counts = importBackupData(backupData);
      console.log(`📥 [Restore] Mahalliy backup faylidan tiklandi: ${JSON.stringify(counts)}`);
      restoreMissingProductImages().catch(() => {});
      return { success: true, counts };
    } catch (e) {
      console.error('Mahalliy backupdan tiklashda xatolik:', e.message);
    }
  }

  // 2. Mahalliy fayl bo'lmasa (masalan, Render da yangi deploy / yangilanish qilinganda):
  // Telegram kanaldagi PIN qilingan oxirgi xabardan yoki saqlangan file_id dan backup faylini yuklab olamiz!
  if (!bot) {
    console.log('ℹ️ [Restore] Bot instansiyasi yo\'q, kanaldan yuklab bo\'lmadi.');
    return false;
  }
  const channelId = getBackupChannelId();
  if (!channelId) {
    console.log('⚠️ [Restore] Backup kanali ID si topilmadi.');
    return false;
  }
  try {
    console.log(`🌐 [Restore] Kanaldagi (${channelId}) backup fayli qidirilmoqda...`);
    let fileIdToDownload = null;

    try {
      const chat = await bot.telegram.getChat(channelId);
      const pinned = chat?.pinned_message;
      if (pinned && pinned.document) {
        fileIdToDownload = pinned.document.file_id;
      }
    } catch (chatErr) {
      console.warn('Chat ma\'lumotini olishda ogohlantirish:', chatErr.message);
    }

    if (!fileIdToDownload) {
      try {
        const row = db.prepare("SELECT value FROM settings WHERE key = 'last_backup_file_id'").get();
        if (row && row.value) {
          fileIdToDownload = row.value;
        }
      } catch (e) {}
    }

    if (fileIdToDownload) {
      console.log(`📥 [Restore] Kanaldan backup fayli yuklab olinmoqda (id: ${fileIdToDownload})`);
      const fileLink = await bot.telegram.getFileLink(fileIdToDownload);
      const res = await fetch(fileLink.href);
      const fileText = (await res.text()).trim();

      let backupData = null;
      if (fileText.startsWith('{')) {
        backupData = JSON.parse(fileText);
      } else {
        const match = fileText.match(/module\.exports\s*=\s*([\s\S]*?);\s*$/);
        if (match && match[1]) {
          backupData = JSON.parse(match[1]);
        }
      }

      if (backupData) {
        const counts = importBackupData(backupData);
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (total > 0) {
          console.log(`🎉 [Restore] Kanaldan backup to'liq tiklandi: ${JSON.stringify(counts)}`);
          try {
            writeSnapshotFile(backupData);
          } catch {}
          restoreMissingProductImages().catch(() => {});
          return { success: true, counts };
        }
      }
    } else {
      console.log('ℹ️ [Restore] Kanaldagi pinlangan xabarda backup fayli topilmadi.');
    }
  } catch (err) {
    console.error('Telegram kanaldan backupni yuklashda xatolik:', err.message);
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
    INSERT OR REPLACE INTO users (id, telegram_id, first_name, last_name, username, phone, photo_url, is_blocked, warnings_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
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
          u.photo_url || null,
          u.is_blocked ? 1 : 0,
          u.warnings_count || 0,
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

  // O'chirilgan toifalarni bazadan tozalash (sinxronga moslash)
  if (Array.isArray(data.categories) && data.categories.length > 0) {
    const backupCatIds = data.categories.map((c) => c && c.id).filter(Boolean);
    if (backupCatIds.length > 0) {
      try {
        const placeholders = backupCatIds.map(() => '?').join(',');
        db.prepare(`UPDATE products SET category_id = NULL WHERE category_id NOT IN (${placeholders})`).run(...backupCatIds);
        db.prepare(`DELETE FROM categories WHERE id NOT IN (${placeholders})`).run(...backupCatIds);
      } catch (e) {}
    }
  }

  counts.categories = runTable(asArray(data.categories),
    'INSERT OR REPLACE INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
    (r) => (r && r.name ? [r.id || null, r.name, r.icon || '🍔', r.sort_order || 0] : null));

  // O'chirilgan taomlarni bazadan tozalash (sinxronga moslash)
  if (Array.isArray(data.products) && data.products.length > 0) {
    const backupProdIds = data.products.map((p) => p && p.id).filter(Boolean);
    if (backupProdIds.length > 0) {
      try {
        const placeholders = backupProdIds.map(() => '?').join(',');
        db.prepare(`UPDATE order_items SET product_id = NULL WHERE product_id NOT IN (${placeholders})`).run(...backupProdIds);
        db.prepare(`DELETE FROM products WHERE id NOT IN (${placeholders})`).run(...backupProdIds);
      } catch (e) {}
    }
  }

  counts.products = runTable(asArray(data.products),
    'INSERT OR REPLACE INTO products (id, category_id, name, description, price, image_url, image_file_id, is_available, rating, prep_time, quality_badge, tag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
    (r) => (r && r.name ? [r.id || null, r.category_id || null, r.name, r.description || '', Number(r.price) || 0, r.image_url || null, r.image_file_id || null, r.is_available ?? 1, r.rating || null, r.prep_time || null, r.quality_badge || null, r.tag || null, r.created_at || null] : null));

  // O'chirilgan buyurtmalarni bazadan tozalash (sinxronga moslash)
  if (Array.isArray(data.orders)) {
    try {
      if (data.orders.length === 0) {
        db.prepare('DELETE FROM order_items').run();
        db.prepare('DELETE FROM orders').run();
      } else {
        const backupOrderIds = data.orders.map((o) => o && o.id).filter(Boolean);
        if (backupOrderIds.length > 0) {
          const placeholders = backupOrderIds.map(() => '?').join(',');
          db.prepare(`DELETE FROM order_items WHERE order_id NOT IN (${placeholders})`).run(...backupOrderIds);
          db.prepare(`DELETE FROM orders WHERE id NOT IN (${placeholders})`).run(...backupOrderIds);
        }
      }
    } catch (e) {}
  }

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
    'INSERT OR REPLACE INTO orders (id, user_id, telegram_id, total_amount, status, order_type, customer_name, customer_phone, address, latitude, longitude, payment_method, notes, channel_message_id, courier_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
    (r) => (r && r.id ? [r.id, r.user_id || null, r.telegram_id || null, Number(r.total_amount) || 0, r.status || 'pending', r.order_type || 'delivery', r.customer_name || null, r.customer_phone || null, r.address || null, r.latitude || null, r.longitude || null, r.payment_method || 'cash', r.notes || null, r.channel_message_id || null, r.courier_id || null, r.created_at || null] : null));

  counts.order_items = runTable(asArray(data.order_items),
    'INSERT OR REPLACE INTO order_items (id, order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
    (r) => (r && r.order_id ? [r.id || null, r.order_id, r.product_id || null, r.product_name || '', Number(r.price) || 0, Number(r.quantity) || 1] : null));

  // Tiklangan buyurtmalarni foydalanuvchilar profiliga avtomatik biriktirish
  try {
    const allUsers = db.prepare('SELECT id, telegram_id, phone FROM users').all();
    for (const u of allUsers) {
      if (u.phone) {
        const cleanPhone = String(u.phone).replace(/\D/g, '').slice(-9);
        if (cleanPhone.length >= 7) {
          db.prepare(`
            UPDATE orders 
            SET user_id = ?, telegram_id = COALESCE(telegram_id, ?)
            WHERE (user_id IS NULL OR telegram_id IS NULL)
              AND REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '+', ''), '-', '') LIKE ?
          `).run(u.id, u.telegram_id, `%${cleanPhone}%`);
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
    if (allUsers.length === 1) {
      const mainUser = allUsers[0];
      db.prepare(`
        UPDATE orders 
        SET user_id = ?, telegram_id = COALESCE(telegram_id, ?)
        WHERE user_id IS NULL
      `).run(mainUser.id, mainUser.telegram_id);
    }
  } catch (e) {}

  console.log(`✅ [Restore] To'liq backup import qilindi: ${JSON.stringify(counts)}`);
  return counts;
}

// Taom rasmini Telegram cloud'ga zaxiralash (Render qayta ishga tushganda yo'qolmasligi uchun)
async function uploadImageToTelegram(filePath, caption = '') {
  try {
    if (!bot) return null;
    const channelId = getBackupChannelId();
    if (!channelId) return null;
    if (!fs.existsSync(filePath)) return null;

    const sent = await bot.telegram.sendPhoto(channelId, { source: filePath }, {
      caption: `🖼 TAOM_RASMI: ${caption || path.basename(filePath)}`
    });
    if (sent && sent.photo && sent.photo.length > 0) {
      const best = sent.photo[sent.photo.length - 1];
      return best.file_id;
    }
  } catch (err) {
    console.error('uploadImageToTelegram xatoligi:', err && err.message);
  }
  return null;
}

// Barcha mavjud taomlar rasmlarini Telegram cloud'dan diskka yuklab olish
async function restoreMissingProductImages() {
  try {
    if (!bot) return;
    const products = db.prepare("SELECT id, name, image_url, image_file_id FROM products WHERE image_file_id IS NOT NULL AND image_file_id != ''").all();
    const uploadsDir = getUploadsDir();

    for (const p of products) {
      if (!p.image_url || !p.image_url.startsWith('/uploads/')) continue;
      const filename = path.basename(p.image_url);
      const filePath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filePath)) {
        try {
          const link = await bot.telegram.getFileLink(p.image_file_id);
          const res = await fetch(link.href);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(filePath, buf);
            console.log(`✅ [Image Restore] Taom rasmi tiklandi: ${p.name} -> ${filename}`);
          }
        } catch (e) {
          console.error(`Rasm tiklanmadi (${filename}):`, e && e.message);
        }
      }
    }
  } catch (err) {
    console.error('restoreMissingProductImages xatoligi:', err && err.message);
  }
}

module.exports = {
  backupUsersToChannel,
  restoreUsersFromChannel,
  notifyIfDatabaseEmpty,
  importUsersArray,
  importBackupData,
  collectSnapshot,
  writeSnapshotFile,
  getBackupChannelId,
  uploadImageToTelegram,
  restoreMissingProductImages,
  setBotInstance: (b) => { bot = b; }
};
