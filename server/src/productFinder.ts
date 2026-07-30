import { prisma } from './prisma.js';
import { generateProductNutrition } from './openai.js';

export interface ProductFindResult {
  product: { id: number; name: string; nameZh: string | null; imageUrl: string | null; brand: { name: string } | null };
  source: 'local' | 'openfoodfacts' | 'ai';
}

export interface ProductFindInput {
  barcode?: string | null;
  names?: string[];
}

export const OFF_NUTRIENT_MAP: { nutrientId: number; offKey: string; factor: number; unit: string; dvRef: number }[] = [
  { nutrientId: 13, offKey: 'proteins_100g', factor: 1, unit: 'g', dvRef: 30 },
  { nutrientId: 15, offKey: 'sugars_100g', factor: 1, unit: 'g', dvRef: 25 },
  { nutrientId: 16, offKey: 'energy-kcal_100g', factor: 1, unit: 'kcal', dvRef: 1600 },
  { nutrientId: 5, offKey: 'calcium_100g', factor: 1000, unit: 'mg', dvRef: 1000 },
  { nutrientId: 1, offKey: 'iron_100g', factor: 1000, unit: 'mg', dvRef: 10 },
  { nutrientId: 2, offKey: 'zinc_100g', factor: 1000, unit: 'mg', dvRef: 5 },
  { nutrientId: 14, offKey: 'potassium_100g', factor: 1000, unit: 'mg', dvRef: 2300 },
  { nutrientId: 9, offKey: 'vitamin-c_100g', factor: 1000, unit: 'mg', dvRef: 25 },
  { nutrientId: 6, offKey: 'vitamin-d_100g', factor: 1e6, unit: 'μg', dvRef: 15 },
  { nutrientId: 11, offKey: 'vitamin-a_100g', factor: 1e6, unit: 'μg', dvRef: 400 },
  { nutrientId: 12, offKey: 'vitamin-b12_100g', factor: 1e6, unit: 'μg', dvRef: 1.8 },
  { nutrientId: 17, offKey: 'saturated-fat_100g', factor: 1, unit: 'g', dvRef: 20 },
  { nutrientId: 18, offKey: 'sodium_100g', factor: 1000, unit: 'mg', dvRef: 2300 },
  { nutrientId: 19, offKey: 'fat_100g', factor: 1, unit: 'g', dvRef: 65 },
  { nutrientId: 20, offKey: 'fiber_100g', factor: 1, unit: 'g', dvRef: 28 },
  { nutrientId: 21, offKey: 'carbohydrates_100g', factor: 1, unit: 'g', dvRef: 275 },
  { nutrientId: 22, offKey: 'fiber_100g', factor: 1, unit: 'g', dvRef: 25 },
{ nutrientId: 23, offKey: 'magnesium_100g', factor: 1000, unit: 'mg', dvRef: 130 },
  // ↓↓↓ 新增: 对应 seed.ts 里新加的 24~33 号营养素 ↓↓↓
  { nutrientId: 24, offKey: 'docosahexaenoic-acid_100g', factor: 1, unit: 'g', dvRef: 0.25 },
  { nutrientId: 25, offKey: 'choline_100g', factor: 1000, unit: 'mg', dvRef: 550 },
  { nutrientId: 26, offKey: 'creatine_100g', factor: 1000, unit: 'mg', dvRef: 1000 },
  { nutrientId: 27, offKey: 'fluoride_100g', factor: 1000, unit: 'mg', dvRef: 3 },
  { nutrientId: 28, offKey: 'vitamin-b9_100g', factor: 1e6, unit: 'μg', dvRef: 400 },
  { nutrientId: 29, offKey: 'iodine_100g', factor: 1e6, unit: 'μg', dvRef: 150 },
  { nutrientId: 30, offKey: 'en-lutein_100g', factor: 1000, unit: 'mg', dvRef: 6 },
  { nutrientId: 31, offKey: 'vitamin-b6_100g', factor: 1000, unit: 'mg', dvRef: 1.7 },
  { nutrientId: 32, offKey: 'vitamin-e_100g', factor: 1000, unit: 'mg', dvRef: 15 },
  { nutrientId: 33, offKey: 'vitamin-k_100g', factor: 1e6, unit: 'μg', dvRef: 120 },
];

const OFF_ALLERGEN_MAP: Record<string, string> = {
  'en:gluten': 'gluten',
  'en:crustaceans': 'crustaceans',
  'en:eggs': 'eggs',
  'en:fish': 'fish',
  'en:peanuts': 'peanuts',
  'en:soybeans': 'soybeans',
  'en:milk': 'milk',
  'en:nuts': 'nuts',
  'en:celery': 'celery',
  'en:mustard': 'mustard',
  'en:sesame-seeds': 'sesame-seeds',
  'en:sulphur-dioxide-and-sulphites': 'sulphur-dioxide-and-sulphites',
  'en:lupin': 'lupin',
  'en:molluscs': 'molluscs',
};

async function findLocalByBarcode(barcode: string): Promise<ProductFindResult['product'] | null> {
  return prisma.product.findUnique({
    where: { barcode },
    select: { id: true, name: true, nameZh: true, imageUrl: true, brand: { select: { name: true } } },
  });
}

async function findLocalByNames(names: string[]): Promise<ProductFindResult['product'] | null> {
  const seen = new Set<number>();
  for (const raw of names) {
    const q = raw.trim();
    if (q.length < 2) continue;
    const rows = await prisma.product.findMany({
      where: { OR: [{ name: { contains: q } }, { nameZh: { contains: q } }] },
      take: 5,
      select: { id: true, name: true, nameZh: true, imageUrl: true, brand: { select: { name: true } } },
    });
    for (const r of rows) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        return r;
      }
    }
  }
  return null;
}
function getServingFactor(servingSize?: string): number {
  if (!servingSize) return 1;

  // 例如：
  // "26 g"
  // "1 slice (26 g)"
  // "2 pieces (30g)"
  // "240 ml"
  const metricMatch = servingSize.match(
    /(\d+(?:\.\d+)?)\s*(g|ml)\b/i
  );

  if (metricMatch) {
    const amount = Number(metricMatch[1]);

    if (Number.isFinite(amount) && amount > 0) {
      return amount / 100;
    }
  }

  // 可选：处理 oz
  const ounceMatch = servingSize.match(
    /(\d+(?:\.\d+)?)\s*(?:oz|ounce|ounces)\b/i
  );

  if (ounceMatch) {
    const ounces = Number(ounceMatch[1]);

    if (Number.isFinite(ounces) && ounces > 0) {
      const grams = ounces * 28.3495;
      return grams / 100;
    }
  }

  // 无法确定重量时，不要把 "1 slice" 当成 1g
  return 1;
}
async function importFromOpenFoodFacts(barcode: string): Promise<ProductFindResult['product'] | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json` +
'?fields=product_name,product_name_zh,brands,image_front_url,nova_group,nutriscore_grade,nutriscore_score,categories_tags,quantity,serving_size,nutriments,allergens_tags,additives_tags',
      { headers: { 'User-Agent': 'NutriKids/0.1 (dev)' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: number;
      product?: {
        product_name?: string; product_name_zh?: string; brands?: string;
        image_front_url?: string; nova_group?: number; nutriscore_grade?: string;
        nutriscore_score?: number; categories_tags?: string[];
        quantity?: string; serving_size?: string;
        nutriments?: Record<string, number>; allergens_tags?: string[];
        additives_tags?: string[];
      };
    };
    if (data.status !== 1 || !data.product?.product_name) return null;
    const p = data.product;
    console.log('OFF barcode result:', barcode, '-> name:', p.product_name, '| nameZh:', p.product_name_zh);
    let brandId: number | undefined;
    const brandName = p.brands?.split(',')[0]?.trim();
    if (brandName) {
      const brand = await prisma.brand.upsert({ where: { name: brandName }, create: { name: brandName }, update: {} });
      brandId = brand.id;
    }

    const servingFactor = getServingFactor(p.serving_size);
    
    const nutrients = OFF_NUTRIENT_MAP
      .filter((m) => typeof p.nutriments?.[m.offKey] === 'number')
      .map((m) => {
        const rawOffValue100g = p.nutriments![m.offKey];  // OFF原始单位(通常是克),不做任何换算
        const valuePer100g = rawOffValue100g * m.factor;  // 换算成展示用单位(比如毫克),给 value/dailyValue 用
        const value = Math.round(valuePer100g * servingFactor * 100) / 100;  // ← 乘以份量比例
        return {
          nutrientId: m.nutrientId,
          value,
          // 每100g原始值,DevScore专用: 必须跟 category_nutrition_stats.json 同单位口径
          // (那份表是直接从OFF原始克数算出来的P10/P90,不能在这里先乘factor换算单位)
          value100g: Math.round(rawOffValue100g * 1e8) / 1e8,
          unit: m.unit,
          dailyValue: Math.round((value / m.dvRef) * 100),
        };
      });

    const allergenCodes = (p.allergens_tags ?? [])
      .map((t) => OFF_ALLERGEN_MAP[t])
      .filter((c): c is string => Boolean(c));
    const allergenRows = await prisma.allergen.findMany({ where: { code: { in: allergenCodes } } });

    return prisma.product.create({
      data: {
        barcode,
        name: p.product_name!,
        nameZh: p.product_name_zh || null,
        brandId,
        imageUrl: p.image_front_url ?? null,
        quantity: p.quantity ?? null,
        servingSize: p.serving_size ?? '100g',
        novaScore: p.nova_group ?? null,
        nutriGrade: p.nutriscore_grade?.toUpperCase() ?? null,
        nutriScore: typeof p.nutriscore_score === 'number' ? p.nutriscore_score : null,
        verified: false,
        nutrients: { create: nutrients },
        allergens: { create: allergenRows.map((a) => ({ allergenId: a.id })) },
        additivesJson: p.additives_tags?.length ? JSON.stringify(p.additives_tags) : null,
        categoriesTagsJson: p.categories_tags?.length ? JSON.stringify(p.categories_tags) : null,
      },
      select: { id: true, name: true, nameZh: true, imageUrl: true, brand: { select: { name: true } } },
    });
  } catch (e) {
    console.error(`importFromOpenFoodFacts 失败 (barcode=${barcode}):`, e);
    return null;
  }
}

async function searchOpenFoodFactsByName(name: string): Promise<ProductFindResult['product'] | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=5`,
      { headers: { 'User-Agent': 'NutriKids/0.1 (dev)' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      count: number;
      products?: Array<{
        code?: string; product_name?: string; product_name_zh?: string; brands?: string;
        image_front_url?: string; nova_group?: number; nutriscore_grade?: string;
        nutriscore_score?: number; categories_tags?: string[];
        quantity?: string; serving_size?: string;
        nutriments?: Record<string, number>; allergens_tags?: string[];
        additives_tags?: string[];
      }>;
    };
    if (!data.products || data.products.length === 0) return null;
    // 选名字最匹配的，而不是直接取第一个
    const searchWords = name.toLowerCase().split(' ').filter(w => w.length > 2);
    const best = data.products.find(p => {
      const pName = p.product_name?.toLowerCase() ?? '';
      return searchWords.some(w => pName.includes(w));
    }) ?? data.products[0];

    if (!best?.product_name) return null;
    const p = best;
    console.log('OFF search result:', name, '->', p.product_name, 'nutrients:', Object.keys(p.nutriments ?? {}));
    if (!p.product_name) return null;

    let brandId: number | undefined;
    const brandName = p.brands?.split(',')[0]?.trim();
    if (brandName) {
      const brand = await prisma.brand.upsert({ where: { name: brandName }, create: { name: brandName }, update: {} });
      brandId = brand.id;
    }

    const servingFactor = getServingFactor(p.serving_size);
    
    const nutrients = OFF_NUTRIENT_MAP
      .filter((m) => typeof p.nutriments?.[m.offKey] === 'number')
      .map((m) => {
        const rawOffValue100g = p.nutriments![m.offKey];  // OFF原始单位(通常是克),不做任何换算
        const valuePer100g = rawOffValue100g * m.factor;  // 换算成展示用单位(比如毫克),给 value/dailyValue 用
        const value = Math.round(valuePer100g * servingFactor * 100) / 100;  // ← 乘以份量比例
        return {
          nutrientId: m.nutrientId,
          value,
          value100g: Math.round(rawOffValue100g * 1e8) / 1e8,
          unit: m.unit,
          dailyValue: Math.round((value / m.dvRef) * 100),
        };
      });
    const allergenCodes = (p.allergens_tags ?? [])
      .map((t) => OFF_ALLERGEN_MAP[t])
      .filter((c): c is string => Boolean(c));
    const allergenRows = await prisma.allergen.findMany({ where: { code: { in: allergenCodes } } });

    return prisma.product.upsert({
      where: { barcode: p.code ?? '' },
      update: {
        name: p.product_name!,
        nameZh: p.product_name_zh || null,
        brandId,
        imageUrl: p.image_front_url ?? null,
        quantity: p.quantity ?? null,
        servingSize: p.serving_size ?? '100g',
        novaScore: p.nova_group ?? null,
        nutriGrade: p.nutriscore_grade?.toUpperCase() ?? null,
        nutriScore:
          typeof p.nutriscore_score === 'number'
            ? p.nutriscore_score
            : null,
    
        nutrients: {
          deleteMany: {},
          create: nutrients,
        },
    
        allergens: {
          deleteMany: {},
          create: allergenRows.map((a) => ({
            allergenId: a.id,
          })),
        },
    
        additivesJson: p.additives_tags?.length
          ? JSON.stringify(p.additives_tags)
          : null,
    
        categoriesTagsJson: p.categories_tags?.length
          ? JSON.stringify(p.categories_tags)
          : null,
      },
      create: {
        barcode: p.code ?? null,
        name: p.product_name!,
        nameZh: p.product_name_zh || null,
        brandId,
        imageUrl: p.image_front_url ?? null,
        quantity: p.quantity ?? null,
        servingSize: p.serving_size ?? '100g',
        novaScore: p.nova_group ?? null,
        nutriGrade: p.nutriscore_grade?.toUpperCase() ?? null,
        nutriScore: typeof p.nutriscore_score === 'number' ? p.nutriscore_score : null,
        verified: false,
        nutrients: { create: nutrients },
        allergens: { create: allergenRows.map((a) => ({ allergenId: a.id })) },
        additivesJson: p.additives_tags?.length ? JSON.stringify(p.additives_tags) : null,
        categoriesTagsJson: p.categories_tags?.length ? JSON.stringify(p.categories_tags) : null,
      },
      select: { id: true, name: true, nameZh: true, imageUrl: true, brand: { select: { name: true } } },
    });
  } catch (e) {
    console.error(`searchOpenFoodFactsByName 失败 (name=${name}):`, e);
    return null;
  }
}

export async function createProductByAI(nameEn: string, nameZh: string, brand: string | null): Promise<ProductFindResult['product'] | null> {
  try {
    const nutrition = await generateProductNutrition(nameEn, nameZh);
    if (!nutrition) return null;

    let brandId: number | undefined;
    if (brand) {
      const b = await prisma.brand.upsert({ where: { name: brand }, create: { name: brand }, update: {} });
      brandId = b.id;
    }

    const nutrients = nutrition.nutrients.map((n) => ({
      nutrientId: n.nutrientId,
      value: n.value,
      unit: n.unit,
      dailyValue: n.dailyValue,
    }));

    const allergenRows = nutrition.allergens.length > 0
      ? await prisma.allergen.findMany({ where: { code: { in: nutrition.allergens } } })
      : [];

    return prisma.product.create({
      data: {
        name: nameEn,
        nameZh: nameZh || null,
        brandId,
        imageUrl: null,
        servingSize: '100g',
        novaScore: nutrition.novaScore ?? null,
        nutriGrade: nutrition.nutriGrade ?? null,
        verified: false,
        nutrients: { create: nutrients },
        allergens: { create: allergenRows.map((a) => ({ allergenId: a.id })) },
      },
      select: { id: true, name: true, nameZh: true, imageUrl: true, brand: { select: { name: true } } },
    });
  } catch (e) {
    console.error(`createProductByAI 失败 (nameEn=${nameEn}):`, e);
    return null;
  }
}

export async function findProduct(input: ProductFindInput): Promise<ProductFindResult | null> {
  const { barcode, names = [] } = input;

  if (barcode) {
    const local = await findLocalByBarcode(barcode);
    if (local) return { product: local, source: 'local' };

    const off = await importFromOpenFoodFacts(barcode);
    if (off) return { product: off, source: 'openfoodfacts' };
  }
  

  if (names.length > 0) {
    const local = await findLocalByNames(names);
    if (local) return { product: local, source: 'local' };

    for (const name of names) {
      const trimmed = name.trim();
      if (trimmed.length < 2) continue;
      const off = await searchOpenFoodFactsByName(trimmed);
      if (off) return { product: off, source: 'openfoodfacts' };
    }
  }

  if (names.length > 0) {
    const mainName = names[0].trim();
    const mainNameZh = names.find((n) => /[\u4e00-\u9fa5]/.test(n))?.trim() || '';
    const ai = await createProductByAI(mainName, mainNameZh, null);
    if (ai) return { product: ai, source: 'ai' };
  }

  return null;
}