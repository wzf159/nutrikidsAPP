/**
 * 封装对 Open Food Facts 公开 API 的调用：
 * - searchProducts(query): 按关键词搜索，给前端做"搜索结果列表"用
 * - getProductByBarcode(barcode): 按条码查详情，转换成 NutriKidsScorer 需要的 Product 格式
 *
 * 没有做任何本地缓存——如果你们请求量大，建议在 Fastify 这层加一个简单的
 * TTL 内存缓存(比如 Map<barcode, {product, fetchedAt}>)，避免同一个产品
 * 被反复打分时重复打 OFF API。
 */

import type { NutrientEntry, Product } from "./nutriKidsScorer.js";

const BASE_URL = "https://world.openfoodfacts.org";

export interface SearchResultItem {
  barcode: string;
  productName: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
}

/** 按关键词搜索产品，返回给前端做候选列表用的精简结果。 */
export async function searchProducts(query: string, pageSize = 10): Promise<SearchResultItem[]> {
  const url = new URL(`${BASE_URL}/cgi/search.pl`);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set(
    "fields",
    "code,product_name,image_front_small_url,nutriscore_grade"
  );

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`OFF search failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { products?: any[] };

  return (data.products ?? []).map((p) => ({
    barcode: p.code,
    productName: p.product_name ?? null,
    imageUrl: p.image_front_small_url ?? null,
    nutriscoreGrade: p.nutriscore_grade ?? null,
  }));
}

/**
 * 按条码查详情，转换成 NutriKidsScorer.computeFinalScore() 需要的 Product 格式。
 * 返回 null 表示 OFF 上查不到这个条码。
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const fields = [
    "code",
    "product_name",
    "categories_tags",
    "nutriments",
    "nutriscore_grade",
    "nutriscore_score",
    "ingredients_tags",
    "ingredients_text",
    "allergens",
    "allergens_tags",
    "traces",
    "traces_tags",
  ].join(",");

  const url = `${BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OFF product lookup failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { status: number; product?: any };
  if (data.status !== 1 || !data.product) return null;

  return mapOffProductToProduct(data.product);
}

/** 把 OFF 原始 product 对象转换成 NutriKidsScorer 用的 Product 格式。 */
export function mapOffProductToProduct(offProduct: any): Product {
  // OFF 的 nutriments 对象长这样: { "carbohydrates_100g": 12.3, "energy-kcal_100g": 250, ... }
  // 我们只要 "_100g" 结尾的字段，把后缀去掉当作 nutrient_tag(跟 nutrient_goal_mapping.csv 里的
  // nutrient_tag 是同一套 OFF 命名，能直接对上)。
  const nutrients: NutrientEntry[] = [];
  const nutriments = offProduct.nutriments ?? {};
  for (const [key, value] of Object.entries(nutriments)) {
    if (key.endsWith("_100g") && typeof value === "number") {
      const name = key.slice(0, -"_100g".length);
      nutrients.push({ name, value100g: value });
    }
  }

  return {
    barcode: offProduct.code,
    productName: offProduct.product_name ?? null,
    categoriesTags: offProduct.categories_tags ?? [],
    nutriscoreGrade: offProduct.nutriscore_grade ?? null,
    nutriscoreScore:
      offProduct.nutriscore_score === undefined
        ? null
        : offProduct.nutriscore_score,
    nutrients,
  
    ingredientsTags: offProduct.ingredients_tags ?? [],
    ingredientsText: offProduct.ingredients_text ?? null,
  
    allergens: offProduct.allergens ?? null,
    allergenTags: offProduct.allergens_tags ?? [],
  
    traces: offProduct.traces ?? null,
    traceTags: offProduct.traces_tags ?? [],
  };
}