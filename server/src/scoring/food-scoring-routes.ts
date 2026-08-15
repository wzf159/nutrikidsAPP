/**
 * 1) loadReferenceData(): Fastify 启动时读一次静态参考数据(JSON),常驻内存。
 * 2) 两个示例路由: GET /api/food/search 和 GET /api/food/score
 *
 * 这几个 JSON 文件是 Python 那边的转换脚本生成的:
 *   - convert_stats_to_json.py       -> category_nutrition_stats.json / nutrient_goal_mapping.json /
 *                                        age_gender_weight_summary.json / harmful_additives_reference.json
 *   - fetch_categories_taxonomy.py   -> categories_parents.json
 * 把这 5 个文件拷到你 Fastify 项目里能读到的路径(比如 src/data/)，
 * 然后把下面 REFERENCE_DATA_DIR 改成你自己的路径。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { NutriKidsScorer, type ReferenceData } from "./nutriKidsScorer.js";
import {
  searchProducts,
  getProductByBarcode,
} from "./openFoodFactsClient.js";
import { getHarmfulAdditives } from "./harmfulAdditives.js";

// ESM 里没有 __dirname，用 import.meta.url 换算出等价的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REFERENCE_DATA_DIR = path.join(__dirname, "data");

function readJson<T>(filename: string): T {
  const filePath = path.join(REFERENCE_DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function loadReferenceData(): ReferenceData {
  return {
    categoryNutritionStats: readJson("category_nutrition_stats.json"),
    nutrientGoalMapping: readJson("nutrient_goal_mapping.json"),
    ageGenderWeightSummary: readJson("age_gender_weight_summary.json"),
    harmfulAdditiveTags: getHarmfulAdditives().map((additive) => additive.tag),
    categoriesParents: readJson("categories_parents.json"),
  };
}

/**
 * 注册到 Fastify app 上，例如:
 *   import { registerFoodScoringRoutes } from "./food-scoring";
 *   registerFoodScoringRoutes(app);
 */
export function registerFoodScoringRoutes(app: FastifyInstance) {
  // 启动时只加载一次，常驻内存
  const referenceData = loadReferenceData();
  const scorer = new NutriKidsScorer(referenceData);

  // GET /api/food/search?q=oreo
  app.get<{
    Querystring: {
      q?: string;
    };
  }>("/api/food/search", async (request, reply) => {
    const query = request.query.q;

    if (!query) {
      return reply.status(400).send({
        error: "缺少查询参数 q",
      });
    }

    const results = await searchProducts(query);

    return {
      results,
    };
  });

  /**
   * 示例：
   *
   * GET /api/food/score
   *   ?barcode=3770008500518
   *   &age_group=4-8%20years
   *   &gender=Female
   *   &alpha=0.5
   *   &allergies=peanut,milk
   */
  app.get<{
    Querystring: {
      barcode?: string;
      age_group?: string;
      gender?: string;
      alpha?: string;
      allergies?: string;
    };
  }>("/api/food/score", async (request, reply) => {
    const {
      barcode,
      age_group: ageGroup,
      gender,
      alpha,
      allergies,
    } = request.query;

    if (!barcode || !ageGroup || !gender) {
      return reply.status(400).send({
        error: "缺少 barcode / age_group / gender",
      });
    }

    const parsedAlpha = alpha === undefined ? 0.5 : Number(alpha);

    if (!Number.isFinite(parsedAlpha) || parsedAlpha < 0 || parsedAlpha > 1) {
      return reply.status(400).send({
        error: "alpha 必须是 0 到 1 之间的数字",
      });
    }

    const childAllergens = allergies
      ? allergies
          .split(",")
          .map((allergen) => allergen.trim())
          .filter(Boolean)
      : [];

    const product = await getProductByBarcode(barcode);

    if (!product) {
      return reply.status(404).send({
        error: `Open Food Facts 上查不到条码 ${barcode}`,
      });
    }

    const result = scorer.computeFinalScore(
      product,
      ageGroup,
      gender,
      parsedAlpha,
      childAllergens
    );

    // debug 字段是详细计算过程，正式返回前端时可以去掉：
    // const { debug, ...publicResult } = result;
    // return publicResult;

    return result;
  });
}
