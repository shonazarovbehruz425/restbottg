const crypto = require('crypto');

function getBotToken() {
  return (
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN ||
    ''
  ).trim();
}

// Telegram Mini App initData imzosini tekshirish.
// Docs: data_check_string = sortlangan (hash dan tashqari) "key=value" qatorlar,
// secret = HMAC_SHA256(key="WebAppData", msg=bot_token),
// hash = HMAC_SHA256(key=secret, msg=data_check_string).
function verifyInitData(initData, botToken) {
  const token = (botToken !== undefined && botToken !== null ? String(botToken) : getBotToken()).trim();
  if (!initData || !token) return false;
  try {
    const params = new URLSearchParams(String(initData));
    const receivedHash = params.get('hash');
    if (!receivedHash) return false;

    const pairs = [];
    for (const [key, value] of params.entries()) {
      if (key === 'hash') continue;
      pairs.push(`${key}=${value}`);
    }
    pairs.sort();
    const dataCheckString = pairs.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const a = Buffer.from(computedHash, 'utf8');
    const b = Buffer.from(receivedHash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    console.error('verifyInitData error:', err && err.message);
    return false;
  }
}

// Backward-compat: header kelmasa o'tkazib yuboradi (TODO log bilan),
// kelsa va noto'g'ri bo'lsa 403 qaytaradi.
function verifyTelegram(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) {
    // TODO: barcha mijozlar initData yuborishga o'tgach, bu yerdan 403 qaytarish kerak.
    console.warn('TODO: x-telegram-init-data header kelmadi, tekshiruvsiz o\'tkazildi:', req.method, req.originalUrl);
    return next();
  }
  const ok = verifyInitData(String(initData));
  if (!ok) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  return next();
}

module.exports = { verifyInitData, verifyTelegram };
