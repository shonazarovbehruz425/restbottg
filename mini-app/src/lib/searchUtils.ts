import { Product } from '../types';

/**
 * Har qanday o'zbekcha apostroflarni (', ‘, ’, ʻ, ʼ, `) yagona standart belgi bilan almashtiradi
 */
export function normalizeApostrophes(str: string): string {
  if (!str) return '';
  return str.replace(/[\u2018\u2019\u02BB\u02BC\u0060\u00B4']/g, "'");
}

/**
 * Apostrof va bo'shliqlardan tozalangan string (masalan "go'shtli" -> "goshtli")
 */
export function stripApostrophes(str: string): string {
  if (!str) return '';
  return str.replace(/[\u2018\u2019\u02BB\u02BC\u0060\u00B4'"\s\-]/g, '');
}

/**
 * Qidiruv so'zi va nishon matnni solishtirish
 */
export function textMatchesQuery(targetText: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!targetText) return false;

  const q = query.toLowerCase().trim();
  const t = targetText.toLowerCase();

  // 1. To'g'ridan-to'g'ri moslik
  if (t.includes(q)) return true;

  // 2. Apostroflar unifikatsiyasi bo'yicha moslik (o' vs o‘ vs o’)
  const normT = normalizeApostrophes(t);
  const normQ = normalizeApostrophes(q);
  if (normT.includes(normQ)) return true;

  // 3. Apostrofsiz moslik ("goshtli" -> "go'shtli")
  const strippedT = stripApostrophes(t);
  const strippedQ = stripApostrophes(q);
  if (strippedQ.length > 0 && strippedT.includes(strippedQ)) return true;

  // 4. Ko'p so'zli tokenli qidiruv (masalan: "pitsa pishloqli")
  const tokens = normQ.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every(tok => {
      const strippedTok = stripApostrophes(tok);
      return (
        normT.includes(tok) || 
        (strippedTok.length > 0 && strippedT.includes(strippedTok))
      );
    });
  }

  return false;
}

/**
 * Taomni qidiruv so'rovi bo'yicha professional filtrlash va saralash
 */
export function filterAndRankProducts(products: Product[], query: string): Product[] {
  if (!query || !query.trim()) return products;

  const q = query.toLowerCase().trim();
  const normQ = normalizeApostrophes(q);
  const strippedQ = stripApostrophes(q);
  const tokens = normQ.split(/\s+/).filter(Boolean);

  interface ScoredProduct {
    product: Product;
    score: number;
  }

  const matches: ScoredProduct[] = [];

  for (const product of products) {
    const name = product.name || '';
    const desc = product.description || '';
    const catName = product.category_name || '';
    const tag = product.tag || '';

    const normName = normalizeApostrophes(name.toLowerCase());
    const strippedName = stripApostrophes(name.toLowerCase());

    const normDesc = normalizeApostrophes(desc.toLowerCase());
    const strippedDesc = stripApostrophes(desc.toLowerCase());

    const normCat = normalizeApostrophes(catName.toLowerCase());
    const normTag = normalizeApostrophes(tag.toLowerCase());

    let score = 0;

    // Nom bilan aniq boshlanish (eng yuqori ball)
    if (normName.startsWith(normQ) || (strippedQ.length > 0 && strippedName.startsWith(strippedQ))) {
      score += 100;
    }
    // Nom ichida to'liq so'z/jumla uchrashi
    else if (normName.includes(normQ) || (strippedQ.length > 0 && strippedName.includes(strippedQ))) {
      score += 60;
    }
    // Ta'rif ichida uchrashi
    else if (normDesc.includes(normQ) || (strippedQ.length > 0 && strippedDesc.includes(strippedQ))) {
      score += 30;
    }
    // Kategoriya yoki teg ichida uchrashi
    else if (normCat.includes(normQ) || normTag.includes(normQ)) {
      score += 20;
    }
    // Tokenlar bo'yicha mos kelishi
    else if (tokens.length > 1) {
      const allTokensMatch = tokens.every(tok => {
        const sTok = stripApostrophes(tok);
        return (
          normName.includes(tok) ||
          (sTok.length > 0 && strippedName.includes(sTok)) ||
          normDesc.includes(tok) ||
          (sTok.length > 0 && strippedDesc.includes(sTok)) ||
          normCat.includes(tok)
        );
      });

      if (allTokensMatch) {
        score += 40;
      }
    }

    if (score > 0) {
      // Mavjud taomlarga ustunlik berish
      if (product.is_available) score += 5;
      matches.push({ product, score });
    }
  }

  // Eng mos kelgan taomlarni birinchi o'ringa chiqarish
  return matches.sort((a, b) => b.score - a.score).map(m => m.product);
}
