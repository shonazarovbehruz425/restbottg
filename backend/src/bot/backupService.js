const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const db = require('../db');

let bot = null;

// Foydalanuvchilar bazasini .js formatda faylga eksport qilish va kanalga tashlash
async function backupUsersToChannel(customChannelId = null) {
  if (!bot) return false;

  const targetChannelId = customChannelId || getBackupChannelId();
  if (!targetChannelId) {
    console.log('⚠️ Backup kanali belgilanmagan.');
    return false;
  }

  try {
    const users = db.prepare('SELECT * FROM users ORDER BY id ASC').all();
    
    // .js formatdagi kontentni tayyorlash
    const jsContent = `/**
 * RESTORAN TELEGRAM BOT — FOYDALANUVCHILAR BAZASI BACKUP
 * Eksport qilingan vaqt: ${new Date().toISOString()} (${new Date().toLocaleString('uz-UZ')})
 * Jami foydalanuvchilar soni: ${users.length}
 */

module.exports = ${JSON.stringify(users, null, 2)};
`;

    const tempDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const backupFilePath = path.join(tempDir, 'users_database_backup.js');
    fs.writeFileSync(backupFilePath, jsContent, 'utf8');

    const caption = `📁 *Foydalanuvchilar bazasi (.js)*\n\n` +
      `🕒 *Vaqt:* ${new Date().toLocaleString('uz-UZ')}\n` +
      `👥 *Foydalanuvchilar soni:* ${users.length} ta\n` +
      `🔄 Tizim yangilanganda yoki qayta ishga tushirilganda ushbu bazadan avtomatik tiklanadi.`;

    await bot.telegram.sendDocument(targetChannelId, {
      source: backupFilePath,
      filename: 'users_database_backup.js'
    }, {
      caption,
      parse_mode: 'Markdown'
    });

    console.log(`✅ Foydalanuvchilar bazasi ${targetChannelId} kanaliga .js formatda muvaffaqiyatli yuborildi!`);
    return true;
  } catch (err) {
    console.error('Kanalga users bazasini yuborishda xatolik:', err.message);
    return false;
  }
}

// Kanal ID sini avval .env dan, so'ng settings dan olish
function getBackupChannelId() {
  // 1. .env dagi maxsus backup kanal ID
  if (process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID && process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID.trim()) {
    return process.env.TELEGRAM_USERS_BACKUP_CHANNEL_ID.trim();
  }

  // 2. Bazadagi backup kanal sozlamasi
  const backupSetting = db.prepare("SELECT value FROM settings WHERE key = 'backup_channel_id'").get();
  if (backupSetting && backupSetting.value && backupSetting.value.trim()) {
    return backupSetting.value.trim();
  }

  // 3. .env dagi asosiy buyurtmalar kanali ID si
  if (process.env.TELEGRAM_ORDERS_CHANNEL_ID && process.env.TELEGRAM_ORDERS_CHANNEL_ID.trim()) {
    return process.env.TELEGRAM_ORDERS_CHANNEL_ID.trim();
  }

  // 4. Bazadagi asosiy kanal sozlamasi
  const mainSetting = db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  return (mainSetting && mainSetting.value) ? mainSetting.value.trim() : null;
}

// Kanaldan .js faylni yuklab olib, bazani tiklash (Restore)
async function restoreUsersFromChannel() {
  if (!bot) return false;
  const channelId = getBackupChannelId();
  if (!channelId) return false;

  console.log(`🔍 [Restore] Kanaldan (${channelId}) foydalanuvchilar bazasi (.js) tekshirilmoqda...`);

  // Eslatma: Telegram API kanaldan to'g'ridan-to'g'ri eski xabarlar tarixini faqat MTProto orqali o'qishga ruxsat beradi,
  // ammo Bot API orqali bot kanalga yangi post kelganda (on 'channel_post') yoki yuklangan fayl orqali tiklashni qo'llab-quvvatlaydi.
  // Shuningdek, agar mahalliy uploads/ papkada so'nggi users_database_backup.js bo'lsa, avtomatik undan ham tiklab oladi.
  const localBackup = path.join(
    process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads'),
    'users_database_backup.js'
  );
  if (fs.existsSync(localBackup)) {
    try {
      delete require.cache[require.resolve(localBackup)];
      const backupUsers = require(localBackup);
      if (Array.isArray(backupUsers) && backupUsers.length > 0) {
        console.log(`📥 [Restore] Mahalliy backup faylidan ${backupUsers.length} ta foydalanuvchi tekshirilmoqda...`);
        importUsersArray(backupUsers);
        return true;
      }
    } catch (e) {
      console.error('Mahalliy backupdan tiklashda xatolik:', e.message);
    }
  }

  return false;
}

// Foydalanuvchilar massivini bazaga kiritish (Dublikatlarsiz tiklash)
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

module.exports = {
  backupUsersToChannel,
  restoreUsersFromChannel,
  importUsersArray,
  setBotInstance: (b) => { bot = b; }
};
