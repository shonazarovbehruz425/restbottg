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
    `🕒 Ish vaqti: 09:00 dan 00:00 gacha\n` +
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

    // Bloklangan foydalanuvchilarni botdan cheklash middleware'i
    bot.use(async (ctx, next) => {
      const from = ctx.from;
      if (!from) return next();
      try {
        const u = db.prepare('SELECT is_blocked FROM users WHERE telegram_id = ?').get(from.id);
        if (u && Number(u.is_blocked) === 1) {
          if (ctx.callbackQuery) {
            await ctx.answerCbQuery('⛔️ Siz ushbu botdan bloklangansiz!', { show_alert: true }).catch(() => {});
          }
          return ctx.reply(
            '⛔️ <b>Kechirasiz, siz botdan bloklangansiz!</b>\n\n' +
            'Qoidalarni buzganingiz sababli sizga xizmat ko\'rsatish to\'xtatilgan.\n' +
            'Murojaat uchun: +998 70 219 55 55',
            { parse_mode: 'HTML' }
          );
        }
      } catch (e) {}
      return next();
    });

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
        const result = await restoreUsersFromChannel(true);
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
        } catch (e) {}
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

      try {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, orderId);
        backupUsersToChannel(null, true).catch(() => {});

        const actorName = ctx.from ? (ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Admin')) : 'Kanal';
        await updateChannelOrderMessage(orderId, `Kanal (${actorName})`);

        await ctx.answerCbQuery(`Holat o'zgardi: ${statusMap[newStatus]}`);

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (order && (order.telegram_id || order.user_id)) {
          const targetTgId = order.telegram_id || (order.user_id ? db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(order.user_id)?.telegram_id : null);
          if (targetTgId) {
            sendStickerToChat(
              ctx.telegram,
              targetTgId,
              STATUS_STICKERS[newStatus] || 'bell',
              `🔔 <b>Buyurtmangiz holati yangilandi!</b>\n\n📦 Buyurtma raqami: <b>#${orderId}</b>\nHolat: <b>${statusMap[newStatus]}</b>`,
              { parse_mode: 'HTML' }
            ).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Kanal xabarini yangilashda xatolik:', err.message);
      }
    });

    bot.action('channel_ping', async (ctx) => {
      await ctx.answerCbQuery('⚡️ Kanal integratsiyasi muvaffaqiyatli ishlamoqda!');
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

/**
 * Buyurtma uchun Telegram kanali xabari va interaktiv tugmalarini yasash
 */
function buildChannelOrderPayload(orderId, updatedBy = null) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const user = order.user_id ? db.prepare('SELECT * FROM users WHERE id = ?').get(order.user_id) : null;
  const courier = order.courier_id ? db.prepare('SELECT * FROM couriers WHERE id = ?').get(order.courier_id) : null;

  const statusIcons = {
    pending: '⏳ KUTILMOQDA (YANGI)',
    accepted: '👨‍🍳 OSHXONADA TAYYORLANMOQDA',
    on_the_way: '🚗 KURYER YO\'LDA (YETKAZILMOQDA)',
    completed: '✅ MUVAFFAQIYATLI YETKAZILDI',
    cancelled: '❌ BEKOR QILINDI'
  };

  const statusTitle = statusIcons[order.status] || (order.status || '').toUpperCase();
  const orderTypeText = order.order_type === 'delivery' ? '🚗 Yetkazib berish (Dostavka)' : '🏃 Olib ketish (Samovivoz)';
  const paymentText = order.payment_method === 'cash' ? '💵 Naqd pul' : (order.payment_method === 'card' ? '💳 Karta orqali' : '📱 Click / Payme');

  let itemsHtml = '';
  items.forEach((item, idx) => {
    const itemTotal = Number(item.quantity * item.price);
    itemsHtml += `  <b>${idx + 1}.</b> ${escapeHtml(item.product_name)} — ${item.quantity} x ${Number(item.price).toLocaleString()} = <b>${itemTotal.toLocaleString()} so'm</b>\n`;
  });

  const clientName = escapeHtml(order.customer_name || user?.first_name || 'Noma\'lum');
  const clientPhone = order.customer_phone || user?.phone || '';
  const username = user?.username ? `@${escapeHtml(user.username)}` : '';

  let text = `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n`;
  text += `<b>${statusTitle}</b>\n`;
  text += `<b>━━━━━━━━━━━━━━━━━━━━━</b>\n\n`;
  text += `🧾 <b>Buyurtma kodi:</b> <code>#${order.id}</code>\n`;
  text += `👤 <b>Mijoz:</b> <b>${clientName}</b> ${username}\n`;
  if (clientPhone) {
    text += `📞 <b>Telefon:</b> <code>${escapeHtml(clientPhone)}</code>\n`;
  }
  text += `📦 <b>Buyurtma turi:</b> ${orderTypeText}\n`;
  if (order.address) {
    text += `📍 <b>Manzil:</b> ${escapeHtml(order.address)}\n`;
  }
  text += `💳 <b>To'lov usuli:</b> ${paymentText}\n`;

  if (courier) {
    text += `🚴 <b>Biriktirilgan kuryer:</b> <b>${escapeHtml(courier.first_name || 'Kuryer')}</b> (${escapeHtml(courier.phone || '')})\n`;
  }

  if (order.notes) {
    text += `📝 <b>Mijoz izohi:</b> <i>${escapeHtml(order.notes)}</i>\n`;
  }

  text += `\n🛒 <b>Taomlar tarkibi:</b>\n${itemsHtml}\n`;
  text += `💰 <b>JAMI TO'LOV:</b> <b>${Number(order.total_amount || 0).toLocaleString()} SO'M</b>\n`;
  text += `🕒 <b>Vaqt:</b> ${new Date(order.created_at).toLocaleTimeString('uz-UZ')}\n`;

  if (updatedBy) {
    text += `🔄 <b>Oxirgi o'zgarish:</b> <i>${escapeHtml(updatedBy)}</i>\n`;
  }

  text += `\n<i>⚡️ Samira Fast Food • Admin Panel & Kanal to'liq sinxron</i>`;

  // Interaktiv tugmalar
  let keyboard = [];
  const cleanPhone = clientPhone.replace(/\D/g, '');

  if (order.status === 'pending') {
    keyboard.push([
      Markup.button.callback('👨‍🍳 Qabul qilish', `order_status:${order.id}:accepted`),
      Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)
    ]);
  } else if (order.status === 'accepted') {
    keyboard.push([
      Markup.button.callback('🚗 Kuryerga berish', `order_status:${order.id}:on_the_way`),
      Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)
    ]);
  } else if (order.status === 'on_the_way') {
    keyboard.push([
      Markup.button.callback('✅ Yetkazildi deb belgilash', `order_status:${order.id}:completed`),
      Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)
    ]);
  }

  const secondaryRow = [];
  if (user?.username) {
    secondaryRow.push(Markup.button.url('💬 Telegram', `https://t.me/${user.username.replace(/^@/, '')}`));
  } else if (cleanPhone) {
    secondaryRow.push(Markup.button.url('📞 Telegram', `https://t.me/+${cleanPhone}`));
  }
  if (order.latitude && order.longitude) {
    secondaryRow.push(Markup.button.url('📍 Xarita', `https://maps.google.com/?q=${order.latitude},${order.longitude}`));
  }
  if (secondaryRow.length > 0) {
    keyboard.push(secondaryRow);
  }

  return { text, keyboard };
}

/**
 * Oshxona / Boshqaruv kanaliga buyurtma yuborish
 */
async function sendOrderToChannel(orderId, updatedBy = null) {
  if (!bot) return false;

  const channelSetting = db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  const channelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelSetting ? channelSetting.value : null) || '').trim();

  if (!channelId) {
    console.log('⚠️ Buyurtma kanal ID si (.env yoki Sozlamalarda) belgilanmagan.');
    return false;
  }

  const payload = buildChannelOrderPayload(orderId, updatedBy);
  if (!payload) return false;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  try {
    const sentMsg = await bot.telegram.sendMessage(channelId, payload.text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard(payload.keyboard)
    });

    db.prepare('UPDATE orders SET channel_message_id = ? WHERE id = ?').run(sentMsg.message_id, orderId);

    if (order.latitude && order.longitude) {
      await bot.telegram.sendLocation(channelId, order.latitude, order.longitude).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('Kanalga buyurtma yuborishda xatolik:', err.message);
    return false;
  }
}

/**
 * Admin Panel yoki botdan status o'zgarganda kanaldagi xabarni avtomatik yangilash
 */
async function updateChannelOrderMessage(orderId, updatedBy = 'Admin Panel') {
  if (!bot) return false;

  const channelSetting = db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  const channelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelSetting ? channelSetting.value : null) || '').trim();

  if (!channelId) return false;

  const payload = buildChannelOrderPayload(orderId, updatedBy);
  if (!payload) return false;

  const order = db.prepare('SELECT channel_message_id FROM orders WHERE id = ?').get(orderId);

  if (order && order.channel_message_id) {
    try {
      await bot.telegram.editMessageText(
        channelId,
        order.channel_message_id,
        null,
        payload.text,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...Markup.inlineKeyboard(payload.keyboard)
        }
      );
      return true;
    } catch (err) {
      if (err.message && err.message.includes('message is not modified')) {
        return true;
      }
      console.warn('editMessageText xatosi, yangi xabar yuborishga urinilmoqda:', err.message);
    }
  }

  // Agar xabar avval bormagan bo'lsa yoki tahrirlab bo'lmasa — yangidan jo'natamiz
  return await sendOrderToChannel(orderId, updatedBy);
}

/**
 * Kanal integratsiyasini tekshirish uchun sinov xabari yuborish
 */
async function sendTestMessageToChannel(customChannelId = null) {
  if (!bot) throw new Error("Bot ishga tushmagan yoki Telegram bot token kiritilmagan");

  const channelSetting = db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  const targetChannel = (customChannelId || process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelSetting ? channelSetting.value : null) || '').trim();

  if (!targetChannel) {
    throw new Error("Telegram kanal ID yoki username kiritilmagan");
  }

  const testText = `⚡️ <b>"SAMIRA FAST FOOD" BUYURTMALAR KANALI INTEGRATSIYASI</b>\n\n` +
    `✅ <b>Aloqa muvaffaqiyatli o'rnatildi!</b>\n` +
    `Ushbu kanal endi Admin Panel bilan to'liq 2 tomonlama sinxronizatsiya qilindi.\n\n` +
    `📌 <b>Afzalliklar:</b>\n` +
    `• Barcha yangi buyurtmalar darhol ushbu kanalga keladi\n` +
    `• Admin panelda qabul qilinganda / o'zgartirilganda kanaldagi xabar real-vaqtda yangilanadi\n` +
    `• Kanaldagi tugmalar ("👨‍🍳 Qabul qilish", "🚗 Kuryerga berish") bosilganda Admin Panel va mijoz botiga aks etadi\n\n` +
    `🕒 <i>Tekshiruv vaqti: ${new Date().toLocaleString('uz-UZ')}</i>`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('✅ Integratsiya faol', 'channel_ping')]
  ]);

  const sent = await bot.telegram.sendMessage(targetChannel, testText, {
    parse_mode: 'HTML',
    ...keyboard
  });

  return { success: true, messageId: sent.message_id, channel: targetChannel };
}

/**
 * Mijozga Telegram orqali rasmiy tanbeh (ogohlantirish) yuborish
 */
async function sendWarningToUser(telegramId, reason) {
  if (!bot) return false;
  try {
    const text = `⚠️ <b>OGOHLANTIRISH (Tanbeh)</b>\n\n` +
      `Hurmatli mijoz, sizga restoran ma'muriyati tomonidan rasmiy ogohlantirish (tanbeh) berildi.\n\n` +
      `📌 <b>Sababi:</b> <i>${escapeHtml(reason)}</i>\n\n` +
      `Iltimos, xizmatdan to'g'ri foydalanish qoidalariga rioya qiling. Qayta qoidabuzarlik botdan butunlay bloklanishingizga olib kelishi mumkin!\n\n` +
      `📞 Ma'muriyat: +998 70 219 55 55`;

    await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML' });
    return true;
  } catch (err) {
    console.error('sendWarningToUser xatoligi:', err.message);
    return false;
  }
}

/**
 * Mijozga bloklanganligi yoki blokdan chiqarilganligi haqida xabar yuborish
 */
async function sendBlockStatusToUser(telegramId, isBlocked) {
  if (!bot) return false;
  try {
    let text = '';
    if (isBlocked) {
      text = `🚫 <b>SIZNING HISOBINGIZ BLOKLANDI!</b>\n\n` +
        `Qoidalarni buzganingiz sababli "Samira Fast Food" botidan va xizmatlaridan chetlatildingiz.\n` +
        `Sizga buyurtma berish imkoniyati cheklangan.\n\n` +
        `📞 Ma'muriyat bilan bog'lanish: +998 70 219 55 55`;
    } else {
      text = `✅ <b>HISOBINGIZ BLOKDAN CHIQARILDI!</b>\n\n` +
        `Siz yana "Samira Fast Food" botidan to'liq foydalanishingiz va taomlar buyurtma berishingiz mumkin. Xush kelibsiz! 🍔`;
    }

    await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML' });
    return true;
  } catch (err) {
    console.error('sendBlockStatusToUser xatoligi:', err.message);
    return false;
  }
}

/**
 * Buyurtma bekor qilinganda kanal va mijozga bildirishnoma yuborish
 */
async function notifyOrderCancelled(orderId, reason = '') {
  if (!bot) return false;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return false;

    // Kanal xabarini yangilash
    const channelIdSetting = db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
    const channelId = channelIdSetting?.value;
    if (channelId && order.channel_message_id) {
      try {
        await bot.telegram.editMessageText(
          channelId,
          order.channel_message_id,
          null,
          `❌ *BUYURTMA BEKOR QILINDI #${order.id}*\n\n` +
          `👤 Mijoz: ${order.customer_name || 'Noma\'lum'}\n` +
          `📞 Tel: ${order.customer_phone || ''}\n` +
          `💰 Summa: ${Number(order.total_amount || 0).toLocaleString()} so'm\n` +
          (reason ? `⚠️ Sabab: ${reason}\n` : '') +
          `🕒 Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    }

    // Mijozning o'ziga bildirishnoma yuborish
    const targetTgId = order.telegram_id || (order.user_id ? db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(order.user_id)?.telegram_id : null);
    if (targetTgId) {
      try {
        await bot.telegram.sendMessage(
          targetTgId,
          `❌ <b>Sizning #${order.id} raqamli buyurtmangiz bekor qilindi</b>\n\n` +
          (reason ? `📌 Sabab: <i>${escapeHtml(reason)}</i>\n\n` : '') +
          `Qo'shimcha savollar bo'lsa, ma'muriyat bilan bog'laning: +998 70 219 55 55`,
          { parse_mode: 'HTML' }
        );
      } catch (e) {}
    }
    return true;
  } catch (err) {
    console.error('notifyOrderCancelled xatoligi:', err.message);
    return false;
  }
}

module.exports = { 
  initBot, 
  sendOrderToChannel, 
  updateChannelOrderMessage,
  sendTestMessageToChannel,
  sendWarningToUser,
  sendBlockStatusToUser,
  notifyOrderCancelled,
  backupUsersToChannel, 
  restoreUsersFromChannel,
  uploadImageToTelegram,
  restoreMissingProductImages,
  getBot: () => bot 
};
