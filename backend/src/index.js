require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const courierRoutes = require('./routes/courierRoutes');
const { initBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware lar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rasmlar uchun statik papka
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Asosiy API yo'nalishlari
app.use('/api', apiRoutes);
app.use('/api/couriers', courierRoutes);

// Server holati
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Telegram Botni ishga tushirish
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').trim();
initBot(BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`🚀 Restoran Backend Server http://localhost:${PORT} da ishga tushdi!`);
  console.log(`📁 Taomlar rasmlari: http://localhost:${PORT}/uploads/`);
});
