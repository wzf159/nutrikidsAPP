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
import type { FastifyInstance } from "fastify";
import { NutriKidsScorer, type ReferenceData } from "./nutriKidsScorer";
import { searchProducts, getProductByBarcode } from "./openFoodFactsClient";

const REFERENCE_DATA_DIR = path.join(__dirname, "data"); // 按需改成你项目里的实际路径

function readJson<T>(filename: string): T {
  const filePath = path.join(REFERENCE_DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function loadReferenceData(): ReferenceData {
  return {
    categoryNutritionStats: readJson("category_nutrition_stats.json"),
    nutrientGoalMapping: readJson("nutrient_goal_mapping.json"),
    ageGenderWeightSummary: readJson("age_gender_weight_summary.json"),
    harmfulAdditiveTags: readJson("harmful_additives_reference.json"),
    categoriesParents: readJson("categories_parents.json"),
  };
}

/**
 * 注册到 Fastify app 上，例如:
 *   import { registerFoodScoringRoutes } from "./food-scoring";
 *   registerFoodScoringRoutes(app);
 */
export function registerFoodScoringRoutes(app: FastifyInstance) {
  // 启动时只加载一次，常驻内存，不要放进请求处理函数里
  const referenceData = loadReferenceData();
  const scorer = new NutriKidsScorer(referenceData);

  // GET /api/food/search?q=oreo
  app.get<{ Querystring: { q?: string } }>("/api/food/search", async (request, reply) => {
    const query = request.query.q;
    if (!query) {
      return reply.status(400).send({ error: "缺少查询参数 q" });
    }
    const results = await searchProducts(query);
    return { results };
  });

  // GET /api/food/score?barcode=xxx&age_group=4-8 years&gender=Female&alpha=0.5
  app.get<{
    Querystring: { barcode?: string; age_group?: string; gender?: string; alpha?: string };
  }>("/api/food/score", async (request, reply) => {
    const { barcode, age_group: ageGroup, gender, alpha } = request.query;
    if (!barcode || !ageGroup || !gender) {
      return reply.status(400).send({ error: "缺少 barcode / age_group / gender" });
    }

    const product = await getProductByBarcode(barcode);
    if (!product) {
      return reply.status(404).send({ error: `Open Food Facts 上查不到条码 ${barcode}` });
    }

    const result = scorer.computeFinalScore(
      product,
      ageGroup,
      gender,
      alpha ? Number(alpha) : 0.5
    );
    // debug 字段是给你调试用的详细计算过程日志，正式返回给前端时建议去掉:
    // const { debug, ...publicResult } = result; return publicResult;
    return result;
  });
}
