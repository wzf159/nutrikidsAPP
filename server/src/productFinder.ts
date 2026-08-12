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

export const TOTAL_SUGAR_NUTRIENT_ID = 15;
export const ADDED_SUGAR_NUTRIENT_ID = 34;

// NOTE:
// dvRef 暂时保留在映射结构中以兼容现有引用，但 productFinder 不再使用它计算 dailyValue。
// dailyValue / dailyReferencePercent 应由 scoring.ts 根据孩子年龄、性别和真实每份含量计算。
export const OFF_NUTRIENT_MAP: { nutrientId: number; offKey: string; factor: number; unit: string; dvRef: number }[] = [
  { nutrientId: 13, offKey: 'proteins_100g', factor: 1, unit: 'g', dvRef: 30 },
  { nutrientId: TOTAL_SUGAR_NUTRIENT_ID, offKey: 'sugars_100g', factor: 1, unit: 'g', dvRef: 25 },
  { nutrientId: ADDED_SUGAR_NUTRIENT_ID, offKey: 'added-sugars_100g', factor: 1, unit: 'g', dvRef: 25 },
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
  // 反式脂肪：营养标签出现即记录（判定见 scoring.ts transfat）
  { nutrientId: 35, offKey: 'trans-fat_100g', factor: 1, unit: 'g', dvRef: 0 },
];

// ======================================================
// OFF allergen detection
// allergens_tags = 直接过敏原标注
// ingredients_tags / categories_tags = 补充检测
// ======================================================

const OFF_ALLERGEN_MAP: Record<string, string> = {
  // Gluten / gluten-containing cereals
  'en:gluten': 'gluten',
  'en:wheat': 'gluten',
  'en:wheat-flour': 'gluten',
  'en:whole-wheat-flour': 'gluten',
  'en:durum-wheat': 'gluten',
  'en:spelt': 'gluten',
  'en:rye': 'gluten',
  'en:barley': 'gluten',
  'en:oats': 'gluten',

  // Crustaceans
  'en:crustaceans': 'crustaceans',

  // Eggs
  'en:eggs': 'eggs',
  'en:egg': 'eggs',
  'en:egg-white': 'eggs',
  'en:egg-yolk': 'eggs',

  // Fish
  'en:fish': 'fish',

  // Peanuts
  'en:peanuts': 'peanuts',
  'en:peanut': 'peanuts',
  'en:peanut-butter': 'peanuts',
  'en:peanut-oil': 'peanuts',

  // Soy
  'en:soybeans': 'soybeans',
  'en:soybean': 'soybeans',
  'en:soy': 'soybeans',
  'en:soya': 'soybeans',
  'en:soy-protein': 'soybeans',
  'en:soy-lecithin': 'soybeans',

  // Milk / dairy
  'en:milk': 'milk',
  'en:dairy': 'milk',
  'en:cow-s-milk': 'milk',
  'en:cream': 'milk',
  'en:butter': 'milk',
  'en:whey': 'milk',
  'en:whey-protein': 'milk',
  'en:casein': 'milk',
  'en:caseinate': 'milk',

  // Tree nuts
  'en:nuts': 'nuts',
  'en:tree-nuts': 'nuts',
  'en:almonds': 'nuts',
  'en:almond': 'nuts',
  'en:hazelnuts': 'nuts',
  'en:hazelnut': 'nuts',
  'en:walnuts': 'nuts',
  'en:walnut': 'nuts',
  'en:cashew-nuts': 'nuts',
  'en:cashews': 'nuts',
  'en:cashew': 'nuts',
  'en:pecan-nuts': 'nuts',
  'en:pecans': 'nuts',
  'en:pecan': 'nuts',
  'en:brazil-nuts': 'nuts',
  'en:brazil-nut': 'nuts',
  'en:pistachio-nuts': 'nuts',
  'en:pistachios': 'nuts',
  'en:pistachio': 'nuts',
  'en:macadamia-nuts': 'nuts',
  'en:macadamia-nut': 'nuts',

  // Other major allergens
  'en:celery': 'celery',
  'en:mustard': 'mustard',
  'en:sesame-seeds': 'sesame-seeds',
  'en:sesame': 'sesame-seeds',
  'en:sulphur-dioxide-and-sulphites': 'sulphur-dioxide-and-sulphites',
  'en:sulphites': 'sulphur-dioxide-and-sulphites',
  'en:sulfites': 'sulphur-dioxide-and-sulphites',
  'en:lupin': 'lupin',
  'en:molluscs': 'molluscs',
  'en:mollusks': 'molluscs',
};

const NON_SPECIFIC_ALLERGEN_CATEGORY_TAGS = new Set<string>([
  'en:nuts-and-their-products',
  'en:legumes-and-their-products',
]);

function resolveOffAllergenCodes(product: {
  allergens_tags?: string[];
  ingredients_tags?: string[];
  categories_tags?: string[];
}): string[] {
  const directTags = product.allergens_tags ?? [];

  const ingredientTags = (product.ingredients_tags ?? [])
    .filter((tag) => Boolean(OFF_ALLERGEN_MAP[tag]));

  const categoryTags = (product.categories_tags ?? [])
    .filter(
      (tag) =>
        !NON_SPECIFIC_ALLERGEN_CATEGORY_TAGS.has(tag) &&
        Boolean(OFF_ALLERGEN_MAP[tag])
    );

  const uniqueCodes = [
    ...new Set(
      [...directTags, ...ingredientTags, ...categoryTags]
        .map((tag) => OFF_ALLERGEN_MAP[tag])
        .filter((code): code is string => Boolean(code))
    ),
  ];

  console.log('========== ALLERGEN DETECTION ==========');
  console.log('allergens_tags:', directTags);
  console.log('ingredient allergen tags:', ingredientTags);
  console.log('category allergen tags:', categoryTags);
  console.log('final allergen codes:', uniqueCodes);
  console.log('========================================');

  return uniqueCodes;
}



async function ensureAddedSugarNutrient(): Promise<void> {
  await prisma.nutrient.upsert({
    where: { id: ADDED_SUGAR_NUTRIENT_ID },
    create: {
      id: ADDED_SUGAR_NUTRIENT_ID,
      name: 'Added Sugars',
      nameZh: '添加糖',
      icon: '🍬',
      unit: 'g',
    },
    update: {
      name: 'Added Sugars',
      nameZh: '添加糖',
      icon: '🍬',
      unit: 'g',
    },
  });
}

type LocalBarcodeProduct = ProductFindResult['product'] & { updatedAt: Date };

const DEFAULT_OFF_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function offCacheTtlMs(): number {
  const configured = Number(process.env.OFF_PRODUCT_CACHE_TTL_MS);
  return Number.isFinite(configured) && configured >= 0
    ? configured
    : DEFAULT_OFF_CACHE_TTL_MS;
}

function publicProduct(product: LocalBarcodeProduct): ProductFindResult['product'] {
  const { updatedAt: _updatedAt, ...result } = product;
  return result;
}

async function findLocalByBarcode(barcode: string): Promise<LocalBarcodeProduct | null> {
  return prisma.product.findUnique({
    where: { barcode },
    select: {
      id: true,
      name: true,
      nameZh: true,
      imageUrl: true,
      updatedAt: true,
      brand: { select: { name: true } },
    },
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
function getServingFactor(servingSize?: string | null): number | null {
  if (!servingSize) return null;

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

  // 无法确定真实 serving 重量时，不做任何假设。
  // 特别不要把 “1 slice” 当成 1 g，也不要把缺失 serving 当成 100 g。
  return null;
}

export function buildOffNutrientRows(
  nutriments: Record<string, number> | undefined,
  servingSize?: string,
) {
  const servingFactor = getServingFactor(servingSize);

  return OFF_NUTRIENT_MAP
    .filter(
      (mapping) =>
        typeof nutriments?.[mapping.offKey] === 'number'
    )
    .map((mapping) => {
      // 例如 proteins_100g → proteins_serving
      const servingKey = mapping.offKey.replace(
        /_100g$/,
        '_serving'
      );

      const rawValue100g = Number(
        nutriments![mapping.offKey]
      );

      // 保留 OFF 原始 /100g 值
      // DevScore 继续使用这个
      const value100g =
        Math.round(rawValue100g * 1e8) / 1e8;

      let value: number | null = null;

      // ==================================================
      // ① 优先使用 OFF 自带的 *_serving
      // ==================================================
      const rawServingValue =
        nutriments?.[servingKey];

      if (
        typeof rawServingValue === 'number' &&
        Number.isFinite(rawServingValue)
      ) {
        value =
          Math.round(
            rawServingValue *
            mapping.factor *
            100
          ) / 100;
      }

      // ==================================================
      // ② OFF 没有 *_serving
      //    才自己用 100g × servingFactor
      // ==================================================
      else if (servingFactor !== null) {
        const convertedValue100g =
          rawValue100g * mapping.factor;

        value =
          Math.round(
            convertedValue100g *
            servingFactor *
            100
          ) / 100;
      }

      // ==================================================
      // ③ 两种方法都没有
      // ==================================================
      else {
        value = null;
      }

      return {
        nutrientId: mapping.nutrientId,

        // 每份含量
        value,

        // OFF 原始 /100g 数据
        // DevScore/category statistics 用
        value100g,

        unit: mapping.unit,

        // 不在 import 阶段计算
        dailyValue: null,
      };
    });
}

export function resolveOffNovaGroup(product: {
  nova_group?: number;
  nutriments?: Record<string, number>;
}): number | null {
  const canonical = product.nova_group;
  if (typeof canonical === 'number' && canonical >= 1 && canonical <= 4) {
    return canonical;
  }

  const nutrimentFallback = product.nutriments?.['nova-group_100g'];
  return typeof nutrimentFallback === 'number' &&
    nutrimentFallback >= 1 &&
    nutrimentFallback <= 4
    ? nutrimentFallback
    : null;
}

export async function syncProductFromOpenFoodFacts(
  barcode: string,
): Promise<ProductFindResult['product'] | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json` +
      '?fields=product_name,product_name_zh,brands,image_front_url,nova_group,nutriscore_grade,nutriscore_score,categories_tags,quantity,serving_size,nutriments,allergens_tags,ingredients_tags,additives_tags',
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
        ingredients_tags?: string[];
        additives_tags?: string[];
      };
    };
    if (data.status !== 1 || !data.product?.product_name) return null;
    const p = data.product;

    await ensureAddedSugarNutrient();
    const canonicalNovaGroup = resolveOffNovaGroup(p);
    const nutrimentNovaGroup = p.nutriments?.['nova-group_100g'];
    if (
      typeof p.nova_group === 'number' &&
      typeof nutrimentNovaGroup === 'number' &&
      p.nova_group !== nutrimentNovaGroup
    ) {
      console.warn(
        `OFF NOVA fields disagree for barcode=${barcode}: ` +
        `nova_group=${p.nova_group}, nutriments.nova-group_100g=${nutrimentNovaGroup}; ` +
        'using canonical nova_group.',
      );
    }
    console.log('OFF barcode result:', barcode, '-> name:', p.product_name, '| nameZh:', p.product_name_zh);
    let brandId: number | undefined;
    const brandName = p.brands?.split(',')[0]?.trim();
    if (brandName) {
      const brand = await prisma.brand.upsert({ where: { name: brandName }, create: { name: brandName }, update: {} });
      brandId = brand.id;
    }

    const nutrients = buildOffNutrientRows(p.nutriments, p.serving_size);
    const allergenCodes = resolveOffAllergenCodes(p);
    const allergenRows = allergenCodes.length > 0
      ? await prisma.allergen.findMany({
          where: { code: { in: allergenCodes } },
        })
      : [];

    console.log(
      'DB allergens found:',
      allergenRows.map((a) => ({ id: a.id, code: a.code, name: a.name }))
    );
    return prisma.product.upsert({
      where: { barcode },

      update: {
        name: p.product_name!,
        nameZh: p.product_name_zh || null,
        brandId,
        imageUrl: p.image_front_url ?? null,
        quantity: p.quantity ?? null,
        servingSize: p.serving_size ?? null,
        novaScore: canonicalNovaGroup,
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
        barcode,
        name: p.product_name!,
        nameZh: p.product_name_zh || null,
        brandId,
        imageUrl: p.image_front_url ?? null,
        quantity: p.quantity ?? null,
        servingSize: p.serving_size ?? null,
        novaScore: canonicalNovaGroup,
        nutriGrade: p.nutriscore_grade?.toUpperCase() ?? null,
        nutriScore:
          typeof p.nutriscore_score === 'number'
            ? p.nutriscore_score
            : null,
        verified: false,

        nutrients: {
          create: nutrients,
        },

        allergens: {
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

      select: {
        id: true,
        name: true,
        nameZh: true,
        imageUrl: true,
        brand: {
          select: {
            name: true,
          },
        },
      },
    });
  } catch (e) {
    console.error(`syncProductFromOpenFoodFacts 失败 (barcode=${barcode}):`, e);
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
        ingredients_tags?: string[];
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
    await ensureAddedSugarNutrient();
    const canonicalNovaGroup = resolveOffNovaGroup(p);
    console.log('OFF search result:', name, '->', p.product_name, 'nutrients:', Object.keys(p.nutriments ?? {}));
    if (!p.product_name) return null;

    let brandId: number | undefined;
    const brandName = p.brands?.split(',')[0]?.trim();
    if (brandName) {
      const brand = await prisma.brand.upsert({ where: { name: brandName }, create: { name: brandName }, update: {} });
      brandId = brand.id;
    }

    const nutrients = buildOffNutrientRows(p.nutriments, p.serving_size);



    const allergenCodes = resolveOffAllergenCodes(p);
    const allergenRows = allergenCodes.length > 0
      ? await prisma.allergen.findMany({
          where: { code: { in: allergenCodes } },
        })
      : [];

    console.log(
      'DB allergens found:',
      allergenRows.map((a) => ({ id: a.id, code: a.code, name: a.name }))
    );

    return prisma.product.upsert({
      where: { barcode: p.code ?? '' },
      update: {
        name: p.product_name!,
        nameZh: p.product_name_zh || null,
        brandId,
        imageUrl: p.image_front_url ?? null,
        quantity: p.quantity ?? null,
        servingSize: p.serving_size ?? null,
        novaScore: canonicalNovaGroup,
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
        servingSize: p.serving_size ?? null,
        novaScore: canonicalNovaGroup,
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

      // AI fallback 没有可靠的真实 serving size / age-specific reference，
      // 因此这里不写伪造的 %DV。
      dailyValue: null,
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
        servingSize: null,
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
    if (local) {
      const isStale = Date.now() - local.updatedAt.getTime() >= offCacheTtlMs();
      if (!isStale) return { product: publicProduct(local), source: 'local' };

      const refreshed = await syncProductFromOpenFoodFacts(barcode);
      if (refreshed) return { product: refreshed, source: 'openfoodfacts' };

      // OFF can be temporarily unavailable. Keep the product usable with the
      // last known local snapshot rather than failing the lookup.
      return { product: publicProduct(local), source: 'local' };
    }

    const off = await syncProductFromOpenFoodFacts(barcode);
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