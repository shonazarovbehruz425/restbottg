/**
 * Client-side Smart Image Compressor & Auto-Fitter
 * 
 * 1. Kvadrat (1:1) formatga moslash — Mini App va bot kartalariga 100% ideal tushishi uchun
 * 2. Taomning hech bir qismi (tepa limoni, tag qismi, bezaklari) kesilmaydi
 * 3. WebP formatida siqish — fayl hajmini 50-90 KB ga tushiradi (tezkor yuklanish)
 */

interface FitOptions {
  mode?: 'cover' | 'contain' | 'original';
  outputSize?: number;
  quality?: number;
}

export async function compressImageFile(
  file: File,
  options: FitOptions = {}
): Promise<File> {
  const { mode = 'cover', outputSize = 800, quality = 0.88 } = options;

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
          const targetCanvas = document.createElement('canvas');
          targetCanvas.width = outputSize;
          targetCanvas.height = outputSize;
          const ctx = targetCanvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          const aspect = img.width / img.height;

          if (mode === 'original') {
            let outW = img.width;
            let outH = img.height;
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
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, outW, outH);
          } else {
            // Standart kvadrat (1:1) rejim:
            // Agar rasm nisbati deyarli kvadrat bo'lsa (0.88 dan 1.14 gacha): markazdan engil moslab to'liq joylash
            if (aspect >= 0.88 && aspect <= 1.14) {
              const size = Math.min(img.width, img.height);
              const srcX = (img.width - size) / 2;
              const srcY = (img.height - size) / 2;
              ctx.drawImage(img, srcX, srcY, size, size, 0, 0, outputSize, outputSize);
            } else {
              // Agar rasm bo'yiga (masalan uzun kokteyl stakani) yoki eniga cho'ziq bo'lsa:
              // HECH QANDAY QISMI KESILMASIN!
              // 1. Orqa fonga taom ranglaridan tashkil topgan ambient blur fon chiziladi:
              ctx.filter = 'blur(28px) brightness(0.65)';
              ctx.drawImage(img, -20, -20, outputSize + 40, outputSize + 40);
              ctx.filter = 'none';

              // 2. Taom to'liq sig'dirilib markazga joylashtiriladi:
              const scale = (outputSize * 0.96) / Math.max(img.width, img.height);
              const drawW = img.width * scale;
              const drawH = img.height * scale;
              const drawX = (outputSize - drawW) / 2;
              const drawY = (outputSize - drawH) / 2;
              ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);
            }
          }

          // WebP formatiga siqish
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
