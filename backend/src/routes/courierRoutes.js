const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { getBot } = require('../bot');

let cachedBotUsername = null;

async function getBotUsername() {
  if (cachedBotUsername) return cachedBotUsername;
  const bot = getBot();
  if (!bot) return process.env.TELEGRAM_BOT_USERNAME || '';

  try {
    const me = await bot.telegram.getMe();
    if (me && me.username) {
      cachedBotUsername = me.username;
      return me.username;
    }
  } catch (err) {
    console.error('Bot username olishda xatolik:', err.message);
  }
  return process.env.TELEGRAM_BOT_USERNAME || '';
}

// 1. Yangi Kuryer taklif tokeni va havolasini generatsiya qilish (Admin uchun)
router.post('/generate-invite', async (req, res) => {
  try {
    const token = crypto.randomBytes(6).toString('hex');
    db.prepare('INSERT INTO courier_invites (token, is_used) VALUES (?, 0)').run(token);

    const botUsername = await getBotUsername();
    const invite_url = botUsername ? `https://t.me/${botUsername}?start=courier_${token}` : '';

    res.json({
      success: true,
      token,
      invite_url,
      bot_username: botUsername
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Taklif tokenlari ro'yxati (Admin uchun)
router.get('/invites', (req, res) => {
  try {
    const invites = db.prepare(`
      SELECT ci.*, u.first_name, u.last_name, u.username as used_by_username
      FROM courier_invites ci
      LEFT JOIN users u ON ci.used_by = u.telegram_id
      ORDER BY ci.id DESC
      LIMIT 100
    `).all();
    res.json({ success: true, data: invites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/invites/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM courier_invites WHERE id = ?').run(id);
    res.json({ success: true, message: 'Taklif havolasi o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Kuryerlar ro'yxati (Admin uchun)
router.get('/list', (req, res) => {
  try {
    const couriers = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM orders WHERE courier_id = c.id AND status = 'completed') as completed_orders,
        (SELECT COUNT(*) FROM orders WHERE courier_id = c.id AND status = 'on_the_way') as active_orders
      FROM couriers c
      ORDER BY c.id DESC
    `).all();
    res.json({ success: true, data: couriers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Kuryer statusini o'zgartirish (active / blocked)
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE couriers SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'Kuryer statusi yangilandi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Kuryerni o'chirish
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM couriers WHERE id = ?').run(id);
    res.json({ success: true, message: "Kuryer tizimdan o'chirildi" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Foydalanuvchining kuryer ekanligini tekshirish (Mini App ochilganda)
router.get('/check/:telegram_id', (req, res) => {
  try {
    const { telegram_id } = req.params;
    const courier = db.prepare('SELECT * FROM couriers WHERE telegram_id = ?').get(telegram_id);
    const is_courier = !!(courier && courier.status === 'active');
    res.json({
      success: true,
      is_courier,
      courier: is_courier ? courier : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Kuryer online/offline holatini o'zgartirish
router.post('/toggle-online', (req, res) => {
  try {
    const { telegram_id, courier_id, is_online } = req.body;
    let courier;
    if (courier_id) {
      courier = db.prepare('SELECT * FROM couriers WHERE id = ?').get(courier_id);
    } else if (telegram_id) {
      courier = db.prepare('SELECT * FROM couriers WHERE telegram_id = ?').get(telegram_id);
    }

    if (!courier) {
      return res.status(404).json({ success: false, error: 'Kuryer topilmadi' });
    }

    const newOnline = typeof is_online === 'boolean' ? (is_online ? 1 : 0) : (courier.is_online === 1 ? 0 : 1);
    db.prepare('UPDATE couriers SET is_online = ? WHERE id = ?').run(newOnline, courier.id);

    res.json({ success: true, is_online: newOnline });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Yetkazishga tayyor buyurtmalar ro'yxati (Kuryer Mini App uchun)
router.get('/orders/available', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE order_type = 'delivery'
        AND status IN ('accepted', 'ready')
        AND (courier_id IS NULL OR courier_id = 0)
      ORDER BY id DESC
    `).all();

    const result = orders.map(ord => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
      return { ...ord, items };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Kuryerning ayni damdagi faol (yo'ldagi) buyurtmalari
router.get('/orders/my-active/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let courier = db.prepare('SELECT id FROM couriers WHERE telegram_id = ?').get(identifier);
    if (!courier) {
      courier = db.prepare('SELECT id FROM couriers WHERE id = ?').get(identifier);
    }
    if (!courier) {
      return res.json({ success: true, data: [] });
    }

    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE courier_id = ? AND status = 'on_the_way'
      ORDER BY id DESC
    `).all(courier.id);

    const result = orders.map(ord => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
      return { ...ord, items };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Kuryerning yetkazilgan buyurtmalari tarixi va statistikasi
router.get('/orders/my-history/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let courier = db.prepare('SELECT id FROM couriers WHERE telegram_id = ?').get(identifier);
    if (!courier) {
      courier = db.prepare('SELECT id FROM couriers WHERE id = ?').get(identifier);
    }
    if (!courier) {
      return res.json({ success: true, data: [], stats: { today_count: 0, total_count: 0, total_amount: 0 } });
    }

    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE courier_id = ? AND status = 'completed'
      ORDER BY id DESC
      LIMIT 50
    `).all(courier.id);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE courier_id = ? AND status = 'completed' AND created_at >= ?
    `).get(courier.id, todayStart.toISOString())?.count || 0;

    const totalStats = db.prepare(`
      SELECT COUNT(*) as total_count, COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders
      WHERE courier_id = ? AND status = 'completed'
    `).get(courier.id);

    const result = orders.map(ord => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
      return { ...ord, items };
    });

    res.json({
      success: true,
      data: result,
      stats: {
        today_count: todayCount,
        total_count: totalStats.total_count,
        total_amount: totalStats.total_amount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Kuryer buyurtmani qabul qilishi (yo'lga chiqishi)
router.post('/orders/accept', (req, res) => {
  try {
    const { order_id, telegram_id, courier_id } = req.body;
    let courier;
    if (courier_id) {
      courier = db.prepare('SELECT * FROM couriers WHERE id = ? AND status = \'active\'').get(courier_id);
    } else if (telegram_id) {
      courier = db.prepare('SELECT * FROM couriers WHERE telegram_id = ? AND status = \'active\'').get(telegram_id);
    }
    if (!courier) {
      return res.status(403).json({ success: false, error: 'Kuryer sifatida ruxsatingiz yo\'q' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    }
    if (order.courier_id && order.courier_id !== courier.id) {
      return res.status(400).json({ success: false, error: 'Bu buyurtmani boshqa kuryer qabul qilgan' });
    }

    db.prepare(`
      UPDATE orders
      SET courier_id = ?, status = 'on_the_way'
      WHERE id = ?
    `).run(courier.id, order_id);

    // Mijozga xabar yuborish
    const bot = getBot();
    if (bot) {
      let customerTelegramId = null;
      if (order.user_id) {
        const u = db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(order.user_id);
        customerTelegramId = u?.telegram_id;
      }

      if (customerTelegramId) {
        bot.telegram.sendMessage(
          customerTelegramId,
          `🚗 *Buyurtmangiz yo'lda!*\n\n📦 Buyurtma raqami: #${order.id}\n🚴 Kuryer: *${courier.first_name || 'Kuryer'}*\n📞 Kuryer tel: ${courier.phone || 'Bot orqali'}\n\nKuryerimiz tez orada manzilingizga yetib boradi!`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
    }

    res.json({ success: true, message: 'Buyurtma qabul qilindi!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Kuryer buyurtmani topshirdi (yetkazildi deb belgilash)
router.post('/orders/deliver', (req, res) => {
  try {
    const { order_id, telegram_id, courier_id } = req.body;
    let courier;
    if (courier_id) {
      courier = db.prepare('SELECT * FROM couriers WHERE id = ? AND status = \'active\'').get(courier_id);
    } else if (telegram_id) {
      courier = db.prepare('SELECT * FROM couriers WHERE telegram_id = ? AND status = \'active\'').get(telegram_id);
    }
    if (!courier) {
      return res.status(403).json({ success: false, error: 'Kuryer sifatida ruxsatingiz yo\'q' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    }

    db.prepare(`
      UPDATE orders
      SET status = 'completed'
      WHERE id = ? AND courier_id = ?
    `).run(order_id, courier.id);

    // Mijozga yetkazilgani haqida xabar yuborish
    const bot = getBot();
    if (bot) {
      let customerTelegramId = null;
      if (order.user_id) {
        const u = db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(order.user_id);
        customerTelegramId = u?.telegram_id;
      }

      if (customerTelegramId) {
        bot.telegram.sendMessage(
          customerTelegramId,
          `✅ *Buyurtmangiz yetkazildi!*\n\n📦 Buyurtma #${order.id} muvaffaqiyatli topshirildi.\nYoqimli ishtaha tilaymiz! Bizni tanlaganingiz uchun rahmat! 🍽✨`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
    }

    res.json({ success: true, message: 'Buyurtma muvaffaqiyatli yetkazildi!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
