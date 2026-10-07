const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const db = require('../db');
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
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Foydalanuvchiga yuborilgan telefon so'rash xabarlarini tozalash uchun kesh
const userPhonePromptMap = new Map();

// Mijoz uchun xush kelibsiz banner ma'lumotlari (matn va tugmalar)
async function getWelcomeCardData(from) {
  const dbUser = await db.prepare('SELECT id, phone FROM users WHERE telegram_id = ?').get(from.id);
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
      [Markup.button.url('🍔 Menyu va Buyurtma berish', fullAppUrl)],
      [Markup.button.callback('ℹ️ Biz haqimizda', 'about_us')]
    ];
  }

  const text =
    `Assalomu alaykum, <b>${firstName}</b>! 🍔🔥\n\n` +
    `<b>"Samira Fast Food"</b> rasmiy botiga xush kelibsiz!\n\n` +
    `Bu yerda siz mazali taomlarimizni ko'rishingiz va oson buyurtma berishingiz mumkin.\n\n` +
    `👇 <b>Buyurtma berish uchun quyidagi tugmani bosing:</b>`;

  return { text, keyboard };
}

// Biz haqimizda ma'lumotlari (2-rasmdagi xabar matni va tugmalari)
function getAboutUsData(from) {
  const miniAppUrl = (process.env.TELEGRAM_MINI_APP_URL || process.env.MINI_APP_URL || '').trim();
  const hasHttps = miniAppUrl.startsWith('https://');

  const userParams = new URLSearchParams();
  userParams.set('tg_id', String(from.id));
  if (from.first_name) userParams.set('tg_first_name', from.first_name);
  if (from.last_name) userParams.set('tg_last_name', from.last_name);
  if (from.username) userParams.set('tg_username', from.username);

  const sep = miniAppUrl.includes('?') ? '&' : '?';
  const fullAppUrl = `${miniAppUrl}${sep}${userParams.toString()}`;

  let aboutKeyboard = [];
  if (hasHttps) {
    aboutKeyboard = [
      [Markup.button.webApp('🍔 Menyu va Buyurtma berish', fullAppUrl)],
      [Markup.button.callback('⬅️ Orqaga', 'back_to_welcome')]
    ];
  } else {
    aboutKeyboard = [
      [Markup.button.url('🍔 Menyu va Buyurtma berish', fullAppUrl)],
      [Markup.button.callback('⬅️ Orqaga', 'back_to_welcome')]
    ];
  }

  const aboutText =
    `<b>SAMIRA FAST FOOD 🍔🍕🥤</b>\n\n` +
    `<i>Eng mazali va to'yimli fast food taomlari faqat bizda!</i>\n\n` +
    `Har kuni yangi masalliqlar, maxsus souslar va unutilmas ta'm sizni kutmoqda.\n\n` +
    `📍 <b>Manzil:</b> Qashqadaryo viloyati, G'uzor tumani, Mustaqillik ko'chasi 45-uy\n` +
    `⏰ <b>Ish vaqti:</b> 09:00 dan 23:00 gacha\n` +
    `📞 <b>Aloqa:</b> +998 70 219 55 55\n\n` +
    `🚀 TEZKOR DOSTAVKA 🚙\n` +
    `📸 Instagram: @samirakafe`;

  return { aboutText, aboutKeyboard };
}

// Mijoz uchun asosiy xush kelibsiz bannerini chiqarish
async function sendWelcomeCard(ctx, from) {
  const { text, keyboard } = await getWelcomeCardData(from);
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

    // Bloklangan foydalanuvchilarni botdan cheklash middleware'i
    bot.use(async (ctx, next) => {
      const from = ctx.from;
      if (!from) return next();
      try {
        const u = await db.prepare('SELECT is_blocked FROM users WHERE telegram_id = ?').get(from.id);
        if (u && Number(u.is_blocked) === 1) {
          if (ctx.callbackQuery) {
            await ctx.answerCbQuery('⛔️ Siz ushbu botdan bloklangansiz!', { show_alert: true }).catch(() => {});
          }
          return ctx.reply(
            '⛔️ <b>Kechirasiz, siz botdan bloklangansiz!</b>\n\n' +
            'Buyurtma berish imkoniyatingiz to\'xtatilgan. Savollar bo\'yicha restoran ma\'muriyati bilan bog\'laning:\n' +
            '📞 +998 70 219 55 55',
            { parse_mode: 'HTML' }
          );
        }
      } catch (err) {
        console.error('Bloklanganlik tekshiruvi xatosi:', err.message);
      }
      return next();
    });

    // /start buyrug'i
    bot.start(async (ctx) => {
      try {
        const from = ctx.from;
        if (!from) return;

        // Foydalanuvchini har /start da UPSERT qilish: ism/username yangilanadi
        await db.prepare(`
          INSERT INTO users (telegram_id, first_name, last_name, username)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(telegram_id) DO UPDATE SET
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            username = excluded.username
        `).run(from.id, from.first_name || '', from.last_name || '', from.username || '');

        const text = ctx.message?.text || '';
        const payload = ctx.startPayload || (text.includes(' ') ? text.split(' ')[1] : '');
        const miniAppUrl = (process.env.TELEGRAM_MINI_APP_URL || process.env.MINI_APP_URL || '').trim();
        const hasHttps = miniAppUrl.startsWith('https://');

        // ==========================================
        // 1. KURYER TAKLIF HAVOLASI ORQALI KIRGANDA
        // ==========================================
        if (payload && payload.startsWith('courier_')) {
          const token = payload.replace('courier_', '').trim();
          const invite = await db.prepare('SELECT * FROM courier_invites WHERE token = ?').get(token);

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
          const existingCourier = await db.prepare('SELECT * FROM couriers WHERE telegram_id = ?').get(from.id);
          if (!existingCourier) {
            await db.prepare(`
              INSERT INTO couriers (telegram_id, first_name, last_name, username, phone, status, is_online)
              VALUES (?, ?, ?, ?, ?, 'active', 1)
            `).run(from.id, from.first_name || '', from.last_name || '', from.username || '', '');
          } else {
            await db.prepare(`
              UPDATE couriers
              SET status = 'active', first_name = ?, last_name = ?, username = ?
              WHERE telegram_id = ?
            `).run(from.first_name || '', from.last_name || '', from.username || '', from.id);
          }

          // Tokenni ishlatilgan deb belgilash
          await db.prepare('UPDATE courier_invites SET is_used = 1, used_by = ? WHERE id = ?').run(from.id, invite.id);

          const courierUrl = getCourierUrl();
          const courierHasHttps = courierUrl.startsWith('https://');

          let courierKeyboard = [];
          if (courierHasHttps) {
            courierKeyboard = [
              [Markup.button.webApp('🚴 Kuryer Ishchi Panelini ochish', courierUrl)],
              [Markup.button.callback('ℹ️ Kuryer Yo\'riqnomasi', 'courier_info')]
            ];
          } else {
            courierKeyboard = [
              [Markup.button.url('🚴 Kuryer Ishchi Panelini ochish', courierUrl)],
              [Markup.button.callback('ℹ️ Kuryer Yo\'riqnomasi', 'courier_info')]
            ];
          }

          return ctx.reply(
            `🎉 *Tabriklaymiz, siz "Samira Fast Food" kuryeri sifatida ro'yxatdan o'tdingiz!*\n\n` +
            `👤 Ism: *${from.first_name || ''}*\n` +
            `🆔 Telegram ID: \`${from.id}\`\n\n` +
            `Endi siz yetkazib berish buyurtmalarini qabul qilishingiz va boshqarishingiz mumkin.\n` +
            `Quyidagi tugma orqali o'z ishchi panelingizga kiring:`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(courierKeyboard)
            }
          );
        }

        // ==========================================
        // 2. MAVJUD KURYER ODDIY /start BOSGANDA
        // ==========================================
        const isCourier = await db.prepare("SELECT * FROM couriers WHERE telegram_id = ? AND status = 'active'").get(from.id);
        if (isCourier) {
          const courierUrl = getCourierUrl();
          const courierHasHttps = courierUrl.startsWith('https://');

          let courierKeyboard = [];
          if (courierHasHttps) {
            courierKeyboard = [
              [Markup.button.webApp('🚴 Kuryer Ishchi Paneli', courierUrl)],
              [Markup.button.callback('🍔 Mijoz Menyusi (Fast Food)', 'show_menu')]
            ];
          } else {
            courierKeyboard = [
              [Markup.button.url('🚴 Kuryer Ishchi Paneli', courierUrl)],
              [Markup.button.callback('🍔 Mijoz Menyusi (Fast Food)', 'show_menu')]
            ];
          }

          return ctx.reply(
            `Assalomu alaykum, kuryer *${from.first_name || ''}*! 🛵💨\n\n` +
            `Sizning kuryerlik profilingiz faol.\n` +
            `Buyurtmalarni ko'rish va yetkazish uchun ishchi panelingizga o'ting:`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(courierKeyboard)
            }
          );
        }

        // ==========================================
        // 3. ODDIY MIJOZ UCHUN (TELEFON RAQAM TEKSHIRUVI)
        // ==========================================
        const dbUser = await db.prepare('SELECT id, phone FROM users WHERE telegram_id = ?').get(from.id);
        const firstName = escapeHtml(from.first_name || 'Hurmatli mijoz');

        // Agar foydalanuvchining telefon raqami bazada yo'q bo'lsa — birinchi navbatda raqam so'raymiz
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

    // Menyu tugmasi bosilganda
    bot.action('show_menu', async (ctx) => {
      await ctx.answerCbQuery().catch(() => {});
      const miniAppUrl = (process.env.MINI_APP_URL || '').trim();
      const prods = await db.prepare('SELECT name, price FROM products WHERE is_available = 1 LIMIT 15').all();
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

    // Biz haqimizda tugmasi
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

    // Orqaga tugmasi
    bot.action('back_to_welcome', async (ctx) => {
      await ctx.answerCbQuery().catch(() => {});
      const from = ctx.from;
      if (!from) return;

      const { text, keyboard } = await getWelcomeCardData(from);

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

    // Kuryer yo'riqnomasi tugmasi
    bot.action(['courier_web', 'courier_info'], async (ctx) => {
      await ctx.answerCbQuery().catch(() => {});
      return ctx.reply(
        `ℹ️ *Kuryer paneli haqida ma'lumot:*\n\n` +
        `1. Ishga chiqishdan oldin panelda statusni *Online* qiling.\n` +
        `2. Yangi buyurtmalar paydo bo'lganda, *"Qabul qilish"* tugmasini bosing.\n` +
        `3. Mijoz manziliga yetib borganingizdan so'ng, mijozga taomni topshiring va *"Yetkazildi"* deb belgilang.\n` +
        `4. Xaritaning lokatsiyasini ko'rish uchun *"Xaritada ochish (Yandex/Google)"* tugmasidan foydalaning.`,
        { parse_mode: 'Markdown' }
      );
    });

    // Kanal xabaridagi inline status tugmalari (Oshpaz / Adminlar bosganda)
    bot.action(/^order_status:(\d+):(.+)$/, async (ctx) => {
      const orderId = parseInt(ctx.match[1]);
      const newStatus = ctx.match[2];

      const validStatuses = ['accepted', 'ready', 'on_the_way', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        try {
          await ctx.answerCbQuery("Noma'lum status!");
        } catch (e) {}
        return;
      }

      const statusMap = {
        pending: '⏳ Kutilmoqda',
        accepted: '👨‍🍳 Qabul qilindi (Tayyorlanmoqda)',
        ready: '🎉 Tayyor (Olib ketishga)',
        on_the_way: '🛵 Kuryerga berildi (Yo\'lda)',
        completed: '✅ Yakunlandi (Topshirildi)',
        cancelled: '❌ Bekor qilindi'
      };

      try {
        const actorName = ctx.from ? (ctx.from.username ? `@${ctx.from.username}` : ([ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || 'Admin')) : 'Telegram Kanal';

        if (newStatus === 'cancelled') {
          const cancelBy = `Telegram Kanal (${actorName})`;
          const cancelReason = `Telegram kanali orqali bekor qilindi (${actorName})`;
          await db.prepare('UPDATE orders SET status = ?, cancelled_by = ?, cancel_reason = ? WHERE id = ?').run(newStatus, cancelBy, cancelReason, orderId);
          await notifyOrderCancelled(orderId, cancelReason, cancelBy);
          await updateChannelOrderMessage(orderId, `Kanal (${actorName}) bekor qildi`);
        } else {
          await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, orderId);
          await updateChannelOrderMessage(orderId, `Kanal (${actorName})`);
        }

        await ctx.answerCbQuery(`Holat o'zgardi: ${statusMap[newStatus]}`);

        const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (order && (order.telegram_id || order.user_id)) {
          const userRow = order.user_id ? await db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(order.user_id) : null;
          const targetTgId = order.telegram_id || userRow?.telegram_id;
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

    // Foydalanuvchi "Telefon raqamni yuborish" tugmasini bossa — raqamni bazaga saqlash
    bot.on('contact', async (ctx) => {
      try {
        const msg = ctx.message;
        if (!msg || !msg.contact) return;
        const contact = msg.contact;

        let cleanPhone = contact.phone_number.trim();
        if (!cleanPhone.startsWith('+')) {
          cleanPhone = '+' + cleanPhone;
        }

        // Baza foydalanuvchisini yangilash / yaratish
        const existing = await db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(ctx.from.id);
        if (existing) {
          await db.prepare('UPDATE users SET phone = ?, first_name = ?, last_name = ?, username = ? WHERE telegram_id = ?')
            .run(cleanPhone, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', ctx.from.id);
        } else {
          await db.prepare('INSERT INTO users (telegram_id, first_name, last_name, username, phone) VALUES (?, ?, ?, ?, ?)')
            .run(ctx.from.id, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', cleanPhone);
        }

        // Reply keyboard ni o'chirish
        await ctx.reply('✅ Rahmat, telefon raqamingiz muvaffaqiyatli saqlandi!', {
          reply_markup: { remove_keyboard: true }
        });

        // Xush kelibsiz bannerini chiqarish
        await sendWelcomeCard(ctx, ctx.from);
      } catch (err) {
        console.error('Kontaktni saqlashda xatolik:', err.message);
        ctx.reply('Telefon raqamini saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      }
    });

    // Foydalanuvchi telefon raqamini matn sifatida yozsa ham qabul qilish (masalan: +998901234567 yoki 901234567)
    bot.hears(/^(\+?998|8)?\s?\(?\d{2}\)?\s?\d{3}\s?\d{2}\s?\d{2}$/, async (ctx) => {
      try {
        const raw = ctx.message.text.trim();
        let clean = raw.replace(/\D/g, '');
        if (clean.length === 9) {
          clean = '998' + clean;
        }
        if (!clean.startsWith('998')) {
          return;
        }
        const formattedPhone = '+' + clean;

        const existing = await db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(ctx.from.id);
        if (existing) {
          await db.prepare('UPDATE users SET phone = ?, first_name = ?, last_name = ?, username = ? WHERE telegram_id = ?')
            .run(formattedPhone, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', ctx.from.id);
        } else {
          await db.prepare('INSERT INTO users (telegram_id, first_name, last_name, username, phone) VALUES (?, ?, ?, ?, ?)')
            .run(ctx.from.id, ctx.from.first_name || '', ctx.from.last_name || '', ctx.from.username || '', formattedPhone);
        }

        await ctx.reply('✅ Rahmat, telefon raqamingiz qabul qilindi!', {
          reply_markup: { remove_keyboard: true }
        });

        await sendWelcomeCard(ctx, ctx.from);
      } catch (err) {
        console.error('Matnli telefonni saqlash xatosi:', err.message);
      }
    });

    // Global xatoliklarni tutib olish
    bot.catch((err, ctx) => {
      console.error(`Telegram Bot xatoligi (${ctx.updateType}):`, err);
    });

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
 * Kanalga yuboriladigan buyurtma xabari matni va inline tugmalarini yig'uvchi yordamchi funksiya
 */
async function buildChannelOrderPayload(orderId, updatedBy = null) {
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;

  const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const user = order.user_id ? await db.prepare('SELECT * FROM users WHERE id = ?').get(order.user_id) : null;
  const courier = order.courier_id ? await db.prepare('SELECT * FROM couriers WHERE id = ?').get(order.courier_id) : null;

  const isDelivery = order.order_type === 'delivery';
  const statusIcons = {
    pending: '⏳ KUTILMOQDA (YANGI)',
    accepted: '👨‍🍳 OSHXONADA TAYYORLANMOQDA',
    ready: '🎉 TAYYOR (OLIB KETISHGA)',
    on_the_way: '🛵 KURYER YO\'LDA (YETKAZILMOQDA)',
    completed: isDelivery ? '✅ MUVAFFAQIYATLI YETKAZILDI' : '✅ MIJOZ OLIB KETDI (TOPSHIRILDI)',
    cancelled: '❌ BEKOR QILINDI'
  };

  const statusTitle = statusIcons[order.status] || (order.status || '').toUpperCase();
  const orderTypeText = isDelivery ? '🚗 Yetkazib berish (Dostavka)' : '🏃 Olib ketish (Samovivoz)';
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
  if (isDelivery && order.address) {
    const isLiveGps = (order.location_source === 'live_gps') || Boolean(order.latitude && order.longitude);
    const sourceLabel = isLiveGps ? '📱 Lokatsiyani yuborish bosilgan' : '✍️ Qo\'lda yozilgan';
    text += `📍 <b>Manzil:</b> ${escapeHtml(order.address)} (<i>${sourceLabel}</i>)\n`;
  } else if (!isDelivery) {
    text += `📍 <b>Manzil:</b> 🏪 Restorandan olib ketish (<i>Kuryer talab etilmaydi</i>)\n`;
  }
  text += `💳 <b>To'lov usuli:</b> ${paymentText}\n`;

  if (courier) {
    text += `🚴 <b>Biriktirilgan kuryer:</b> <b>${escapeHtml(courier.first_name || 'Kuryer')}</b> (${escapeHtml(courier.phone || '')})\n`;
  }

  if (order.notes) {
    text += `📝 <b>Mijoz izohi:</b> <i>${escapeHtml(order.notes)}</i>\n`;
  }

  text += `\n🛒 <b>Taomlar tarkibi:</b>\n${itemsHtml}\n`;
  text += `💰 <b>Jami summa:</b> <b>${Number(order.total_amount).toLocaleString()} so'm</b>\n`;

  const dateStr = new Date(order.created_at).toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    hour12: false
  });
  text += `🕒 <b>Vaqti:</b> <code>${dateStr}</code>\n`;

  if (updatedBy) {
    text += `\n🔄 <i>Oxirgi yangilanish: ${escapeHtml(updatedBy)}</i>\n`;
  }

  let keyboard = [];
  if (order.status === 'pending') {
    keyboard = [
      [
        Markup.button.callback('👨‍🍳 Qabul qilish (Oshxona)', `order_status:${order.id}:accepted`),
        Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)
      ]
    ];
  } else if (order.status === 'accepted') {
    if (isDelivery) {
      keyboard = [
        [
          Markup.button.callback('🛵 Kuryerga berish', `order_status:${order.id}:on_the_way`),
          Markup.button.callback('✅ Yetkazildi', `order_status:${order.id}:completed`)
        ],
        [Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)]
      ];
    } else {
      keyboard = [
        [
          Markup.button.callback('🎉 Tayyor (Olib ketishga)', `order_status:${order.id}:ready`),
          Markup.button.callback('✅ Topshirildi', `order_status:${order.id}:completed`)
        ],
        [Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)]
      ];
    }
  } else if (order.status === 'ready') {
    keyboard = [
      [
        Markup.button.callback('✅ Topshirildi (Mijoz oldi)', `order_status:${order.id}:completed`),
        Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)
      ]
    ];
  } else if (order.status === 'on_the_way') {
    keyboard = [
      [
        Markup.button.callback('✅ Yetkazildi deb belgilash', `order_status:${order.id}:completed`),
        Markup.button.callback('❌ Bekor qilish', `order_status:${order.id}:cancelled`)
      ]
    ];
  } else {
    keyboard = [
      [Markup.button.callback(`ℹ️ Holat: ${statusTitle}`, 'channel_ping')]
    ];
  }

  return { text, keyboard };
}

/**
 * Oshxona / Boshqaruv kanaliga buyurtma yuborish
 */
async function sendOrderToChannel(orderId, updatedBy = null) {
  if (!bot) return false;

  const channelSetting = await db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  const channelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelSetting ? channelSetting.value : null) || '').trim();

  if (!channelId) {
    console.log('⚠️ Buyurtma kanal ID si (.env yoki Sozlamalarda) belgilanmagan.');
    return false;
  }

  const payload = await buildChannelOrderPayload(orderId, updatedBy);
  if (!payload) return false;

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  try {
    const sentMsg = await bot.telegram.sendMessage(channelId, payload.text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard(payload.keyboard)
    });

    await db.prepare('UPDATE orders SET channel_message_id = ? WHERE id = ?').run(sentMsg.message_id, orderId);

    if (order && order.latitude && order.longitude) {
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

  const channelSetting = await db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  const channelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelSetting ? channelSetting.value : null) || '').trim();

  if (!channelId) return false;

  const payload = await buildChannelOrderPayload(orderId, updatedBy);
  if (!payload) return false;

  const order = await db.prepare('SELECT channel_message_id FROM orders WHERE id = ?').get(orderId);

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

  // Agar edit o'xshamasa yangi xabar yuborish
  try {
    const sent = await bot.telegram.sendMessage(channelId, payload.text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard(payload.keyboard)
    });
    await db.prepare('UPDATE orders SET channel_message_id = ? WHERE id = ?').run(sent.message_id, orderId);
    return true;
  } catch (e) {
    console.error('Kanal xabarini yangilash xatosi:', e.message);
    return false;
  }
}

/**
 * Kanalga test xabar yuborish
 */
async function sendTestMessageToChannel(targetChannel = null) {
  if (!bot) {
    return { success: false, error: 'Telegram Bot ishga tushmagan (Tokenni tekshiring)' };
  }

  const channelSetting = await db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
  const finalChannel = (targetChannel || process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelSetting ? channelSetting.value : null) || '').trim();

  if (!finalChannel) {
    return { success: false, error: 'Kanal ID si kiritilmagan' };
  }

  try {
    const testText =
      `🔔 <b>SAMIRA FAST FOOD — KANAL ALOQASI TEKSHIRUVI</b>\n\n` +
      `✅ Telegram kanal muvaffaqiyatli ulandi!\n` +
      `Barcha yangi buyurtmalar ushbu kanalga avtomatik tarzda kelib tushadi.\n\n` +
      `🕒 <i>Vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</i>`;

    const sent = await bot.telegram.sendMessage(finalChannel, testText, {
      parse_mode: 'HTML'
    });

    return {
      success: true,
      message: 'Kanalga test xabar yuborildi!',
      message_id: sent.message_id,
      channel: finalChannel
    };
  } catch (err) {
    console.error('sendTestMessageToChannel xatoligi:', err.message);
    return {
      success: false,
      error: `Kanalga xabar yuborib bo'lmadi: ${err.message}. Bot kanalga ADMIN qilib qo'shilganligiga ishonch hosil qiling!`
    };
  }
}

/**
 * Foydalanuvchiga ogohlantirish (tanbeh) yuborish
 */
async function sendWarningToUser(telegramId, reason) {
  if (!bot || !telegramId) return false;
  try {
    const text =
      `⚠️ <b>DIQQAT, OGOHLANTIRISH!</b>\n\n` +
      `Hurmatli mijoz, administrator tomonidan sizga ogohlantirish berildi.\n\n` +
      `📝 <b>Sabab:</b> <i>${escapeHtml(reason || "Qoidabuzarlik")}</i>\n\n` +
      `Iltimos, soxta buyurtma bermang yoki restoran qoidalariga rioya qiling. ` +
      `Qayta takrorlansa, profilingiz botdan butunlay bloklanadi!`;

    await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML' });
    return true;
  } catch (err) {
    console.warn(`sendWarningToUser (${telegramId}) xatolik:`, err.message);
    return false;
  }
}

/**
 * Foydalanuvchiga blok/blokdan chiqarish xabari
 */
async function sendBlockStatusToUser(telegramId, isBlocked) {
  if (!bot || !telegramId) return false;
  try {
    let text = '';
    if (isBlocked) {
      text =
        `⛔️ <b>SIZNING PROFILINGIZ BLOKLANDI!</b>\n\n` +
        `Siz restoran qoidalarini buzganingiz sababli botdan chetlatildingiz. ` +
        `Endi buyurtma bera olmaysiz.\n\n` +
        `Savollar bo'yicha ma'muriyat: 📞 +998 70 219 55 55`;
    } else {
      text =
        `✅ <b>PROFILINGIZ BLOKDAN CHIQARILDI!</b>\n\n` +
        `Siz yana "Samira Fast Food" botidan buyurtma berishingiz mumkin. Xush kelibsiz! 🎉`;
    }

    await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML' });
    return true;
  } catch (err) {
    console.warn(`sendBlockStatusToUser (${telegramId}) xatolik:`, err.message);
    return false;
  }
}

/**
 * Buyurtma bekor qilinganda xabar berish
 */
async function notifyOrderCancelled(orderId, reason = null, cancelledBy = null) {
  if (!bot) return false;
  try {
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return false;

    const cancelReasonText = reason || order.cancel_reason || "Sabab ko'rsatilmadi";
    const cancelByText = cancelledBy || order.cancelled_by || "Admin yoki Mijoz";

    // 1. Kanaldagi xabarni yangilash
    const channelIdSetting = await db.prepare("SELECT value FROM settings WHERE key = 'channel_id'").get();
    const channelId = (process.env.TELEGRAM_ORDERS_CHANNEL_ID || (channelIdSetting ? channelIdSetting.value : null) || '').trim();

    if (channelId && order.channel_message_id) {
      try {
        await bot.telegram.editMessageText(
          channelId,
          order.channel_message_id,
          null,
          `❌ <b>BEKOR QILINDI — BUYURTMA #${order.id}</b>\n\n` +
          `👤 <b>Mijoz:</b> ${escapeHtml(order.customer_name || 'Noma\'lum')}\n` +
          `📞 <b>Telefon:</b> ${escapeHtml(order.customer_phone || '')}\n` +
          `🚫 <b>Bekor qildi:</b> <b>${escapeHtml(cancelByText)}</b>\n` +
          `📝 <b>Sabab:</b> <i>${escapeHtml(cancelReasonText)}</i>\n` +
          `💰 <b>Summa:</b> ${Number(order.total_amount).toLocaleString()} so'm\n\n` +
          `🕒 <i>Vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</i>`,
          { parse_mode: 'HTML' }
        );
      } catch (err) {
        console.warn('Kanaldagi bekor qilish xabarini edit qilishda xato:', err.message);
      }
    }

    // 2. Agar Telegram orqali kirgan mijoz bo'lsa — unga ham xabar yuborish
    const userRow = order.user_id ? await db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(order.user_id) : null;
    const targetTgId = order.telegram_id || userRow?.telegram_id;
    if (targetTgId) {
      try {
        sendStickerToChat(
          bot.telegram,
          targetTgId,
          'cross',
          `❌ <b>Buyurtmangiz bekor qilindi</b>\n\n` +
          `📦 Buyurtma raqami: <b>#${order.id}</b>\n` +
          `🚫 Bekor qildi: <b>${escapeHtml(cancelByText)}</b>\n` +
          `📝 Sabab: <i>${escapeHtml(cancelReasonText)}</i>\n\n` +
          `Savollaringiz bo'lsa restoran bilan bog'laning:\n📞 +998 70 219 55 55`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      } catch (err) {
        console.warn('Mijozga bekor qilingani haqida xabar berishda xato:', err.message);
      }
    }

    return true;
  } catch (err) {
    console.error('notifyOrderCancelled xatoligi:', err.message);
    return false;
  }
}

/**
 * Barcha mijozlarga ommaviy xabar yuborish (Broadcast)
 */
async function broadcastMessageToUsers(message, imageUrl = null, imagePath = null) {
  if (!bot) {
    throw new Error('Telegram Bot faol emas');
  }

  const users = await db.prepare(`
    SELECT DISTINCT telegram_id FROM users 
    WHERE telegram_id IS NOT NULL AND telegram_id != 0 AND (is_blocked IS NULL OR is_blocked = 0)
  `).all();

  const targetUsers = users.map(u => u.telegram_id).filter(Boolean);

  let sentCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const tgId of targetUsers) {
    try {
      if (imagePath && fs.existsSync(imagePath)) {
        if (message) {
          await bot.telegram.sendPhoto(tgId, { source: imagePath }, {
            caption: message,
            parse_mode: 'HTML'
          });
        } else {
          await bot.telegram.sendPhoto(tgId, { source: imagePath });
        }
      } else if (imageUrl) {
        if (message) {
          await bot.telegram.sendPhoto(tgId, imageUrl, {
            caption: message,
            parse_mode: 'HTML'
          });
        } else {
          await bot.telegram.sendPhoto(tgId, imageUrl);
        }
      } else {
        try {
          await bot.telegram.sendMessage(tgId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: false
          });
        } catch {
          await bot.telegram.sendMessage(tgId, message.replace(/<[^>]*>/g, ''), {
            disable_web_page_preview: false
          });
        }
      }

      sentCount++;
      await new Promise(r => setTimeout(r, 40));
    } catch (err) {
      failedCount++;
      const msg = err && err.message ? err.message : String(err);
      if (msg.includes('blocked') || msg.includes('user is deactivated') || msg.includes('chat not found')) {
        await db.prepare('UPDATE users SET is_blocked = 1 WHERE telegram_id = ?').run(tgId);
      }
      errors.push({ telegram_id: tgId, error: msg });
    }
  }

  return {
    total: targetUsers.length,
    sentCount,
    failedCount,
    errors
  };
}

module.exports = { 
  initBot, 
  sendOrderToChannel, 
  updateChannelOrderMessage, 
  sendTestMessageToChannel, 
  sendWarningToUser, 
  sendBlockStatusToUser, 
  broadcastMessageToUsers, 
  notifyOrderCancelled,
  getBot: () => bot 
};
