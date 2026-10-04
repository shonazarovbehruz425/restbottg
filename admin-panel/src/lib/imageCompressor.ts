/**
 * Client-side Smart Image Compressor & Auto-Fitter
 * 
 * 1. Letterbox auto-stripper (qora yoki oq hoshiyalarni avtomatik qirqib tashlaydi)
 * 2. Kvadrat (1:1) formatga moslash — Mini App va bot kartalariga 100% ideal tushishi uchun
 * 3. WebP/JPEG siqish — fayl hajmini 50-80 KB ga tushiradi (tezkor yuklanish uchun)
 */

interface FitOptions {
  mode?: 'cover' | 'contain' | 'original';
  outputSize?: number;
  quality?: number;
}

/**
 * Rasmdagi qora yoki oq letterbox hoshiyalarni aniqlab, faqat taom qismini qirqib oladi.
 */
function detectContentBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const sampleData = ctx.getImageData(0, 0, width, height);
  const data = sampleData.data;

  const isDarkBar = (r: number, g: number, b: number) => r < 32 && g < 32 && b < 32;
  const isWhiteBar = (r: number, g: number, b: number) => r > 240 && g > 240 && b > 240;

  // Burchak piksellarini tekshirish
  const cornerR = data[0];
  const cornerG = data[1];
  const cornerB = data[2];
  const checkDark = isDarkBar(cornerR, cornerG, cornerB);
  const checkWhite = isWhiteBar(cornerR, cornerG, cornerB);

  if (!checkDark && !checkWhite) {
    return { x: 0, y: 0, width, height };
  }

  const isBorder = checkDark ? isDarkBar : isWhiteBar;

  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  // Yuqoridan pastga skanerlash
  const maxScanY = Math.floor(height * 0.45);
  for (let y = 0; y < maxScanY; y++) {
    let rowIsBorder = true;
    for (let x = 0; x < width; x += 8) {
      const idx = (y * width + x) * 4;
      if (!isBorder(data[idx], data[idx + 1], data[idx + 2])) {
        rowIsBorder = false;
        break;
      }
    }
    if (!rowIsBorder) {
      top = Math.max(0, y - 2);
      break;
    }
  }

  // Pastdan yuqoriga skanerlash
  const minScanY = Math.floor(height * 0.55);
  for (let y = height - 1; y > minScanY; y--) {
    let rowIsBorder = true;
    for (let x = 0; x < width; x += 8) {
      const idx = (y * width + x) * 4;
      if (!isBorder(data[idx], data[idx + 1], data[idx + 2])) {
        rowIsBorder = false;
        break;
      }
    }
    if (!rowIsBorder) {
      bottom = Math.min(height - 1, y + 2);
      break;
    }
  }

  // Chapdan o'ngga skanerlash
  const maxScanX = Math.floor(width * 0.35);
  for (let x = 0; x < maxScanX; x++) {
    let colIsBorder = true;
    for (let y = top; y <= bottom; y += 8) {
      const idx = (y * width + x) * 4;
      if (!isBorder(data[idx], data[idx + 1], data[idx + 2])) {
        colIsBorder = false;
        break;
      }
    }
    if (!colIsBorder) {
      left = Math.max(0, x - 2);
      break;
    }
  }

  // O'ngdan chapga skanerlash
  const minScanX = Math.floor(width * 0.65);
  for (let x = width - 1; x > minScanX; x--) {
    let colIsBorder = true;
    for (let y = top; y <= bottom; y += 8) {
      const idx = (y * width + x) * 4;
      if (!isBorder(data[idx], data[idx + 1], data[idx + 2])) {
        colIsBorder = false;
        break;
      }
    }
    if (!colIsBorder) {
      right = Math.min(width - 1, x + 2);
      break;
    }
  }

  const croppedW = right - left + 1;
  const croppedH = bottom - top + 1;

  if (croppedW >= width * 0.35 && croppedH >= height * 0.35) {
    return { x: left, y: top, width: croppedW, height: croppedH };
  }

  return { x: 0, y: 0, width, height };
}

export async function compressImageFile(
  file: File,
  options: FitOptions = {}
): Promise<File> {
  const { mode = 'cover', outputSize = 800, quality = 0.85 } = options;

  if (!file.type.startsWith('image/')) {
    return file;
  }
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // 1. Dastlabki o'lchamlarni olish va hoshiyalarni tekshirish
          const rawCanvas = document.createElement('canvas');
          rawCanvas.width = img.width;
          rawCanvas.height = img.height;
          const rawCtx = rawCanvas.getContext('2d');
          if (!rawCtx) return resolve(file);

          rawCtx.drawImage(img, 0, 0);

          // 2. Qora yoki oq letterbox barlarni avtomatik tozalash
          const bounds = detectContentBounds(rawCtx, img.width, img.height);

          // 3. Yakuniy kvadrat kanvas tayyorlash (800x800)
          const targetCanvas = document.createElement('canvas');
          targetCanvas.width = outputSize;
          targetCanvas.height = outputSize;
          const ctx = targetCanvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          if (mode === 'original') {
            // Asl nisbatni saqlagan holda o'lchamni kichraytirish
            let outW = bounds.width;
            let outH = bounds.height;
            if (outW > outputSize || outH > outputSize) {
              if (outW > outH) {
                outH = Math.round((outH * outputSize) / outW);
                outW = outputSize;
              } else {
                outW = Math.round((outW * outputSize) / outH);
                outH = outputSize;
              }
            }
            targetCanvas.width = outW;
            targetCanvas.height = outH;
            ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, outW, outH);
          } else if (mode === 'contain') {
            // Butunlay sig'dirish: orqa fonni taom rangida xira (blur) qilib to'ldirish
            ctx.filter = 'blur(20px) brightness(0.7)';
            ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, -20, -20, outputSize + 40, outputSize + 40);
            ctx.filter = 'none';

            // Taomni markazga sig'dirish
            const scale = Math.min(outputSize / bounds.width, outputSize / bounds.height);
            const drawW = bounds.width * scale;
            const drawH = bounds.height * scale;
            const drawX = (outputSize - drawW) / 2;
            const drawY = (outputSize - drawH) / 2;
            ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, drawW, drawH);
          } else {
            // mode === 'cover' (Standart tavsiya etilgan rejim: 1:1 kvadratga to'liq va markazlashtirib joylash)
            const aspect = bounds.width / bounds.height;

            if (aspect > 1.6) {
              // Juda keng taomlar (masalan uzun hot-dog):
              // Kesib yubormaslik uchun yumshoq ambient fon bilan to'liq sig'diriladi
              ctx.filter = 'blur(24px) brightness(0.65)';
              ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, -10, -10, outputSize + 20, outputSize + 20);
              ctx.filter = 'none';

              const scale = (outputSize * 0.94) / bounds.width;
              const drawW = bounds.width * scale;
              const drawH = bounds.height * scale;
              const drawX = (outputSize - drawW) / 2;
              const drawY = (outputSize - drawH) / 2;
              ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, drawW, drawH);
            } else {
              // 1:1 kvadratga markazdan chiroyli qirqib olish (Standart burger, pitsa, donar, lavash)
              const size = Math.min(bounds.width, bounds.height);
              const srcX = bounds.x + (bounds.width - size) / 2;
              const srcY = bounds.y + (bounds.height - size) / 2;
              ctx.drawImage(img, srcX, srcY, size, size, 0, 0, outputSize, outputSize);
            }
          }

          // 4. WebP formatiga siqish
          targetCanvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const extension = blob.type === 'image/webp' ? '.webp' : '.jpg';
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'product';
              const optimizedFile = new File([blob], `${baseName}${extension}`, {
                type: blob.type,
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            },
            'image/webp',
            quality
          );
        } catch (err) {
          console.warn('Rasm siqishda xatolik:', err);
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
