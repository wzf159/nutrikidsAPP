/**
 * NutriKidsScorer —— 儿童营养打分 (Node/TS 版)
 *
 * Port 自 Python 版 compute_final_score.py，算分逻辑完全一致，
 * 只是不再从本地 nutrition_facts_lookup.json 批量读产品，而是接收
 * 单个 Product 对象(实时从 Open Food Facts API 查到的)当场打分。
 *
 * 参考数据(category_nutrition_stats.json / nutrient_goal_mapping.json /
 * age_gender_weight_summary.json / harmful_additives_reference.json /
 * categories_parents.json)都是静态文件，建议在 Fastify 启动时读一次
 * 常驻内存(见本目录 loadReferenceData.ts 的示例)，不要每个请求都读盘。
 */

import { CategoryTaxonomy } from "./categoryTaxonomy.js";

// 跟 Python 版 gen_category_nutrition_stats.py 里的 MIN_N 保持一致即可,
// 这里只是双重保险,不是主要过滤点(category_nutrition_stats.json 生成阶段
// 就已经按 MIN_N 过滤过了)。
const MIN_N = 30;

export interface NutrientEntry {
  name: string;
  value100g: number | null;
}

export interface Product {
  barcode: string;
  productName?: string | null;
  categoriesTags: string[];
  nutriscoreGrade?: string | null;
  nutriscoreScore?: number | null;
  nutrients: NutrientEntry[];
  ingredientsTags: string[];
  ingredientsText?: string | null;

  allergens?: string | null;
  allergenTags?: string[];

  traces?: string | null;
  traceTags?: string[];
}
export interface AllergenCheckResult {
  isSafe: boolean;
  matchedAllergens: string[];
}
export interface NutrientGoalRow {
  age_group: string;
  gender: string;
  development_goal: string;
  weight: number;
  status: string; // "found" | "not_found"
  my_nutrient?: string;
  nutrient_tag?: string;
}

interface CategoryStat {
  n: number;
  p10: number | null;
  p90: number | null;
}

export interface ReferenceData {
  categoryNutritionStats: Record<string, Record<string, CategoryStat>>;
  nutrientGoalMapping: NutrientGoalRow[];
  ageGenderWeightSummary: Record<string, number>; // key: `${age_group}|${gender}`
  harmfulAdditiveTags: string[];
  categoriesParents: Record<string, string[]>;
}

export interface ScoreResult {
  barcode: string;
  productName?: string | null;
  nutriscoreGrade: string | null;
  nutriscoreScore: number | null;
  nutrinorm: number | null;
  ageGroup: string;
  gender: string;
  alpha: number;
  mode: "dev_score" | "additive_score" | "unknown_grade" | "no_nutriscore";
  devScore: number | null;
  additiveScore: number | null;
  finalScore: number | null;
  // 新增：过敏安全结果
  isAllergenSafe: boolean;
  matchedAllergens: string[];
  recommendation: "recommended" | "not_recommended";
  debug: string[];
}

export class NutriKidsScorer {
  private categoryStats: Record<string, Record<string, CategoryStat>>;
  private nutrientGoalMapping: NutrientGoalRow[];
  private ageGenderWeightSummary: Record<string, number>;
  private harmfulAdditiveTags: Set<string>;
  private taxonomy: CategoryTaxonomy;

  constructor(ref: ReferenceData) {
    this.categoryStats = ref.categoryNutritionStats;
    this.nutrientGoalMapping = ref.nutrientGoalMapping;
    this.ageGenderWeightSummary = ref.ageGenderWeightSummary;
    this.harmfulAdditiveTags = new Set(ref.harmfulAdditiveTags);
    this.taxonomy = new CategoryTaxonomy(ref.categoriesParents);
  }

  // ---------- Step B: NutriNorm ----------
  static computeNutrinorm(nutriscoreScore: number | null | undefined): number | null {
    if (nutriscoreScore === null || nutriscoreScore === undefined) return null;
    // NutriNorm = (55 - nutriscore_score) / (55 + 17)
    return (55 - nutriscoreScore) / 72;
  }

  private statsIfReliable(cat: string, nutrientTag: string): CategoryStat | null {
    const stat = this.categoryStats[cat]?.[nutrientTag];
    if (!stat) return null;
    if (stat.p10 === null || stat.p90 === null || stat.n < MIN_N) return null;
    return stat;
  }

  private lookupMostSpecificBounds(
    categoriesTags: string[],
    nutrientTag: string,
    log: (msg: string) => void
  ): { L: number; U: number } | null {
    const leaves = this.taxonomy.mostSpecificTags(categoriesTags);
    log(`    产品自身 categories_tags 里的叶子分类: ${JSON.stringify(leaves)}`);

    const found: { leaf: string; matchedCat: string; n: number; p10: number; p90: number }[] = [];
    for (const leaf of leaves) {
      const matchedCat = this.taxonomy.nearestAncestorWithData(
        leaf,
        (c: string) => this.statsIfReliable(c, nutrientTag) !== null
      );
      if (matchedCat === null) {
        log(`    - 叶子 ${leaf}: 一路爬到根都没有 n>=${MIN_N} 的可靠统计，此分支跳过`);
        continue;
      }
      const stat = this.statsIfReliable(matchedCat, nutrientTag)!;
      const hopNote = matchedCat === leaf ? "" : `(从 ${leaf} 往上爬到)`;
      log(
        `    - 叶子 ${leaf}: 命中 category=${matchedCat}${hopNote}, n=${stat.n}, p10=${stat.p10}, p90=${stat.p90}`
      );
      found.push({ leaf, matchedCat, n: stat.n, p10: stat.p10 as number, p90: stat.p90 as number });
    }

    if (found.length === 0) {
      log(`    所有分支都查不到可靠区间，跳过`);
      return null;
    }

    // 多个分支都找到时，取 n 最小(=最具体)的那个
    const best = found.reduce((a, b) => (b.n < a.n ? b : a));
    log(
      `    => 最终选用 category=${best.matchedCat}, n=${best.n} -> L_j=p10=${best.p10}, U_j=p90=${best.p90}`
    );
    return { L: best.p10, U: best.p90 };
  }

  // ---------- Step A: DevScore (只给 nutriscoreGrade 是 A/B 的产品用) ----------
  private computeDevScore(
    product: Product,
    ageGroup: string,
    gender: string,
    debug: string[]
  ): number {
    const log = (msg: string) => debug.push(msg);

    const nutrientsByTag = new Map<string, number>();
    for (const n of product.nutrients) {
      if (n.value100g !== null && n.value100g !== undefined) {
        nutrientsByTag.set(n.name, n.value100g);
      }
    }
    const categoriesTags = product.categoriesTags ?? [];

    log(`\n--- Step A: DevScore (age_group=${ageGroup}, gender=${gender}) ---`);
    log(`该产品的 categories_tags (${categoriesTags.length}个): ${JSON.stringify(categoriesTags)}`);

    const goalRows = this.nutrientGoalMapping.filter(
      (r) => r.age_group === ageGroup && r.gender === gender
    );
    const goalGroups = new Map<string, NutrientGoalRow[]>();
    for (const row of goalRows) {
      const list = goalGroups.get(row.development_goal) ?? [];
      list.push(row);
      goalGroups.set(row.development_goal, list);
    }

    const weightedGoalScores: number[] = [];
    for (const [goal, rows] of goalGroups) {
      const weight = rows[0].weight;
      if (weight === 0) {
        log(`\n[${goal}] weight=0(该年龄段/性别不适用)，跳过`);
        continue;
      }

      log(`\n[${goal}] weight=${weight}`);
      const sList: number[] = [];
      for (const row of rows) {
        if (row.status !== "found") {
          log(`  - ${row.my_nutrient}: not_found (OFF没有这个营养素的数据)，跳过`);
          continue;
        }
        const nutrientTag = row.nutrient_tag!;
        const xj = nutrientsByTag.get(nutrientTag);
        if (xj === undefined) {
          log(`  - ${row.my_nutrient} (${nutrientTag}): 产品没有测这个营养素，跳过`);
          continue;
        }

        log(`  - ${row.my_nutrient} (${nutrientTag}): x_j=${xj}`);
        const bounds = this.lookupMostSpecificBounds(categoriesTags, nutrientTag, log);
        if (bounds === null) continue;
        const { L: Lj, U: Uj } = bounds;

        let sj: number;
        if (Uj === Lj) {
          sj = xj >= Lj ? 1.0 : 0.0;
          log(`    L_j=U_j=${Lj}(退化情况) -> s_j=${sj.toFixed(3)}`);
        } else {
          sj = Math.min(1.0, Math.max(0.0, (xj - Lj) / (Uj - Lj)));
          log(`    -> s_j=clip((x_j-L_j)/(U_j-L_j))=${sj.toFixed(3)}`);
        }
        sList.push(sj);
      }

      const sSum = sList.reduce((a, b) => a + b, 0);
      const goalScore = sList.length > 0 ? Math.min(1.0, sSum) : 0.0;
      const weighted = goalScore * weight;
      weightedGoalScores.push(weighted);
      log(`  => GoalScore = min(1, sum(s_j)) = min(1, ${sSum.toFixed(3)}) = ${goalScore.toFixed(3)}`);
      log(`  => WeightedGoalScore = GoalScore x weight = ${goalScore.toFixed(3)} x ${weight} = ${weighted.toFixed(3)}`);
    }

    const sumW = this.ageGenderWeightSummary[`${ageGroup}|${gender}`];
    const sumWeighted = weightedGoalScores.reduce((a, b) => a + b, 0);
    log(`\nsum(WeightedGoalScore_i) = ${sumWeighted.toFixed(3)}`);
    log(`sum(w_i) (来自 age_gender_weight_summary, ${ageGroup}/${gender}) = ${sumW}`);
    if (!sumW) {
      log("sum(w_i) 是 0 或找不到，DevScore 记为 0");
      return 0.0;
    }
    const devScore = sumWeighted / sumW;
    log(`=> DevScore = ${sumWeighted.toFixed(3)} / ${sumW} = ${devScore.toFixed(4)}`);
    return devScore;
  }

  // ---------- C/D/E 产品: additiveScore ----------
  private computeAdditiveScore(product: Product, debug: string[]): number {
    const log = (msg: string) => debug.push(msg);

    const ingredientsTags = new Set(product.ingredientsTags ?? []);
    const hits = [...ingredientsTags].filter((t) => this.harmfulAdditiveTags.has(t));

    log("\n--- additive_score (Nutri-Score C/D/E) ---");
    log(`该产品 ingredients_tags 共 ${ingredientsTags.size} 个`);
    log(`参考表里有害添加剂总数 = ${this.harmfulAdditiveTags.size}`);
    log(hits.length > 0 ? `命中的有害添加剂 (${hits.length}个): ${JSON.stringify(hits)}` : "命中的有害添加剂: 无");

    if (this.harmfulAdditiveTags.size === 0) return 0.0;
    const score = hits.length / this.harmfulAdditiveTags.size;
    log(`=> additive_score = ${hits.length} / ${this.harmfulAdditiveTags.size} = ${score.toFixed(4)}`);
    return score;
  }

  // ---------- 总入口 ----------
  computeFinalScore(
    product: Product,
    ageGroup: string,
    gender: string,
    alpha = 0.5,
    childAllergens: string[] = []
  ): ScoreResult {
    const allergenResult = checkProductAllergens(
      product,
      childAllergens
    );
    const debug: string[] = [];
    const log = (msg: string) => debug.push(msg);

    const grade = (product.nutriscoreGrade ?? "").toLowerCase();
    const nutriscoreScore = product.nutriscoreScore ?? null;
    const nutrinorm = NutriKidsScorer.computeNutrinorm(nutriscoreScore);

    log("=".repeat(70));
    log(`barcode=${product.barcode}  product_name=${product.productName}`);
    log(`nutriscore_grade=${grade}  nutriscore_score=${nutriscoreScore}`);
    log(`age_group=${ageGroup}  gender=${gender}  alpha=${alpha}`);

    if (nutrinorm === null) {
      log("没有 nutriscore_score，算不了 NutriNorm，final_score = null");
      return {
        barcode: product.barcode,
        productName: product.productName,
        nutriscoreGrade: grade || null,
        nutriscoreScore,
        nutrinorm: null,
        ageGroup,
        gender,
        alpha,
        mode: "no_nutriscore",
        devScore: null,
        additiveScore: null,
        finalScore: null,
        isAllergenSafe: allergenResult.isSafe,
        matchedAllergens: allergenResult.matchedAllergens,
        recommendation: allergenResult.isSafe
          ? "recommended"
          : "not_recommended",
        debug,
      };
    }

    log(`\n--- Step B: NutriNorm = (55 - nutriscore_score) / 72 = ${nutrinorm.toFixed(4)} ---`);

    let finalScore: number;
    let mode: ScoreResult["mode"];
    let devScore: number | null = null;
    let additiveScore: number | null = null;

    if (grade === "a" || grade === "b") {
      devScore = this.computeDevScore(product, ageGroup, gender, debug);
      finalScore = 100 * (alpha * nutrinorm + (1 - alpha) * devScore);
      mode = "dev_score";
      log(
        `\n--- FinalScore = 100 x (alpha x NutriNorm + (1-alpha) x DevScore) = ${finalScore.toFixed(2)} ---`
      );
    } else if (grade === "c" || grade === "d" || grade === "e") {
      additiveScore = this.computeAdditiveScore(product, debug);
      finalScore = 100 * (alpha * nutrinorm - (1 - alpha) * additiveScore);
      mode = "additive_score";
      log(
        `\n--- FinalScore = 100 x (alpha x NutriNorm - (1-alpha) x additive_score) = ${finalScore.toFixed(2)} ---`
      );
      if (finalScore < 0) log(`(结果是负数，按规则封顶为0)`);
      finalScore = Math.max(0.0, finalScore);
    } else {
      log(`未知的 nutriscore_grade=${grade}，final_score = null`);
      return {
        barcode: product.barcode,
        productName: product.productName,
        nutriscoreGrade: grade || null,
        nutriscoreScore,
        nutrinorm,
        ageGroup,
        gender,
        alpha,
        mode: "unknown_grade",
        devScore: null,
        additiveScore: null,
        finalScore: null,
        isAllergenSafe: allergenResult.isSafe,
        matchedAllergens: allergenResult.matchedAllergens,
        recommendation: allergenResult.isSafe
          ? "recommended"
          : "not_recommended",
        debug,
      };
    }

    log(`\n>>> final_score = ${finalScore.toFixed(2)}`);
    log("=".repeat(70));

    return {
      barcode: product.barcode,
      productName: product.productName,
      nutriscoreGrade: grade,
      nutriscoreScore,
      nutrinorm,
      ageGroup,
      gender,
      alpha,
      mode,
      devScore,
      additiveScore,
      finalScore: Math.round(finalScore * 100) / 100,
      isAllergenSafe: allergenResult.isSafe,
      matchedAllergens: allergenResult.matchedAllergens,
      recommendation: allergenResult.isSafe
        ? "recommended"
        : "not_recommended",
      debug,
    };
  }
}

const ALLERGEN_ALIASES: Record<string, string[]> = {
  peanut: [
    "peanut",
    "peanuts",
    "en:peanut",
    "en:peanuts",
    "cacahuete",
    "cacahuetes",
    "cacahuète",
    "cacahuètes",
  ],

  nut: [
    "nut",
    "nuts",
    "en:nut",
    "en:nuts",
    "en:tree-nuts",
  ],

  milk: [
    "milk",
    "dairy",
    "en:milk",
    "en:dairy",
    "en:cow-s-milk",
    "lait",
  ],

  egg: [
    "egg",
    "eggs",
    "en:egg",
    "en:eggs",
    "oeuf",
    "oeufs",
    "œuf",
    "œufs",
  ],

  soy: [
    "soy",
    "soybean",
    "soybeans",
    "en:soy",
    "en:soybeans",
    "soja",
  ],

  wheat: [
    "wheat",
    "en:wheat",
    "gluten",
    "en:gluten",
    "ble",
    "blé",
  ],
};

function normalizeAllergenText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function checkProductAllergens(
  product: Product,
  childAllergens: string[]
): AllergenCheckResult {
  const productSources = [
    ...(product.allergenTags ?? []),
    ...(product.traceTags ?? []),
    ...(product.ingredientsTags ?? []),
    product.allergens ?? "",
    product.traces ?? "",
    product.ingredientsText ?? "",
  ]
    .map((value) => normalizeAllergenText(String(value)))
    .filter(Boolean);

  const matchedAllergens = childAllergens.filter((childAllergen) => {
    const normalizedChildAllergen =
      normalizeAllergenText(childAllergen);

    const aliases =
      ALLERGEN_ALIASES[normalizedChildAllergen] ??
      [normalizedChildAllergen];

    return aliases.some((alias) => {
      const normalizedAlias = normalizeAllergenText(alias);

      return productSources.some((source) => {
        if (source === normalizedAlias) return true;

        // OFF 标准 tag 使用精确匹配，避免 nut 误匹配 peanut
        if (source.startsWith("en:")) return false;

        // allergens、traces、ingredientsText 等普通文本允许包含匹配
        return source.includes(normalizedAlias);
      });
    });
  });

  return {
    isSafe: matchedAllergens.length === 0,
    matchedAllergens,
  };
}