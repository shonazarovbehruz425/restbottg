const { Telegraf, Markup } = require('telegraf');
const db = require('../db');
const { backupUsersToChannel, restoreUsersFromChannel, importUsersArray, setBotInstance } = require('./backupService');

let bot = null;

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

        // Foydalanuvchini saqlash (users jadvaliga)
        const checkUser = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(from.id);
        if (!checkUser) {
          db.prepare(`
            INSERT INTO users (telegram_id, first_name, last_name, username)
            VALUES (?, ?, ?, ?)
          `).run(from.id, from.first_name || '', from.last_name || '', from.username || '');
        }

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

          let courierKeyboard = [];
          if (hasHttps) {
            courierKeyboard = [
              [Markup.button.webApp('🚴 Kuryer Ishchi Panelini ochish', miniAppUrl)],
              [Markup.button.webApp('🍔 Mijoz sifatida menyuni ko\'rish', miniAppUrl)]
            ];
          } else {
            courierKeyboard = [
              [Markup.button.callback('🚴 Kuryer Paneli (Web)', 'courier_web')],
              [Markup.button.callback('🍔 Taomlar menyusi', 'show_menu')]
            ];
          }

          return ctx.reply(
            `🎉 *Tabriklaymiz, ${from.first_name || 'Kuryer'}!*\n\nSiz "Lazzat Restoran" tizimida rasmiy *KURYER* sifatida muvaffaqiyatli ro'yxatdan o'tdingiz! 🚴📦\n\nEndi restoranimizdan yetkazib berish buyurtmalari chiqqanda, ularni qabul qilishingiz va xarita orqali yetkazishingiz mumkin.\n\nIshni boshlash uchun quyidagi tugmani bosing:`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(courierKeyboard)
            }
          );
        }

        // ==========================================
        // 2. AGAR FOYDALANUVCHI ALLAQACHON KURYER BO'LSA
        // ==========================================
        const isCourier = db.prepare("SELECT * FROM couriers WHERE telegram_id = ? AND status = 'active'").get(from.id);
        if (isCourier) {
          let courierKeyboard = [];
          if (hasHttps) {
            courierKeyboard = [
              [Markup.button.webApp('🚴 Kuryer Ishchi Paneli', miniAppUrl)],
              [Markup.button.webApp('🍔 Taom buyurtma qilish (Mijoz rejimi)', miniAppUrl)]
            ];
          } else {
            courierKeyboard = [
              [Markup.button.callback('🚴 Kuryer haqida', 'courier_info')],
              [Markup.button.callback('🍔 Taomlar menyusi', 'show_menu')]
            ];
          }

          return ctx.reply(
            `Assalomu alaykum, xush kelibsiz kuryerimiz *${from.first_name || 'Do\'stimiz'}*! 🚴💨\n\nBuyurtmalarni ko'rish va yetkazishni boshlash uchun Kuryer Panelini oching:`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(courierKeyboard)
            }
          );
        }

        // ==========================================
        // 3. ODDIY MIJOZLAR UCHUN STANDARD SALOMLASHISH
        // ==========================================
        let keyboard = [];

        if (hasHttps) {
          keyboard = [
            [Markup.button.webApp('🍔 Menyu va Buyurtma berish', miniAppUrl)],
            [Markup.button.callback('ℹ️ Biz haqimizda', 'about_us')]
          ];
        } else {
          keyboard = [
            [Markup.button.callback('🍔 Taomlar menyusi', 'show_menu')],
            [Markup.button.callback('ℹ️ Biz haqimizda', 'about_us')]
          ];
        }

        await ctx.reply(
          `Assalomu alaykum, *${from.first_name || 'Hurmatli mijoz'}*! 🍽\n\nRestoranimizning botiga xush kelibsiz! Taomlarimiz bilan tanishish uchun quyidagi tugmalardan birini tanlang:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(keyboard)
          }
        );
      } catch (err) {
        console.error('/start xatoligi:', err.message);
      }
    });

    // Menyu tugmasi bosilganda
    bot.action('show_menu', async (ctx) => {
      await ctx.answerCbQuery();
      const miniAppUrl = (process.env.MINI_APP_URL || '').trim();
      const text = miniAppUrl.startsWith('https://') 
        ? 'Menyuni ochish uchun yuqoridagi tugmani bosing.'
        : `🍔 *Bizning Taomlar Menyusi:*\n\n1. Gamburger Klassik — 32,000 so'm\n2. Chizburger Dabl — 42,000 so'm\n3. Lavash Standart — 35,000 so'm\n4. Pizza Pepperoni (32sm) — 65,000 so'm\n5. Osh (Choyxona palov) — 40,000 so'm\n6. Coca-Cola 0.5L — 8,000 so'm\n\n🌐 *Web versiyada ko'rish:* ${miniAppUrl || 'http://localhost:5173'}`;

      return ctx.reply(text, { parse_mode: 'Markdown' });
    });

    // Biz haqimizda tugmasi
    bot.action('about_us', async (ctx) => {
      await ctx.answerCbQuery();
      return ctx.reply(
        '🏢 *Lazzat Restoran*\n\n🕒 Ish vaqti: 09:00 dan 23:00 gacha\n📞 Telefon: +998 90 123-45-67\n📍 Manzil: Toshkent shahar',
        { parse_mode: 'Markdown' }
      );
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
            ctx.telegram.sendMessage(
              user.telegram_id,
              `🔔 *Buyurtmangiz holati yangilandi!*\n\n📦 Buyurtma raqami: #${orderId}\nHolat: *${statusMap[newStatus]}*`,
              { parse_mode: 'Markdown' }
            ).catch(() => {});
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

          // Darhol bazani .js formatda kanalga tashlash!
          await backupUsersToChannel(String(chat.id));
        }
      } catch (err) {
        console.error('my_chat_member xatoligi:', err.message);
      }
    });

    // Kanaldan yoki shaxsiy chatdan .js backup fayl yuborilganda uni o'qib bazaga tiklash (Restore)
    bot.on(['document', 'channel_post'], async (ctx) => {
      try {
        const message = ctx.channelPost || ctx.message;
        if (!message || !message.document) return;

        const doc = message.document;
        if (doc.file_name && doc.file_name.endsWith('.js')) {
          console.log(`📥 Kanaldan/Chatdan .js backup fayli qabul qilindi: ${doc.file_name}`);

          const fileLink = await ctx.telegram.getFileLink(doc.file_id);
          const response = await fetch(fileLink.href);
          const fileText = await response.text();

          // .js fayl ichidagi JSON yoki massivni xavfsiz ajratib olish
          const match = fileText.match(/module\.exports\s*=\s*(\[[\s\S]*?\]);/);
          if (match && match[1]) {
            const usersData = JSON.parse(match[1]);
            const restoredCount = importUsersArray(usersData);
            await ctx.reply(`✅ ${restoredCount} ta foydalanuvchi ma'lumotlar bazasiga muvaffaqiyatli tiklandi!`);
          }
        }
      } catch (err) {
        console.error('Fayldan tiklashda xatolik:', err.message);
      }
    });

    bot.catch((err, ctx) => {
      console.error(`Bot xatoligi (${ctx.updateType}):`, err);
    });

    // Server ishga tushganda avtomatik eski backupdan tiklash
    restoreUsersFromChannel();

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
  getBot: () => bot 
};
