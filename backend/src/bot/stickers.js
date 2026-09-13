// iOS uslubidagi stikerlar (Apple Color Emoji PNG, CDN orqali).
// Manba: C:\IOS STIKERS (emoji-datasource-apple).
// Telegram client emojilarni o'zi chizadi (Android'da Google uslubida),
// shuning uchun mijozga ko'rinadigan asosiy xabarlarda rasm-stiker yuboramiz.

const STICKER_CDN = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/';

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
  plate: '1f37d.png', // 🍽 tayyor
  package: '1f4e6.png', // 📦 buyurtma
  bell: '1f514.png', // 🔔 bildirishnoma
  money: '1f4b0.png', // 💰 to'lov
  phone: '1f4f1.png', // 📱 telefon
  pin: '1f4cd.png', // 📍 manzil
  user: '1f464.png', // 👤 profil
  hourglass: '23f3.png', // ⏳ kutilmoqda
  warning: '26a0.png', // ⚠️ ogohlantirish
  clipboard: '1f4cb.png', // 📋 ro'yxat
  scooter: '1f6f5.png', // 🛵 yetkazish
  info: '2139-fe0f.png' // ℹ️ ma'lumot
};

// Buyurtma statusi -> stiker nomi
const STATUS_STICKERS = {
  pending: 'hourglass',
  accepted: 'chef',
  on_the_way: 'car',
  ready: 'plate',
  completed: 'check',
  cancelled: 'cross'
};

function stickerUrl(name) {
  const file = STICKERS[name];
  return file ? STICKER_CDN + file : null;
}

/**
 * Mijoz chat'iga iOS stiker-rasm + caption yuborish.
 * Rasm yuborilmasa (CDN/Telegram xatosi) oddiy matn yuboriladi.
 */
async function replyWithSticker(ctx, name, caption, extra = {}) {
  const url = stickerUrl(name);
  if (!url) {
    return ctx.reply(caption, extra);
  }
  try {
    return await ctx.replyWithPhoto({ url }, { caption, ...extra });
  } catch (err) {
    console.error(`Stiker yuborishda xatolik (${name}):`, err.message);
    return ctx.reply(caption, extra);
  }
}

/**
 * Chat ID bo'yicha iOS stiker-rasm yuborish (kanal/DM xabarnomalari uchun).
 */
async function sendStickerToChat(telegram, chatId, name, caption, extra = {}) {
  const url = stickerUrl(name);
  if (!url) {
    return telegram.sendMessage(chatId, caption, extra).catch(() => {});
  }
  try {
    return await telegram.sendPhoto(chatId, { url }, { caption, ...extra });
  } catch (err) {
    console.error(`Stiker yuborishda xatolik (${name}):`, err.message);
    return telegram.sendMessage(chatId, caption, extra).catch(() => {});
  }
}

module.exports = {
  STICKER_CDN,
  STICKERS,
  STATUS_STICKERS,
  stickerUrl,
  replyWithSticker,
  sendStickerToChat
};
