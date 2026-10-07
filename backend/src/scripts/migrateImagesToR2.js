const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const fs = require('fs');
const { isR2Configured, uploadToR2 } = require('../lib/r2Storage');
const db = require('../db');

async function migrateImages() {
  if (!isR2Configured()) {
    console.error('❌ Xatolik: .env faylida Cloudflare R2 sozlamalari kiritilmagan!');
    console.error('Quyidagilarni .env fayliga kiriting:');
    console.error('R2_ACCOUNT_ID=...\nR2_ACCESS_KEY_ID=...\nR2_SECRET_ACCESS_KEY=...\nR2_BUCKET_NAME=...\nR2_PUBLIC_URL=...');
    process.exit(1);
  }

  const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('📁 uploads papkasi topilmadi:', uploadsDir);
    return;
  }

  const files = fs.readdirSync(uploadsDir).filter(f => !f.endsWith('.js') && !f.startsWith('.'));
  console.log(`🖼️ uploads papkasida ${files.length} ta rasm topildi. R2 ga yuklanmoqda...`);

  let uploadedCount = 0;
  const urlMapping = new Map(); // localPath -> r2Url

  for (const filename of files) {
    const fullPath = path.join(uploadsDir, filename);
    if (!fs.statSync(fullPath).isFile()) continue;

    try {
      const buffer = fs.readFileSync(fullPath);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const r2Url = await uploadToR2(buffer, filename, mime);
      urlMapping.set(`/uploads/${filename}`, r2Url);
      urlMapping.set(filename, r2Url);
      uploadedCount++;
      console.log(`  ✅ [${uploadedCount}/${files.length}] Yuklandi: ${filename} -> ${r2Url}`);
    } catch (e) {
      console.warn(`  ⚠️ Yuklashda xato (${filename}):`, e.message);
    }
  }

  console.log(`\n🔄 Bazadagi mahsulotlar rasm havolalarini R2 ga yangilash...`);
  let updatedProducts = 0;

  try {
    const products = await db.prepare('SELECT id, name, image_url FROM products').all();
    for (const p of products) {
      if (!p.image_url) continue;
      // Agar rasm allaqachon R2 yoki http bo'lsa teginmaymiz
      if (p.image_url.startsWith('http://') || p.image_url.startsWith('https://')) continue;

      const matchedR2 = urlMapping.get(p.image_url) || urlMapping.get(path.basename(p.image_url));
      if (matchedR2) {
        await db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(matchedR2, p.id);
        updatedProducts++;
        console.log(`  🍛 Yangilandi: #${p.id} ${p.name} -> ${matchedR2}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Bazani yangilashda xato:', err.message);
  }

  console.log(`\n🎉 TAMOMLANDI!`);
  console.log(`📊 Cloudflare R2 ga yuklandi: ${uploadedCount} ta rasm`);
  console.log(`🍛 Bazada yangilandi: ${updatedProducts} ta taom`);
}

migrateImages();
