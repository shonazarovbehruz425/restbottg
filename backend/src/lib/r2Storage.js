const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');

let s3Client = null;

/**
 * Cloudflare R2 konfiguratsiyasi mavjudligini tekshirish
 */
function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

/**
 * S3 Client instansiyasini olish
 */
function getR2Client() {
  if (!isR2Configured()) return null;
  if (!s3Client) {
    const accountId = process.env.R2_ACCOUNT_ID.trim();
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim()
      }
    });
  }
  return s3Client;
}

/**
 * Faylni Cloudflare R2 ga yuklash
 * @param {Buffer|Uint8Array} fileBuffer
 * @param {string} originalName
 * @param {string} [mimeType]
 * @returns {Promise<string>} Ommaviy URL (Public URL)
 */
async function uploadToR2(fileBuffer, originalName, mimeType) {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 konfiguratsiyasi (.env) to\'liq emas');
  }

  const ext = path.extname(originalName || '').toLowerCase() || '.jpg';
  const cleanBase = path.basename(originalName || 'image', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueKey = `products/${Date.now()}_${cleanBase}${ext}`;
  const bucket = process.env.R2_BUCKET_NAME.trim();

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: uniqueKey,
    Body: fileBuffer,
    ContentType: mimeType || (ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg')
  }));

  // Public URL ni shakllantirish
  let publicBase = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
  if (!publicBase) {
    publicBase = `https://${bucket}.${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`;
  }

  return `${publicBase}/${uniqueKey}`;
}

/**
 * Cloudflare R2 dan faylni o'chirish
 * @param {string} fileUrl
 */
async function deleteFromR2(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  const client = getR2Client();
  if (!client) return;

  try {
    const bucket = process.env.R2_BUCKET_NAME.trim();
    let key = '';

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const parsed = new URL(fileUrl);
      key = parsed.pathname.replace(/^\/+/, '');
    } else {
      key = fileUrl.replace(/^\/+/, '');
    }

    if (!key) return;

    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    }));
  } catch (err) {
    console.warn('R2 faylni o\'chirishda xatolik:', err && err.message);
  }
/**
 * R2 ulanishini tekshirish
 */
async function testR2Connection() {
  if (!isR2Configured()) {
    const missing = [];
    if (!process.env.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
    if (!process.env.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');
    return { ok: false, missing };
  }
  try {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME.trim();
    await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
    return { ok: true, bucket };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  isR2Configured,
  getR2Client,
  uploadToR2,
  deleteFromR2,
  testR2Connection
};

