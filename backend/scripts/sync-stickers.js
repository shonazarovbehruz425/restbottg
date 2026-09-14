#!/usr/bin/env node
/**
 * stickerCatalog.js qayta generatsiya qiluvchi skript.
 *
 * Manba: C:/IOS STIKERS/*.html fayllari ichidagi `const EMOJI_DATA = [...]` bloklari
 * (Apple Color Emoji, emoji-datasource-apple@16.0.0).
 * ios_stickers.html to'liq katalog hisoblanadi — u mavjud bo'lsa tartibi saqlanadi,
 * qolgan kategoriya fayllaridan qo'shimcha yozuvlar birlashtiriladi (u+i bo'yicha takrorlanmaydi).
 *
 * Ishlatish: node backend/scripts/sync-stickers.js [manba-papka] [chiqish-fayl]
 * Lokal fayl topilmasa stickers.js CDN fallback ishlatadi.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_SOURCE_DIR = 'C:/IOS STIKERS';
const CATALOG_PATH = path.join(__dirname, '..', 'src', 'bot', 'stickerCatalog.js');
const STICKER_CDN = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/';

// Kategoriya -> (name, uz) tarjimalari; noma'lum kategoriya uchun kalit o'zi ishlatiladi
const CATEGORY_UZ = {
  'Smileys & Emotion': { name: 'Smileylar', uz: "Tabassum va his-tuyg'ular", icon: '😀' },
  'People & Body': { name: 'Odamlar', uz: 'Odamlar va imo-ishoralar', icon: '🧑' },
  'Animals & Nature': { name: 'Hayvonlar', uz: 'Hayvonlar va tabiat', icon: '🐶' },
  'Food & Drink': { name: 'Taomlar', uz: 'Taomlar va ichimliklar', icon: '🍔' },
  'Travel & Places': { name: 'Sayohat', uz: 'Sayohat va transport', icon: '🚗' },
  'Activities': { name: 'Faoliyat', uz: "Sport va o'yinlar", icon: '⚽' },
  'Objects': { name: 'Buyumlar', uz: 'Buyumlar va asboblar', icon: '💡' },
  'Symbols': { name: 'Belgilar', uz: 'Belgilar va ramzlar', icon: '🔣' },
  'Flags': { name: 'Bayroqlar', uz: 'Davlat bayroqlari', icon: '🚩' }
};

/**
 * HTML ichidan `const EMOJI_DATA = [...]` massivini ajratib JSON.parse qiladi.
 * Qavslar chuqurligi va string ichini hisobga olgan holda topiladi.
 */
function extractEmojiData(html) {
  const marker = /const\s+EMOJI_DATA\s*=\s*/.exec(html);
  if (!marker) return null;
  let i = marker.index + marker[0].length;
  while (i < html.length && html[i] !== '[') i++;
  if (html[i] !== '[') return null;

  const start = i;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        return JSON.parse(html.slice(start, i + 1));
      }
    }
  }
  return null;
}

function main() {
  const sourceDir = process.argv[2] || DEFAULT_SOURCE_DIR;
  const outPath = process.argv[3] || CATALOG_PATH;

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Manba papka topilmadi: ${sourceDir}`);
    process.exit(1);
  }

  const all = fs.readdirSync(sourceDir)
    .filter(f => f.toLowerCase().endsWith('.html'));

  if (all.length === 0) {
    console.error(`❌ Manba papkada .html fayl topilmadi: ${sourceDir}`);
    process.exit(1);
  }

  // To'liq katalog fayli (ios_stickers.html) birinchi o'qiladi — yozuvlar tartibi kanonik saqlanadi
  const files = [
    ...all.filter(f => f.toLowerCase() === 'ios_stickers.html'),
    ...all.filter(f => f.toLowerCase() !== 'ios_stickers.html').sort()
  ];

  // Yozuvlarni birlashtirish (u+i bo'yicha takrorlanmaydi), tartib saqlanadi
  const seen = new Set();
  const data = [];
  let parsedFiles = 0;

  for (const file of files) {
    const html = fs.readFileSync(path.join(sourceDir, file), 'utf8');
    let entries;
    try {
      entries = extractEmojiData(html);
    } catch (err) {
      console.warn(`⚠️ ${file}: EMOJI_DATA parse xatosi — o'tkazib yuborildi (${err.message})`);
      continue;
    }
    if (!Array.isArray(entries) || entries.length === 0) continue;
    parsedFiles++;
    for (const e of entries) {
      // Faqat to'liq yozuvlar qabul qilinadi
      if (!e || typeof e.u !== 'string' || !e.i || !e.c) continue;
      const key = `${e.u}|${e.i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      data.push({ u: e.u, i: e.i, c: e.c, n: e.n || '', s: e.s || '', k: e.k || '' });
    }
  }

  if (data.length === 0) {
    console.error('❌ Hech qanday stiker yozuvi ajratib olinmadi — katalog yozilmadi.');
    process.exit(1);
  }

  // Kategoriyalar: kanonik tartib (CATEGORY_UZ) bo'yicha, noma'lumlari uchragan tartibda.
  // icon kategoriya birinchi emojisi bo'ladi (statik ro'yxatdagi icon ustuvor).
  const dataCats = [...new Set(data.map(e => e.c))];
  const catKeys = [
    ...Object.keys(CATEGORY_UZ).filter(k => dataCats.includes(k)),
    ...dataCats.filter(k => !CATEGORY_UZ[k])
  ];
  const categories = {};
  for (const key of catKeys) {
    const first = data.find(e => e.c === key);
    const meta = CATEGORY_UZ[key];
    categories[key] = {
      name: meta ? meta.name : key,
      uz: meta ? meta.uz : key,
      icon: meta ? meta.icon : (first ? first.u : '😀')
    };
  }

  const content = `// AVTOMATIK generatsiya qilindi: ${sourceDir} papkasidan (sync-stickers.js).
// Manba: Apple Color Emoji (emoji-datasource-apple@16.0.0) — ${data.length} ta stiker, ${Object.keys(categories).length} kategoriya.
// Qayta generatsiya: node backend/scripts/sync-stickers.js
const STICKER_CDN = ${JSON.stringify(STICKER_CDN)};

const CATEGORIES_INFO = ${JSON.stringify(categories, null, 2)};

const EMOJI_DATA = ${JSON.stringify(data)};

// Eksport (stickers.js va skriptlar uchun) — qayta generatsiyada ham saqlanadi
module.exports = { STICKER_CDN, CATEGORIES_INFO, EMOJI_DATA };
`;

  // Eski katalogni zaxiralash
  if (fs.existsSync(outPath)) {
    fs.copyFileSync(outPath, outPath + '.bak');
  }
  fs.writeFileSync(outPath, content, 'utf8');

  console.log(`✅ Katalog yozildi: ${outPath}`);
  console.log(`   Manba fayllar: ${parsedFiles}/${files.length} | Stikerlar: ${data.length} | Kategoriyalar: ${Object.keys(categories).length}`);
}

main();
