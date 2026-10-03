const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const db = require('../db');
const { 
  backupUsersToChannel, 
  restoreUsersFromChannel, 
  notifyIfDatabaseEmpty, 
  importUsersArray, 
  importBackupData, 
  uploadImageToTelegram,
  restoreMissingProductImages,
  setBotInstance 
} = require('./backupService');
const { replyWithSticker, sendStickerToChat, STATUS_STICKERS } = require('./stickers');

let bot = null;

function getCourierUrl() {
  if (process.env.COURIER_URL && process.env.COURIER_URL.trim()) {
    return process.env.COURIER_URL.trim();
  }
  const base = (process.env.TELEGRAM_MINI_APP_URL || process.env.MINI_APP_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
  const cPath = (process.env.COURIER_PATH || '/courier').trim();
  const normPath = cPath.startsWith('/') ? cPath : '/' + cPath;
  return `${base}${normPath}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Foydalanuvchiga yuborilgan telefon so'rash xabarlarini tozalash uchun kesh
const userPhonePromptMap = new Map();

// Mijoz uchun xush kelibsiz banner ma'lumotlari (matn va tugmalar)
function getWelcomeCardData(from) {
  const dbUser = db.prepare('SELECT id, phone FROM users WHERE telegram_id = ?').get(from.id);
  const firstName = escapeHtml(from.first_name || 'Hurmatli mijoz');
  const miniAppUrl = (process.env.TELEGRAM_MINI_APP_URL || process.env.MINI_APP_URL || '').trim();
  const hasHttps = miniAppUrl.startsWith('https://');

  // Mini App ochilganda mijoz ma'lumotlari darhol ko'rinishi uchun parametrlar
  const userParams = new URLSearchParams();
  userParams.set('tg_id', String(from.id));
  if (from.first_name) userParams.set('tg_first_name', from.first_name);
  if (from.last_name) userParams.set('tg_last_name', from.last_name);
  if (from.username) userParams.set('tg_username', from.username);
  if (dbUser && dbUser.phone) userParams.set('tg_phone', dbUser.phone);

  const sep = miniAppUrl.includes('?') ? '&' : '?';
  const fullAppUrl = `${miniAppUrl}${sep}${userParams.toString()}`;

  let keyboard = [];
  if (hasHttps) {
    keyboard = [
      [Markup.button.webApp('🍔 Menyu va Buyurtma berish', fullAppUrl)],
      [Markup.button.callback('ℹ️ Biz haqimizda', 'about_us')]
    ];
  } else {
    keyboard = [
      [Markup.button.callback('🍔 Taomlar menyusi', 'show_menu')],
      [Markup.button.callback('ℹ️ Biz haqimizda', 'about_us')]
    ];
  }

  const profileLines = [
    `👤 Ism: <b>${firstName}</b>`,
    `🆔 ID: <code>${from.id}</code>`
  ];
  if (from.username) {
    profileLines.push(`🔗 Username: @${escapeHtml(from.username)}`);
  }
  if (dbUser && dbUser.phone) {
    profileLines.push(`📞 Tel: <code>${escapeHtml(dbUser.phone)}</code>`);
  }

  const text = `Assalomu alaykum, <b>${firstName}</b>! 🍔🔥\n\n<b>"Samira Fast Food"</b> rasmiy yetkazib berish botiga xush kelibsiz!\n\n🔥 <b>ENG MAZALI FAST FOOD</b>\n🍔 Burger | 🌯 Lavash | 🌭 Hotdog\n📍 Qashqadaryo, G'uzor | 🚀 Tezkor Dostavka\n\n${profileLines.join('\n')}\n\nBuyurtma berish uchun quyidagi tugmani bosing:`;

  return { text, keyboard, fullAppUrl, hasHttps };
}

// "Biz haqimizda" bo'limi ma'lumotlari (2-rasmdagi ko'rinish va tugmalar)
function getAboutUsData(from) {
  const { fullAppUrl, hasHttps } = getWelcomeCardData(from);

  let aboutKeyboard = [];
  if (hasHttps) {
    aboutKeyboard = [
      [Markup.button.webApp('🍔 Menyu va Buyurtma berish', fullAppUrl)],
      [Markup.button.callback('⬅️ Orqaga', 'back_to_welcome')]
    ];
  } else {
    aboutKeyboard = [
      [Markup.button.callback('🍔 Taomlar menyusi', 'show_menu')],
      [Markup.button.callback('⬅️ Orqaga', 'back_to_welcome')]
    ];
  }

  const aboutText = `🍔 <b>"Samira Fast Food" — Guzor</b>\n\n` +
    `🔥 <b>ENG MAZALI FAST FOOD</b>\n` +
    `🍔 Burger | 🌯 Lavash | 🌭 Hotdog\n\n` +
    `🕒 Ish vaqti: 09:00 dan 23:00 gacha\n` +
    `📞 Telefon: +998 70 219 55 55\n` +
    `📍 Manzil: Qashqadaryo viloyati, G'uzor tumani\n` +
    `🚀 TEZKOR DOSTAVKA 🚙\n` +
    `📸 Instagram: @samirakafe`;

  return { aboutText, aboutKeyboard };
}

// Mijoz uchun asosiy xush kelibsiz bannerini chiqarish
async function sendWelcomeCard(ctx, from) {
  const { text, keyboard } = getWelcomeCardData(from);
  const logoPath = path.join(__dirname, '../../uploads/samira-logo.png');

  if (fs.existsSync(logoPath)) {
    try {
      return await ctx.replyWithPhoto({ source: logoPath }, {
        caption: text,
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(keyboard)
      });
    } catch (e) {
      // Photo yuborishda xatolik bo'lsa matn yuborish
    }
  }

  return await ctx.reply(text, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard(keyboard)
  });
}

function initBot(token) {
  if (!token || token.trim() === '') {
    console.log('⚠️ Telegram Bot token kiritilmagan.');
    return null;
  }

  try {
    bot = new Telegraf(token.trim());
    setBotInstance(bot);

    // /start buyrug'i
    bot.start(async (ctx) => {
      try {
        const from = ctx.from;
        if (!from) return;

        // Foydalanuvchini har /start da UPSERT qilish: ism/username yangilanadi,
        // phone va created_at o'zgarmasdan saqlanadi (telegram_id UNIQUE)
        db.prepare(`
          INSERT INTO users (telegram_id, first_name, last_name, username)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(telegram_id) DO UPDATE SET
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            username = excluded.username
        `).run(from.id, from.first_name || '', from.last_name || '', from.username || '');

        // Yangi yoki yangilangan user'ni backup qilish
        backupUsersToChannel(null, false).catch(() => {});

        const text = ctx.message?.text || '';
        const payload = ctx.startPayload || (text.includes(' ') ? text.split(' ')[1] : '');
        const miniAppUrl = (process.env.TELEGRAM_MINI_APP_URL || process.env.MINI_APP_URL || '').trim();
        const hasHttps = miniAppUrl.startsWith('https://');

        // ==========================================
        // 1. KURYER TAKLIF HAVOLASI ORQALI KIRGANDA
        // ==========================================
        if (payload && payload.startsWith('courier_')) {
          const token = payload.replace('courier_', '').trim();
          const invite = db.prepare('SELECT * FROM courier_invites WHERE token = ?').get(token);

          if (!invite) {
            return ctx.reply(
              `❌ *Taklif havolasi yaroqsiz yoki eskirgan!*\n\nIltimos, yangi havola olish uchun restoran ma'muriyati bilan bog'laning.`,
              { parse_mode: 'Markdown' }
            );
          }

          if (Number(invite.is_used) === 1) {
            return ctx.reply(
              `❌ *Bu taklif havolasi allaqachon ishlatilgan!*\n\nIltimos, yangi havola olish uchun restoran ma'muriyati bilan bog'laning.`,
              { parse_mode: 'Markdown' }
            );
          }

          // Kuryerni ro'yxatga olish / yangilash
          const existingCourier = db.prepare('SELECT * FROM couriers WHERE telegram_id = ?').get(from.id);
          if (!existingCourier) {
            db.prepare(`
              INSERT INTO couriers (telegram_id, first_name, last_name, username, phone, status, is_online)
              VALUES (?, ?, ?, ?, ?, 'active', 1)
            `).run(from.id, from.first_name || '', from.last_name || '', from.username || '', '');
          } else {
            db.prepare(`
              UPDATE couriers
              SET status = 'active', first_name = ?, last_name = ?, username = ?
              WHERE telegram_id = ?
            `).run(from.first_name || '', from.last_name || '', from.username || '', from.id);
          }

          // Tokenni ishlatilgan deb belgilash
          db.prepare('UPDATE courier_invites SET is_used = 1, used_by = ? WHERE id = ?').run(from.id, invite.id);

          const courierUrl = getCourierUrl();
          const courierHasHttps = courierUrl.startsWith('https://');

          let courierKeyboard = [];
          if (courierHasHttps) {
            courierKeyboard = [
              [Markup.button.webApp('🚴 Kuryer Ishchi Panelini ochish', courierUrl)],
              ...(hasHttps ? [[Markup.button.webApp('🍔 Mijoz sifatida menyuni ko\'rish', miniAppUrl)]] : [])
            ];
          } else {
            courierKeyboard = [
              [Markup.button.url('🚴 Kuryer Ishchi Paneli', courierUrl)],
              [Markup.button.callback('🍔 Taomlar menyusi', 'show_menu')]
            ];
          }

          const safeCourierName = escapeHtml(from.first_name || 'Kuryer');
          return ctx.reply(
            `🎉 <b>Tabriklaymiz, ${safeCourierName}!</b>\n\nSiz "Samira Fast Food" tizimida rasmiy <b>KURYER</b> sifatida muvaffaqiyatli ro'yxatdan o'tdingiz! 🚴📦\n\nEndi restoranimizdan yetkazib berish buyurtmalari chiqqanda, ularni qabul qilishingiz va xarita orqali yetkazishingiz mumkin.\n\n🌐 <b>Kuryer Paneli:</b> ${courierUrl}\n\nIshni boshlash uchun quyidagi tugmani bosing:`,
            {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard(courierKeyboard)
            }
          );
        }

        // ==========================================
        // 2. AGAR FOYDALANUVCHI ALLAQACHON KURYER BO'LSA
        // ==========================================
        const isCourier = db.prepare("SELECT * FROM couriers WHERE telegram_id = ? AND status = 'active'").get(from.id);
        if (isCourier) {
          const courierUrl = getCourierUrl();
          const courierHasHttps = courierUrl.startsWith('https://');

          let courierKeyboard = [];
          if (courierHasHttps) {
            courierKeyboard = [
              [Markup.button.webApp('🚴 Kuryer Ishchi Paneli', courierUrl)],
              ...(hasHttps ? [[Markup.button.webApp('🍔 Taom buyurtma qilish (Mijoz rejimi)', miniAppUrl)]] : [])
            ];
          } else {
            courierKeyboard = [
              [Markup.button.url('🚴 Kuryer Ishchi Paneli', courierUrl)],
              [Markup.button.callback('🍔 Taomlar menyusi', 'show_menu')]
            ];
          }

          const safeCourierName = escapeHtml(from.first_name || "Do'stimiz");
          return ctx.reply(
            `Assalomu alaykum, xush kelibsiz kuryerimiz <b>${safeCourierName}</b>! 🚴💨\n\n🌐 <b>Kuryer Paneli:</b> ${courierUrl}\n\nBuyurtmalarni ko'rish va yetkazishni boshlash uchun Kuryer Panelini oching:`,
            {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard(courierKeyboard)
            }
          );
        }

        // ==========================================
        // 3. ODDIY MIJOZLAR
        // ==========================================
        const dbUser = db.prepare('SELECT id, phone FROM users WHERE telegram_id = ?').get(from.id);
        const firstName = escapeHtml(from.first_name || 'Hurmatli mijoz');

        // Agar foydalanuvchi telefon raqami yo'q bo'lsa — faqat telefon so'rash xabarini chiqaramiz
        if (!dbUser || !dbUser.phone) {
          const oldPromptId = userPhonePromptMap.get(from.id);
          if (oldPromptId) {
            await ctx.telegram.deleteMessage(ctx.chat.id, oldPromptId).catch(() => {});
            userPhonePromptMap.delete(from.id);
          }

          const promptMsg = await ctx.reply(
            `Assalomu alaykum, <b>${firstName}</b>! 🍔🔥\n\n<b>"Samira Fast Food"</b> rasmiy botiga xush kelibsiz!\n\nBuyurtmalarni tez va qulay rasmiylashtirish uchun telefon raqamingizni yuboring:`,
            {
              parse_mode: 'HTML',
              ...Markup.keyboard([[Markup.button.contactRequest('📱 Telefon raqamni yuborish')]]).resize().oneTime()
            }
          );
          if (promptMsg && promptMsg.message_id) {
            userPhonePromptMap.set(from.id, promptMsg.message_id);
          }
          return;
        }

        // Telefon raqami mavjud bo'lsa — to'g'ridan-to'g'ri Menyu va Buyurtma kartasini chiqaramiz
        await sendWelcomeCard(ctx, from);
        return;
      } catch (err) {
        console.error('/start xatoligi:', err.message);
      }
    });

    // ============ ADMIN BACKUP BUYRUQLARI ============
    // Ruxsat: backup/buyurtma kanali ichidan yoki ADMIN_TELEGRAM_ID DM'dan
    function isBackupAdmin(ctx) {
      try {
        const { getBackupChannelId } = require('./backupService');
        const backupChannel = getBackupChannelId();
        const ordersChannel = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || '').trim();
        const chatId = ctx.chat ? String(ctx.chat.id) : '';
        if (chatId && (chatId === String(backupChannel) || (ordersChannel && chatId === ordersChannel))) {
          return true;
        }
        const adminTgId = (process.env.ADMIN_TELEGRAM_ID || '').trim();
        if (adminTgId && ctx.from && String(ctx.from.id) === adminTgId) {
          return true;
        }
      } catch (e) { /* ignore */ }
      return false;
    }

    // /backup — to'liq bazani backup kanaliga yuborish (tartibli + pin)
    bot.command('backup', async (ctx) => {
      try {
        if (!isBackupAdmin(ctx)) {
          return ctx.reply('⛔ Bu buyruq faqat admin uchun.');
        }
        await ctx.reply('📦 Backup tayyorlanmoqda...');
        const result = await backupUsersToChannel(null, true);
        if (result && result.success) {
          const c = result.counts;
          return ctx.reply(
            `✅ *Backup yuborildi!*\n\n👥 Userlar: *${c.users}*\n🍔 Taomlar: *${c.products}*\n📋 Buyurtmalar: *${c.orders}*`,
            { parse_mode: 'Markdown' }
          );
        }
        return ctx.reply('❌ Backup yuborilmadi. Backup kanali sozlanganini tekshiring.');
      } catch (err) {
        console.error('/backup xatoligi:', err.message);
      }
    });

    // /restore — mahalliy backup fayldan tiklash
    bot.command('restore', async (ctx) => {
      try {
        if (!isBackupAdmin(ctx)) {
          return ctx.reply('⛔ Bu buyruq faqat admin uchun.');
        }
        const result = await restoreUsersFromChannel();
        if (result && result.success) {
          const c = result.counts;
          return ctx.reply(
            `✅ *Baza tiklandi!*\n\n👥 Userlar: *${c.users}*\n🍔 Taomlar: *${c.products}*\n📂 Kategoriya: *${c.categories}*\n🛵 Kuryer: *${c.couriers}*\n📋 Buyurtmalar: *${c.orders}*`,
            { parse_mode: 'Markdown' }
          );
        }
        return ctx.reply(
          '⚠️ Mahalliy backup topilmadi.\n\n♻️ Kanaldagi 📌 pinlangan `restaurant_backup.js` faylini menga forward qiling.',
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('/restore xatoligi:', err.message);
      }
    });

    // Menyu tugmasi bosilganda
    bot.action('show_menu', async (ctx) => {
      await ctx.answerCbQuery();
      const miniAppUrl = (process.env.MINI_APP_URL || '').trim();
      const prods = db.prepare('SELECT name, price FROM products WHERE is_available = 1 LIMIT 15').all();
      let text = `🍔 *"Samira Fast Food" — Guzor*\n🔥 *ENG MAZALI FAST FOOD*\n\n`;
      if (prods && prods.length > 0) {
        text += prods.map((p, i) => `${i + 1}. ${p.name} — ${Number(p.price).toLocaleString()} so'm`).join('\n');
      } else {
        text += `Taomlar ro'yxati Admin panel orqali kiritiladi.`;
      }
      if (miniAppUrl) {
        text += `\n\n🌐 *Web menyu:* ${miniAppUrl}`;
      }
      return ctx.reply(text, { parse_mode: 'Markdown' });
    });

    // Biz haqimizda tugmasi — mavjud xabarni 2-rasmdagi matnga tahrirlaydi, Menyu va Orqaga tugmalarini chiqaradi
    bot.action('about_us', async (ctx) => {
      await ctx.answerCbQuery().catch(() => {});
      const from = ctx.from;
      if (!from) return;

      const { aboutText, aboutKeyboard } = getAboutUsData(from);

      try {
        await ctx.editMessageText(aboutText, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(aboutKeyboard)
        });
      } catch (err) {
        try {
          await ctx.editMessageCaption(aboutText, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(aboutKeyboard)
          });
        } catch (e) {
          await ctx.deleteMessage().catch(() => {});
          await ctx.reply(aboutText, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(aboutKeyboard)
          });
        }
      }
    });

    // Orqaga tugmasi — xabarni 1-rasmdagi xush kelibsiz holatiga qaytaradi
    bot.action('back_to_welcome', async (ctx) => {
      await ctx.answerCbQuery().catch(() => {});
      const from = ctx.from;
      if (!from) return;

      const { text, keyboard } = getWelcomeCardData(from);

      try {
        await ctx.editMessageText(text, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(keyboard)
        });
      } catch (err) {
        try {
          await ctx.editMessageCaption(text, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(keyboard)
          });
        } catch (e) {
          await ctx.deleteMessage().catch(() => {});
          await ctx.reply(text, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(keyboard)
          });
        }
      }
    });

    // Kuryer havolasi so'ralganda
    bot.action(['courier_web', 'courier_info'], async (ctx) => {
      await ctx.answerCbQuery();
      const cUrl = getCourierUrl();
      return ctx.reply(`🚴 *Kuryer Ishchi Paneli Havolasi:*\n${cUrl}`, { parse_mode: 'Markdown' });
    });

    // Buyurtma holatini yangilash (Kanal adminlari bosganda)
    bot.action(/^order_status:(\d+):(.+)$/, async (ctx) => {
      const orderId = ctx.match[1];
      const newStatus = ctx.match[2];
      const ALLOWED_ORDER_STATUSES = ['pending', 'accepted', 'on_the_way', 'ready', 'completed', 'cancelled'];

      if (!ALLOWED_ORDER_STATUSES.includes(newStatus)) {
        try {
          await ctx.answerCbQuery('Noto\'g\'ri status!');
        } catch (e) {
          console.error('order_status answerCbQuery xatoligi:', e && e.message);
        }
        return;
      }

      const statusMap = {
        pending: '⏳ Kutilmoqda',
        accepted: '👨‍🍳 Qabul qilindi (Tayyorlanmoqda)',
        on_the_way: '🚗 Kuryerga berildi (Yo\'lda)',
        ready: '🍽 Tayyor (Topshirishga tayyor)',
        completed: '✅ Yetkazildi (Tugatildi)',
        cancelled: '❌ Bekor qilindi'
      };

      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, orderId);
      backupUsersToChannel(null, true).catch(() => {});
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

      let nextButtons = [];
      if (newStatus === 'accepted') {
        nextButtons = [
          [Markup.button.callback('🚗 Kuryerga berildi', `order_status:${orderId}:on_the_way`)],
          [Markup.button.callback('❌ Bekor qilish', `order_status:${orderId}:cancelled`)]
        ];
      } else if (newStatus === 'on_the_way') {
        nextButtons = [
          [Markup.button.callback('✅ Yetkazildi deb belgilash', `order_status:${orderId}:completed`)]
        ];
      }

      try {
        if (nextButtons.length > 0) {
          await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(nextButtons).reply_markup);
        } else {
          await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([]).reply_markup);
        }

        await ctx.answerCbQuery(`Holat o'zgardi: ${statusMap[newStatus]}`);

        if (order && order.user_id) {
          const user = db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(order.user_id);
          if (user && user.telegram_id) {
            // Statusga mos iOS stiker-rasm bilan bildirishnoma
            sendStickerToChat(
              ctx.telegram,
              user.telegram_id,
              STATUS_STICKERS[newStatus] || 'bell',
              `🔔 *Buyurtmangiz holati yangilandi!*\n\n📦 Buyurtma raqami: #${orderId}\nHolat: *${statusMap[newStatus]}*`,
              { parse_mode: 'Markdown' }
            );
          }
        }
      } catch (err) {
        console.error('Kanal xabarini yangilashda xatolik:', err.message);
      }
    });

    // Bot kanalga admin qilib qo'shilganda yoki huquqlari o'zgarganda
    bot.on('my_chat_member', async (ctx) => {
      try {
        const update = ctx.myChatMember;
        const newStatus = update.new_chat_member?.status;
        const chat = update.chat;

        console.log(`📢 Bot holati o'zgardi: Chat ID: ${chat.id}, Turi: ${chat.type}, Yangi status: ${newStatus}`);

        if (newStatus === 'administrator' || newStatus === 'creator') {
          console.log(`🎉 Bot ${chat.title || chat.id} kanalida/guruhida ADMIN bo'ldi!`);
          // Ushbu kanalni settings ga saqlash
          db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('backup_channel_id', ?)").run(String(chat.id));
          
          await ctx.reply(
            `✅ Bot muvaffaqiyatli admin qilindi!\n\n📂 Ushbu kanalga barcha foydalanuvchilar bazasi (.js formatda) avtomatik backup qilib yuboriladi va tizim yangilanganda shu yerdan tiklanadi.`
          );

          // Darhol bazani to'liq snapshot qilib kanalga tashlash!
          await backupUsersToChannel(String(chat.id), true);
        }
      } catch (err) {
        console.error('my_chat_member xatoligi:', err.message);
      }
    });

    // Kanaldan yoki shaxsiy chatdan .js backup fayl yuborilganda uni o'qib bazaga tiklash (Restore)
    // v1 (faqat userlar massivi) va v2 (to'liq snapshot) formatlar qabul qilinadi
    bot.on(['document', 'channel_post'], async (ctx) => {
      try {
        const message = ctx.channelPost || ctx.message;
        if (!message || !message.document) return;

        const doc = message.document;
        if (doc.file_name && doc.file_name.endsWith('.js')) {
          console.log(`📥 Kanaldan/Chatdan .js backup fayli qabul qilindi: ${doc.file_name}`);

          const fileLink = await ctx.telegram.getFileLink(doc.file_id);
          const response = await fetch(fileLink.href);
          const fileText = (await response.text()).trim();

          // module.exports = [...] yoki module.exports = {...} ni xavfsiz ajratib olish
          const match = fileText.match(/module\.exports\s*=\s*([\s\S]*?);\s*$/);
          if (match && match[1]) {
            const backupData = JSON.parse(match[1]);
            const counts = importBackupData(backupData);
            const total = Object.values(counts).reduce((a, b) => a + b, 0);
            if (total > 0) {
              await ctx.reply(
                `✅ *Baza tiklandi!*\n\n👥 Userlar: *${counts.users}*\n🍔 Taomlar: *${counts.products}*\n📂 Kategoriya: *${counts.categories}*\n🛵 Kuryer: *${counts.couriers}*\n📋 Buyurtmalar: *${counts.orders}*`,
                { parse_mode: 'Markdown' }
              );
            } else {
              await ctx.reply('⚠️ Faylda tiklanadigan ma\'lumot topilmadi.');
            }
          }
        }
      } catch (err) {
        console.error('Fayldan tiklashda xatolik:', err.message);
      }
    });

    // Foydalanuvchi "Telefon raqamni yuborish" tugmasini bossa — raqamni bazaga saqlash
    bot.on('contact', async (ctx) => {
      try {
        const msg = ctx.message;
        if (!msg || !msg.contact) return;
        const contact = msg.contact;

        // Faqat o'z raqamini yuborishga ruxsat
        if (contact.user_id && ctx.from && contact.user_id !== ctx.from.id) {
          return ctx.reply("⛔ Iltimos, o'zingizning raqamingizni yuboring.", Markup.removeKeyboard());
        }

        let phone = (contact.phone_number || '').trim();
        if (!phone) return;
        if (!phone.startsWith('+')) phone = `+${phone}`;

        // 1. Foydalanuvchi yuborgan kontakt kartasini chatdan o'chirish
        await ctx.deleteMessage().catch(() => {});

        // 2. Bot yuborgan telefon so'rash xabarini chatdan o'chirish
        const promptId = userPhonePromptMap.get(ctx.from.id);
        if (promptId) {
          await ctx.telegram.deleteMessage(ctx.chat.id, promptId).catch(() => {});
          userPhonePromptMap.delete(ctx.from.id);
        }

        // 3. Raqamni bazada yangilash / saqlash
        const existing = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(ctx.from.id);
        if (existing) {
          db.prepare('UPDATE users SET phone = ?, first_name = ?, last_name = ?, username = ? WHERE telegram_id = ?')
            .run(phone, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', ctx.from.id);
        } else {
          db.prepare('INSERT INTO users (telegram_id, first_name, last_name, username, phone) VALUES (?, ?, ?, ?, ?)')
            .run(ctx.from.id, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', phone);
        }
        backupUsersToChannel(null, true).catch(() => {});

        // 4. Stikersiz, to'g'ridan-to'g'ri keyingi xabarni (Menyu va Buyurtma kartasini) chiqarish
        await sendWelcomeCard(ctx, ctx.from);
      } catch (err) {
        console.error('contact xatoligi:', err.message);
      }
    });

    // Foydalanuvchi matn orqali telefon raqami yozsa ham qabul qilish va xabarlarni tozalash
    bot.hears(/^(\+?998|8)?\s?\(?\d{2}\)?\s?\d{3}\s?\d{2}\s?\d{2}$/, async (ctx) => {
      try {
        const rawText = (ctx.message?.text || '').replace(/[\s()-]/g, '');
        let phone = rawText;
        if (!phone.startsWith('+')) {
          if (phone.startsWith('998')) phone = `+${phone}`;
          else if (phone.length === 9) phone = `+998${phone}`;
          else phone = `+${phone}`;
        }

        // 1. Foydalanuvchi yozgan xabarni o'chirish
        await ctx.deleteMessage().catch(() => {});

        // 2. Botning so'rov xabarini o'chirish
        const promptId = userPhonePromptMap.get(ctx.from.id);
        if (promptId) {
          await ctx.telegram.deleteMessage(ctx.chat.id, promptId).catch(() => {});
          userPhonePromptMap.delete(ctx.from.id);
        }

        // 3. Raqamni bazaga saqlash
        const existing = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(ctx.from.id);
        if (existing) {
          db.prepare('UPDATE users SET phone = ?, first_name = ?, last_name = ?, username = ? WHERE telegram_id = ?')
            .run(phone, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', ctx.from.id);
        } else {
          db.prepare('INSERT INTO users (telegram_id, first_name, last_name, username, phone) VALUES (?, ?, ?, ?, ?)')
            .run(ctx.from.id, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', phone);
        }
        backupUsersToChannel(null, true).catch(() => {});

        // 4. Keyingi xabarni chiqarish
        await sendWelcomeCard(ctx, ctx.from);
      } catch (err) {
        console.error('text phone xatoligi:', err.message);
      }
    });

    bot.catch((err, ctx) => {
      console.error(`Bot xatoligi (${ctx.updateType}):`, err);
    });

    // Server ishga tushganda avtomatik kanaldan yoki mahalliy backupdan tiklash
    restoreUsersFromChannel().catch((err) => console.error('restoreUsersFromChannel xatoligi:', err.message));

    // Baza bo'shligi haqida kanalga keraksiz xabar yuborish o'chirildi (yangi bot ishga tushganda ortiqcha vahima bo'lmasligi uchun)

    // Kunlik avtomatik backup (backup kanali tartibli turishi uchun)
    const backupIntervalHours = parseFloat(process.env.BACKUP_INTERVAL_HOURS || '24');
    if (Number.isFinite(backupIntervalHours) && backupIntervalHours > 0) {
      setInterval(() => {
        backupUsersToChannel(null, false).catch(() => {});
      }, backupIntervalHours * 60 * 60 * 1000);
      console.log(`⏰ Avto-backup har ${backupIntervalHours} soatda ishga tushadi.`);
    }

    bot.launch({
      allowedUpdates: ['message', 'callback_query', 'channel_post', 'my_chat_member']
    }, () => {
      console.log('🤖 Telegram bot muvaffaqiyatli ishga tushdi va xabarlarni kutmoqda!');
    }).catch(err => {
      console.error('Bot launch xatoligi:', err.message);
    });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return bot;
  } catch (err) {
    console.error('Botni ishga tushirishda xatolik:', err);
    return null;
  }
}

// Oshxona kanaliga buyurtma yuborish
async function sendOrderToChannel(orderId) {
  if (!bot) return false;

  // Avval .env dan, agar u yerda bo'lmasa bazadagi settings dan oladi
  const channelSetting = db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  const channelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelSetting ? channelSetting.value : null) || '').trim();

  if (!channelId) {
    console.log('⚠️ Buyurtma kanal ID si (.env yoki Sozlamalarda) belgilanmagan.');
    return false;
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return false;

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  let itemsText = '';
  items.forEach((item, index) => {
    itemsText += `${index + 1}. *${item.product_name}* — ${item.quantity} x ${item.price.toLocaleString()} so'm = ${(item.quantity * item.price).toLocaleString()} so'm\n`;
  });

  const orderTypeText = order.order_type === 'delivery' ? '🚗 Yetkazib berish (Dostavka)' : '🏃 Olib ketish (Samovivoz)';
  const paymentText = order.payment_method === 'cash' ? '💵 Naqd pul' : '💳 Karta orqali';

  let msg = `🔥 *YANGI BUYURTMA #${order.id}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *Mijoz:* ${order.customer_name || 'Noma\'lum'}\n`;
  msg += `📞 *Telefon:* ${order.customer_phone || 'Kiritilmagan'}\n`;
  msg += `📦 *Buyurtma turi:* ${orderTypeText}\n`;
  if (order.address) {
    msg += `📍 *Manzil:* ${order.address}\n`;
  }
  msg += `💳 *To'lov usuli:* ${paymentText}\n`;
  if (order.notes) {
    msg += `📝 *Izoh:* ${order.notes}\n`;
  }
  msg += `\n🛒 *Taomlar:* \n${itemsText}\n`;
  msg += `💰 *Jami to'lov:* *${order.total_amount.toLocaleString()} so'm*\n`;
  msg += `🕒 *Vaqt:* ${new Date(order.created_at).toLocaleTimeString('uz-UZ')}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━`;

  const inlineKeyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('👨‍🍳 Qabul qilish', `order_status:${order.id}:accepted`),
      Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)
    ]
  ]);

  try {
    const sentMsg = await bot.telegram.sendMessage(channelId, msg, {
      parse_mode: 'Markdown',
      ...inlineKeyboard
    });

    db.prepare('UPDATE orders SET channel_message_id = ? WHERE id = ?').run(sentMsg.message_id, orderId);

    if (order.latitude && order.longitude) {
      await bot.telegram.sendLocation(channelId, order.latitude, order.longitude);
    }

    return true;
  } catch (err) {
    console.error('Kanalga buyurtma yuborishda xatolik:', err.message);
    return false;
  }
}

module.exports = { 
  initBot, 
  sendOrderToChannel, 
  backupUsersToChannel, 
  restoreUsersFromChannel,
  uploadImageToTelegram,
  restoreMissingProductImages,
  getBot: () => bot 
};
