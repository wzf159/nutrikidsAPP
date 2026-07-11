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

const OFF_NUTRIENT_MAP: { nutrientId: number; offKey: string; factor: number; unit: string; dvRef: number }[] = [
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
];

const OFF_ALLERGEN_MAP: Record<string, string> = {
  'en:milk': 'milk',
  'en:eggs': 'egg',
  'en:soybeans': 'soy',
  'en:gluten': 'wheat',
  'en:nuts': 'tree-nuts',
  'en:peanuts': 'peanuts',
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

async function importFromOpenFoodFacts(barcode: string): Promise<ProductFindResult['product'] | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json` +
        '?fields=product_name,product_name_zh,brands,image_front_url,nova_group,nutriscore_grade,quantity,serving_size,nutriments,allergens_tags',
      { headers: { 'User-Agent': 'NutriKids/0.1 (dev)' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: number;
      product?: {
        product_name?: string; product_name_zh?: string; brands?: string;
        image_front_url?: string; nova_group?: number; nutriscore_grade?: string;
        quantity?: string; serving_size?: string;
        nutriments?: Record<string, number>; allergens_tags?: string[];
      };
    };
    if (data.status !== 1 || !data.product?.product_name) return null;
    const p = data.product;

    let brandId: number | undefined;
    const brandName = p.brands?.split(',')[0]?.trim();
    if (brandName) {
      const brand = await prisma.brand.upsert({ where: { name: brandName }, create: { name: brandName }, update: {} });
      brandId = brand.id;
    }

    const nutrients = OFF_NUTRIENT_MAP
      .filter((m) => typeof p.nutriments?.[m.offKey] === 'number')
      .map((m) => {
        const value = p.nutriments![m.offKey] * m.factor;
        return {
          nutrientId: m.nutrientId,
          value: Math.round(value * 100) / 100,
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
        verified: false,
        nutrients: { create: nutrients },
        allergens: { create: allergenRows.map((a) => ({ allergenId: a.id })) },
      },
      select: { id: true, name: true, nameZh: true, imageUrl: true, brand: { select: { name: true } } },
    });
  } catch {
    return null;
  }
}

async function searchOpenFoodFactsByName(name: string): Promise<ProductFindResult['product'] | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=1`,
      { headers: { 'User-Agent': 'NutriKids/0.1 (dev)' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      count: number;
      products?: Array<{
        code?: string; product_name?: string; product_name_zh?: string; brands?: string;
        image_front_url?: string; nova_group?: number; nutriscore_grade?: string;
        quantity?: string; serving_size?: string;
        nutriments?: Record<string, number>; allergens_tags?: string[];
      }>;
    };
    if (!data.products || data.products.length === 0) return null;
    const p = data.products[0];
    console.log('OFF search result:', name, '->', p.product_name, 'nutrients:', Object.keys(p.nutriments ?? {}));
    if (!p.product_name) return null;

    let brandId: number | undefined;
    const brandName = p.brands?.split(',')[0]?.trim();
    if (brandName) {
      const brand = await prisma.brand.upsert({ where: { name: brandName }, create: { name: brandName }, update: {} });
      brandId = brand.id;
    }

    const nutrients = OFF_NUTRIENT_MAP
      .filter((m) => typeof p.nutriments?.[m.offKey] === 'number')
      .map((m) => {
        const value = p.nutriments![m.offKey] * m.factor;
        return {
          nutrientId: m.nutrientId,
          value: Math.round(value * 100) / 100,
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
      update: {},
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
        verified: false,
        nutrients: { create: nutrients },
        allergens: { create: allergenRows.map((a) => ({ allergenId: a.id })) },
      },
      select: { id: true, name: true, nameZh: true, imageUrl: true, brand: { select: { name: true } } },
    });
  } catch {
    return null;
  }
}

async function createProductByAI(nameEn: string, nameZh: string, brand: string | null): Promise<ProductFindResult['product'] | null> {
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
  } catch {
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