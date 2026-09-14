const path = require('path');
const fs = require('fs');

// iOS uslubidagi stikerlar (Apple Color Emoji PNG).
// Avval backend/assets/stickers/ dagi LOKAL fayl ishlatiladi (tez + ishonchli),
// topilmasa CDN (emoji-datasource-apple) fallback bo'ladi.
const LOCAL_DIR = path.join(__dirname, '../../assets/stickers');
const FALLBACK_CDN = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/';

// Katalog: 1903 ta Apple Color Emoji stikeri, 9 kategoriya (stickerCatalog.js).
// Katalog yuklanmasa ham modul ishlashi uchun zaxira qiymatlar ishlatiladi.
let catalog = {};
try {
  catalog = require('./stickerCatalog');
} catch (err) {
  console.error('stickerCatalog.js yuklanmadi, stikerlar CDN kalitisiz ishlamaydi:', err.message);
}

const STICKER_CDN = catalog.STICKER_CDN || FALLBACK_CDN;
const CATEGORIES_INFO = catalog.CATEGORIES_INFO || {};
const EMOJI_DATA = Array.isArray(catalog.EMOJI_DATA) ? catalog.EMOJI_DATA : [];

// Eski nomli stikerlar (lokal assets/stickers/ papkasida fayllari bor).
// nom -> CDN fayl (unicode codepoint, kichik harf, '-' bilan)
const STICKERS = {
  wave: '1f44b.png', // 👋 salomlashish
  tada: '1f389.png', // 🎉 tabriklash
  burger: '1f354.png', // 🍔 menyu
  pizza: '1f355.png', // 🍕
  chef: '1f468-200d-1f373.png', // 👨‍🍳 oshpaz (qabul qilindi)
  check: '2705.png', // ✅ yetkazildi
  cross: '274c.png', // ❌ bekor qilindi
  bike: '1f6b4.png', // 🚴 kuryer
  car: '1f697.png', // 🚗 yo'lda
  plate: '1f37d-fe0f.png', // 🍽 tayyor
  package: '1f4e6.png', // 📦 buyurtma
  bell: '1f514.png', // 🔔 bildirishnoma
  money: '1f4b0.png', // 💰 to'lov
  phone: '1f4f1.png', // 📱 telefon
  pin: '1f4cd.png', // 📍 manzil
  user: '1f464.png', // 👤 profil
  hourglass: '23f3.png', // ⏳ kutilmoqda
  warning: '26a0-fe0f.png', // ⚠️ ogohlantirish
  clipboard: '1f4cb.png', // 📋 ro'yxat
  scooter: '1f6f5.png', // 🛵 yetkazish
  info: '2139-fe0f.png' // ℹ️ ma'lumot
};

// Emoji char -> PNG fayl nomi xaritasi (katalogdagi 1903 ta stiker).
// Bir xil emoji bir necha variantda uchrasa, birinchisi olinadi.
const EMOJI_FILE_MAP = new Map();
for (const item of EMOJI_DATA) {
  if (item && item.u && item.i && !EMOJI_FILE_MAP.has(item.u)) {
    EMOJI_FILE_MAP.set(item.u, item.i);
  }
}

// Buyurtma statusi -> stiker nomi
const STATUS_STICKERS = {
  pending: 'hourglass',
  accepted: 'chef',
  on_the_way: 'car',
  ready: 'plate',
  completed: 'check',
  cancelled: 'cross'
};

// Berilgan kalit uchun PNG fayl nomini topadi.
// Kalit eski nom ('wave') ham, emoji char ('👋') ham bo'lishi mumkin.
function resolveFile(name) {
  if (!name) return null;
  if (STICKERS[name]) return STICKERS[name];
  return EMOJI_FILE_MAP.get(name) || null;
}

// Stikerning CDN manzili (eski nom yoki emoji char bo'yicha).
function stickerUrl(name) {
  const file = resolveFile(name);
  return file ? STICKER_CDN + file : null;
}

// Fayl uchun yuborish obyekti: lokal fayl bo'lsa { source }, bo'lmasa { url }.
// replyWithPhoto/sendPhoto ikkalasi ham shu formatlarni qabul qiladi.
function toInput(file) {
  try {
    const localPath = path.join(LOCAL_DIR, file);
    if (fs.existsSync(localPath)) {
      return { source: localPath };
    }
  } catch (e) { /* fallback URL */ }
  return { url: STICKER_CDN + file };
}

// Stiker uchun yuborish obyekti (eski nom yoki emoji char bo'yicha).
function stickerInput(name) {
  const file = resolveFile(name);
  return file ? toInput(file) : null;
}

// Emoji char uchun stiker: lokal fayl bo'lsa { source }, bo'lmasa { url }.
// Emoji katalogda topilmasa null qaytadi.
function pickEmojiSticker(emojiChar) {
  if (!emojiChar) return null;
  const file = EMOJI_FILE_MAP.get(emojiChar);
  if (!file) return null;
  return toInput(file);
}

// Yuborish obyektini aniqlash: emoji char bo'lsa pickEmojiSticker,
// eski nom bo'lsa stickerInput ishlatiladi.
function resolveInput(name) {
  if (EMOJI_FILE_MAP.has(name)) return pickEmojiSticker(name);
  return stickerInput(name);
}

/**
 * Mijoz chat'iga iOS stiker-rasm + caption yuborish.
 * `name` eski kalit ('wave', 'tada'...) yoki emoji char ('👋', '🍕') bo'ladi.
 * Rasm yuborilmasa (topilmadi/CDN xatosi) oddiy matn yuboriladi.
 */
async function replyWithSticker(ctx, name, caption, extra = {}) {
  const input = resolveInput(name);
  if (!input) {
    return ctx.reply(caption, extra);
  }
  try {
    return await ctx.replyWithPhoto(input, { caption, ...extra });
  } catch (err) {
    console.error(`Stiker yuborishda xatolik (${name}):`, err.message);
    return ctx.reply(caption, extra);
  }
}

/**
 * Chat ID bo'yicha iOS stiker-rasm yuborish (kanal/DM xabarnomalari uchun).
 * `name` eski kalit yoki emoji char bo'ladi.
 */
async function sendStickerToChat(telegram, chatId, name, caption, extra = {}) {
  const input = resolveInput(name);
  if (!input) {
    return telegram.sendMessage(chatId, caption, extra).catch(() => {});
  }
  try {
    return await telegram.sendPhoto(chatId, input, { caption, ...extra });
  } catch (err) {
    console.error(`Stiker yuborishda xatolik (${name}):`, err.message);
    return telegram.sendMessage(chatId, caption, extra).catch(() => {});
  }
}

module.exports = {
  STICKER_CDN,
  CATEGORIES_INFO,
  EMOJI_DATA,
  STATUS_STICKERS,
  EMOJI_FILE_MAP,
  stickerUrl,
  stickerInput,
  pickEmojiSticker,
  replyWithSticker,
  sendStickerToChat
};
