import { prisma } from './prisma.js';
import { computeDevScoreV2, computeGoalScoresV2 } from './scoring/devScoreV2.js';
import { computeAdditiveScoreV2 } from './scoring/additiveScoreV2.js';
import { hasAdditiveCategory } from './scoring/additiveCategories.js';
import { OFF_NUTRIENT_MAP } from './productFinder.js';

// nutrients 字典 ID（见 seed.ts）
const SUGAR_NUTRIENT_ID = 15;
const ENERGY_NUTRIENT_ID = 16;
const SATURATED_FAT_NUTRIENT_ID = 17;
const SODIUM_NUTRIENT_ID = 18;

// 前端正向营养素列表中排除的项目。
// 总脂肪并不必然是儿童饮食中的负面营养素，因此这里只排除糖、能量、饱和脂肪和钠。
const EXCLUDED_FROM_POSITIVE_NUTRIENTS = new Set<number>([
  SUGAR_NUTRIENT_ID,
  ENERGY_NUTRIENT_ID,
  SATURATED_FAT_NUTRIENT_ID,
  SODIUM_NUTRIENT_ID,
]);



type DevTier = 'core' | 'important' | 'supporting';
const DEV_TIERS: Record<number, { male: DevTier | null; female: DevTier | null }[]> = {
  // 1 🧠 Brain Development
  1: [{ male: 'core', female: 'core' }, { male: 'core', female: 'core' }, { male: 'core', female: 'core' }, { male: 'important', female: 'important' }, { male: 'supporting', female: 'important' }, { male: 'supporting', female: 'important' }],
  // 2 🦴 Bone Development
  2: [{ male: 'supporting', female: 'supporting' }, { male: 'important', female: 'important' }, { male: 'important', female: 'important' }, { male: 'core', female: 'core' }, { male: 'core', female: 'core' }, { male: 'core', female: 'core' }],
  // 3 📏 Heart Growth
  3: [{ male: null, female: null }, { male: null, female: null }, { male: 'important', female: 'important' }, { male: 'important', female: 'important' }, { male: 'important', female: 'important' }, { male: 'important', female: 'core' }],
  // 4 💪 Muscle Development
  4: [{ male: null, female: null }, { male: 'supporting', female: 'supporting' }, { male: 'supporting', female: 'supporting' }, { male: 'important', female: 'important' }, { male: 'core', female: 'important' }, { male: 'core', female: 'important' }],
  // 5 🛡️ Immune Development
  5: [{ male: 'important', female: 'important' }, { male: 'important', female: 'important' }, { male: 'core', female: 'core' }, { male: 'important', female: 'important' }, { male: 'important', female: 'important' }, { male: 'important', female: 'important' }],
  // 6 🦠 Gut Development
  6: [{ male: 'core', female: 'core' }, { male: 'core', female: 'core' }, { male: 'core', female: 'core' }, { male: 'supporting', female: 'supporting' }, { male: 'supporting', female: 'supporting' }, { male: 'supporting', female: 'important' }],
  // 7 👀 Vision Development
  7: [{ male: 'core', female: 'core' }, { male: 'core', female: 'core' }, { male: 'important', female: 'important' }, { male: 'supporting', female: 'supporting' }, { male: null, female: null }, { male: null, female: null }],
  // 8 🦷 Dental Development
  8: [{ male: null, female: null }, { male: 'supporting', female: 'supporting' }, { male: 'important', female: 'important' }, { male: 'important', female: 'important' }, { male: 'important', female: 'important' }, { male: 'core', female: 'core' }],
};

function stageIdx(stageKey: string | null): number {
  const map: Record<string, number> = {
    '0-6m': 0, '7-12m': 1, '1-3y': 2, '4-8y': 3, '9-13y': 4, '14-18y': 5,
  };
  return map[stageKey ?? ''] ?? 3;
}

const WEIGHTS = {
  nutrientDensity: 0.4,
  riskIngredients: 0.3,
  processingLevel: 0.2,
  stageMatch: 0.1,
} as const;

// 发育目标 ↔ 营养素 静态映射（营养学常识，后续可由营养师校准/入库）
export const GOAL_NUTRIENT_MAP: Record<number, number[]> = {
  // 🧠 Brain
  // DHA / Choline / Iron / Folate / B12 / B6 / Zinc / Iodine
  1: [24, 25, 1, 28, 12, 31, 2, 29],

  // 🦴 Bone
  // Calcium / Vitamin D / Phosphorus / Magnesium / Protein / Vitamin K / Zinc
  2: [5, 6, 7, 23, 13, 33, 2],

  // ❤️ Heart Growth
  // Fiber / Potassium / Magnesium / DHA
  3: [22, 14, 23, 24],

  // 💪 Muscle
  // Protein / Iron / Zinc / Vitamin D / Magnesium /
  // Carbohydrates / Potassium / Creatine
  4: [13, 1, 2, 6, 23, 21, 14, 26],

  // 🛡️ Immune
  // Vitamin A / Vitamin C / Vitamin D / Zinc /
  // Iron / Protein / Selenium / DHA
  5: [11, 9, 6, 2, 1, 13, 10, 24],

  // 🦠 Gut
  // Fiber / Magnesium / Potassium / Carbohydrates / Vitamin D / Zinc
  6: [22, 23, 14, 21, 6, 2],

  // 👀 Vision
  // Vitamin A / DHA / Zinc / Vitamin E / Lutein
  7: [11, 24, 2, 32, 30],

  // 🦷 Dental
  // Calcium / Vitamin D / Phosphorus / Vitamin C /
  // Magnesium / Fluoride
  8: [5, 6, 7, 9, 23, 27],
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export interface ScoreInput {
  userId: string;
  childId: string;
  productId: number;
  source?: string;
  imagePath?: string | null;
}

function viewReferenceBasis(servingSize: string | null): string {
  return servingSize?.trim() || '100 g / 100 ml';
}

// 结合"孩子档案 × 产品事实"计算个性化评分，写入 analyses 全套明细，返回结果 + 前端视图数据。
export async function scoreFood(input: ScoreInput) {
  const { userId, childId, productId } = input;

  const [product, child, allGoals] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        nutrients: { include: { nutrient: true } },
        ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
        additives: { include: { additive: true } },
        allergens: { include: { allergen: true } },
      },
    }),
    prisma.child.findUnique({
      where: { id: childId },
      include: {
        goals: { include: { goal: true } },
        nutrients: true,
        allergens: { include: { allergen: true } },
      },
    }),
    prisma.developmentGoal.findMany({ orderBy: { id: 'asc' } }),
  ]);

  if (!product) throw Object.assign(new Error('产品不存在'), { statusCode: 404 });
  if (!child) throw Object.assign(new Error('孩子不存在'), { statusCode: 404 });



  const prodNutr = product.nutrients;
  console.log('product nutrients length:', product?.nutrients?.length);
  
  const sugarDV = prodNutr.find((n: { nutrientId: number; dailyValue: number | null }) => n.nutrientId === SUGAR_NUTRIENT_ID)?.dailyValue ?? 0;
  const sugarG = prodNutr.find((n: { nutrientId: number; value: number | null }) => n.nutrientId === SUGAR_NUTRIENT_ID)?.value ?? 0;

  // 1) 营养密度 (0..40)：糖/能量不计入
  const densityRaw = prodNutr
    .filter((n: { nutrientId: number }) => n.nutrientId !== SUGAR_NUTRIENT_ID && n.nutrientId !== ENERGY_NUTRIENT_ID)
    .reduce((s: number, n: { dailyValue: number | null }) => s + Number(n.dailyValue ?? 0), 0);
  const nutrientDensity = clamp(Math.round(densityRaw * 0.5), 0, 40);

  // 2) 风险成分 (0..30)：满分起扣
  const badAdditives = product.additives.filter((a: { additive: { type: string | null } }) => a.additive.type !== 'beneficial');
  const riskIngredients = clamp(30 - sugarDV * 0.6 - badAdditives.length * 2, 0, 30);

  // 3) 加工程度 (0..20)：NOVA 越低越好
  const novaMap: Record<number, number> = { 1: 20, 2: 17, 3: 15, 4: 8 };
  const processingLevel = novaMap[product.novaScore ?? 4] ?? 8;

  // 4) 阶段匹配 (0..10)：产品营养素与孩子关键营养素重合度
  const childNutrIds = new Set(child.nutrients.map((c: { nutrientId: number }) => c.nutrientId));
  const matched = prodNutr.filter((n: { nutrientId: number; dailyValue: number | null }) => childNutrIds.has(n.nutrientId) && Number(n.dailyValue ?? 0) >= 10).length;
  const stageMatch = clamp(Math.round((matched / Math.max(childNutrIds.size, 1)) * 10), 0, 10);


  // Step A: DevScore
  // computeDevScoreV2 / computeGoalScoresV2 必须使用 notebook 原始规则：
  // 遍历全部 categoriesTags，收集所有可用 p10 / p90，并分别取中位数；不进行分类树父级遍历。
  const genderKey = child.gender === 'girl' ? 'female' : 'male';
  const ageIdx = stageIdx(child.stageKey);

  // nutrientId -> OFF nutrient_tag 反查表(从 OFF_NUTRIENT_MAP 派生,单一数据源,不会跟入库逻辑走偏)
  const nutrientIdToTag: Record<number, string> = {};
  for (const m of OFF_NUTRIENT_MAP) {
    nutrientIdToTag[m.nutrientId] = m.offKey.replace(/_100g$/, '');
  }

  // 产品营养素 nutrient_tag → 每100g原始值 map(DevScore 用,单位口径跟 category_nutrition_stats.json 一致)
  const nutrientValuesByTag: Record<string, number> = {};
  for (const n of prodNutr as any[]) {
    const tag = nutrientIdToTag[n.nutrientId];
    const value100g = Number(n.value100g);
    if (tag && n.value100g != null && Number.isFinite(value100g)) {
      nutrientValuesByTag[tag] = value100g;
    }
  }

  // 产品的 OFF 分类数组。旧数据没有 categoriesTagsJson 或 JSON 格式错误时按空数组处理；
  // 此时没有可用分类统计，相关营养素会跳过，goalScore 记为 0，不会报错。
  let categoriesTags: string[] = [];
  try {
    const parsed = product.categoriesTagsJson
      ? JSON.parse(product.categoriesTagsJson)
      : [];

    categoriesTags = Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    categoriesTags = [];
  }

  const devScoreDebug: string[] = [];
  const devScore = computeDevScoreV2(
    { categoriesTags, nutrientValuesByTag, ageIdx, genderKey },
    devScoreDebug
  );
  console.log(devScoreDebug.join('\n'));

  // Step B: NutriNorm —— 还原 notebook 设计: 直接读 OFF 官方 nutriscore_score 换算,
  // 不再自己手动重算 Nutri-Score 的正负分(之前那套手动实现缺了水果/蔬菜/坚果这个
  // 维度,代码里自己也写了"暂缺,设0",精度不如 OFF 官方算好的分数)。
  //
  // 跟 notebook 一致: nutriscore_score 缺失,或者 nutriscore_grade 不是 a~e 之一,
  // 就判定这个产品"暂时没法评分",不再像之前那样硬凑一个退回值。
  if (product.nutriScore === null || product.nutriScore === undefined) {
    throw Object.assign(
      new Error('此产品缺少 Nutri-Score 分数(nutriscore_score),暂时无法评分'),
      { statusCode: 422 }
    );
  }
  const nutriNorm = Math.max(0, Math.min(1, (55 - product.nutriScore) / 72));

  // Step C: FinalScore —— 按 Nutri-Score 等级分支(还原 notebook 原始设计):
  // A/B 用 DevScore 加分,C/D/E 用 additive_score 扣分。
  const alpha = 0.5;
  const nutriGradeLower = (product.nutriGrade ?? '').toLowerCase();

  let overallRaw: number;
  let additiveScore: number | null = null;

  if (nutriGradeLower === 'a' || nutriGradeLower === 'b') {
    overallRaw = 100 * (alpha * nutriNorm + (1 - alpha) * devScore);
  } else if (nutriGradeLower === 'c' || nutriGradeLower === 'd' || nutriGradeLower === 'e') {
    const additiveDebug: string[] = [];
    let additiveTagsForScore: string[] = [];
    try {
      additiveTagsForScore = product.additivesJson ? JSON.parse(product.additivesJson) : [];
    } catch {
      additiveTagsForScore = [];
    }
    additiveScore = computeAdditiveScoreV2(additiveTagsForScore, additiveDebug);
    console.log(additiveDebug.join('\n'));
    overallRaw = Math.max(0, 100 * (alpha * nutriNorm - (1 - alpha) * additiveScore));
  } else {
    // 等级既不是 a/b 也不是 c/d/e(比如缺失或者脏数据) —— 跟 notebook 一致,
    // 判定这个产品没法评分,不再硬凑一个退回值
    throw Object.assign(
      new Error(`nutriGrade='${product.nutriGrade}' 不是 a~e 之一,暂时无法评分`),
      { statusCode: 422 }
    );
  }

  console.log('DevScore:', devScore.toFixed(3));
  console.log('NutriNorm:', nutriNorm.toFixed(3));
  console.log('nutriGrade:', nutriGradeLower, 'additiveScore:', additiveScore);
  console.log('FinalScore:', overallRaw.toFixed(1));
  // 每日上限
  const sugarLimit = ageIdx === 0 ? 0 : ageIdx === 1 ? 0 : ageIdx === 2 ? 12 : 25;
  const sugarThreshold = ageIdx <= 1 ? 1 : ageIdx === 2 ? 3 : 5;

  // Sodium: WHO/CDC 建议
  const sodiumLimit = [200, 370, 800, 1200, 1500, 1800][ageIdx];
  const sodiumThreshold = [50, 100, 200, 300, 400, 500][ageIdx];
  // 0-6m: 50mg  7-12m: 100mg  1-3y: 200mg  4-8y: 300mg  9-13y: 400mg  14-18y: 500mg

  // Saturated Fat: 占每日热量 <10%，按年龄热量需求换算
  const satfatLimit = [null, null, 8, 10, 13, 16][ageIdx];
  const satfatThreshold = [1, 1, 2, 2.5, 3, 4][ageIdx];
  // 更严格，尤其婴幼儿

  const overall = Math.round(overallRaw);
  const grade = overall >= 80 ? 'Excellent' : overall >= 60 ? 'Good' : overall >= 40 ? 'Fair' : 'Poor';
  // 过敏命中
  const childAllergIds = new Set(child.allergens.map((a: { allergenId: number }) => a.allergenId));
  const allergenFlags = product.allergens.map((a: { allergenId: number; present: boolean }) => ({
    allergenId: a.allergenId,
    present: a.present,
    matchesChild: a.present && childAllergIds.has(a.allergenId),
  }));

  // 正负因素（示例规则）
  const factors: { kind: 'positive' | 'negative'; label: string }[] = [];
  if (nutrientDensity >= 25) factors.push({ kind: 'positive', label: 'High Nutrient Density' });
  if (processingLevel >= 17) factors.push({ kind: 'positive', label: 'Minimally Processed' });
  if (sugarDV >= 10) factors.push({ kind: 'negative', label: 'Added Sugar' });
  if (allergenFlags.some((f: { matchesChild: boolean }) => f.matchesChild))
    factors.push({ kind: 'negative', label: 'Contains Child Allergen' });

  // ---------------- 前端视图数据（FoodAnalyzer 页面） ----------------
  // 营养素列表：排除糖/能量，按 %DV 排序
  console.table(
    prodNutr.map(n => ({
      id: n.nutrientId,
      name: n.nutrient?.name,
      dv: n.dailyValue,
      value: n.value
    }))
  );
  const viewNutrients = prodNutr
    .filter(
      (n: { nutrientId: number }) =>
        !EXCLUDED_FROM_POSITIVE_NUTRIENTS.has(n.nutrientId)
    )
    .map((n) => ({
      id: n.nutrientId,
      name: n.nutrient.name,
      nameZh: n.nutrient.nameZh,
      icon: n.nutrient.icon,
      value: n.value,
      unit: n.unit,
      dailyValue: Number(n.dailyValue ?? 0),
      level: Number(n.dailyValue ?? 0) >= 20 ? 'High' : Number(n.dailyValue ?? 0) >= 10 ? 'Moderate' : 'Low',
    }))
    .filter((n: { dailyValue: number }) => n.dailyValue > 0)
    .sort((a: { dailyValue: number }, b: { dailyValue: number }) => b.dailyValue - a.dailyValue)
    .slice(0, 6);
  const viewNutrIds = new Set(viewNutrients.map((n: { id: number }) => n.id));

  // 目标支持度：用 DevScore 同一套算法算出每个目标单独的 goalScore(0~1),
  // 再按门槛分 Core/Important/Supporting 档位——不再用"最大单项%DV≥15%"的旧判定方式。
  // flows(具体贡献了哪些营养素,给弹窗展示用)还是走 %DV,这个跟 tier 判定是两回事,没有改。
  const childGoalIds = new Set(child.goals.map((g: { goalId: number }) => g.goalId));
  const dvOf = (nid: number) => Number(prodNutr.find((n: { nutrientId: number; dailyValue: number | null }) => n.nutrientId === nid)?.dailyValue ?? 0);

  const flows: { goalId: number; nutrientId: number; value: number }[] = [];
  for (const goalId of childGoalIds) {
    for (const nid of GOAL_NUTRIENT_MAP[goalId] ?? []) {
      const dv = dvOf(nid);
      if (dv > 0 && viewNutrIds.has(nid)) {
        flows.push({ goalId, nutrientId: nid, value: Math.round(dv) });
      }
    }
  }

  const goalScoresDebug: string[] = [];
  const goalScores = computeGoalScoresV2(
    { categoriesTags, nutrientValuesByTag, ageIdx, genderKey },
    goalScoresDebug
  );

  // DevScore 的单目标公式是 min(1, sum(sj))，适合参与总分，
  // 但不能直接拿来做前端 Core / Important / Supporting：
  // 多个目标会共享 Protein、Zinc、Vitamin D 等营养素，
  // 单个高分营养素可能把很多目标同时推到 1。
  //
  // 前端展示等级额外加入“真实营养证据数量”：
  // - Core:       goalScore >= 0.75 且至少 3 个映射营养素有有效贡献
  // - Important:  goalScore >= 0.45 且至少 2 个映射营养素有有效贡献
  // - Supporting: goalScore >= 0.20 且至少 1 个映射营养素有有效贡献
  //
  // 这里不改变 DevScore，只约束 UI 不要把一个营养素夸大成支持全部目标。
  const goalEvidence = (goalId: number) => {
    const mappedIds = GOAL_NUTRIENT_MAP[goalId] ?? [];

    const contributing = mappedIds
      .map((nutrientId) => {
        const nutrient = prodNutr.find(
          (n: { nutrientId: number }) => n.nutrientId === nutrientId
        );

        if (!nutrient) return null;

        const dailyValue = Number(nutrient.dailyValue ?? 0);
        const value100g = Number((nutrient as any).value100g ?? NaN);

        // %DV >= 5 视为有实际每份贡献；
        // 对没有 %DV 但有有效每100g原始值的数据，也保留为弱证据。
        const hasContribution =
          dailyValue >= 5 ||
          (Number.isFinite(value100g) && value100g > 0);

        if (!hasContribution) return null;

        return {
          nutrientId,
          dailyValue,
        };
      })
      .filter(
        (
          item
        ): item is {
          nutrientId: number;
          dailyValue: number;
        } => item !== null
      );

    return {
      count: contributing.length,
      contributing,
    };
  };

  const devTierOf = (goalId: number): DevTier | null => {
    if (!childGoalIds.has(goalId)) return null;
  
    const stageConfig = DEV_TIERS[goalId]?.[ageIdx];
  
    if (!stageConfig) return null;
  
    return genderKey === 'female'
      ? stageConfig.female
      : stageConfig.male;
  };

  const viewGoals = allGoals.map((g) => {
    const evidence = goalEvidence(g.id);
    const tier = devTierOf(g.id);

    // supportDV 是 UI 展示值，不参与最终 DevScore。
    // 使用证据覆盖率抑制“一个营养素让整个目标满分”的视觉误导。
    const mappedCount = Math.max((GOAL_NUTRIENT_MAP[g.id] ?? []).length, 1);
    const evidenceCoverage = Math.min(1, evidence.count / Math.min(mappedCount, 3));
    const displaySupport = (goalScores[g.id] ?? 0) * evidenceCoverage;

    return {
      id: g.id,
      icon: g.icon,
      label: g.label,
      labelZh: g.labelZh,
      selected: childGoalIds.has(g.id),
      tier,
      supportDV: Math.round(displaySupport * 100),
    };
  });
  console.table(
    allGoals.map(g => ({
      id: g.id,
      selected: childGoalIds.has(g.id),
      tier: devTierOf(g.id),
      score: goalScores[g.id],
    }))
  );
  // scoreFood 函数里，在 flows 计算之前加
  console.log('childGoalIds:', [...childGoalIds]);
  console.log('viewNutrIds:', [...viewNutrIds]);
  console.log('viewNutrients:', viewNutrients.map(n => ({ id: n.id, name: n.name, dv: n.dailyValue })));
  console.log('GOAL_NUTRIENT_MAP check:', [...childGoalIds].map(gid => ({
    goalId: gid,
    mappedNutrients: GOAL_NUTRIENT_MAP[gid] ?? [],
    matches: (GOAL_NUTRIENT_MAP[gid] ?? []).filter(nid => viewNutrIds.has(nid)),
  })));
  // 留意成分（8 固定槽位，规则可后续细化）
  const ingNames = product.ingredients.map((i: { ingredient: { name: string; nameZh: string | null } }) => `${i.ingredient.name} ${i.ingredient.nameZh ?? ''}`.toLowerCase());
  const hasIng = (re: RegExp) => ingNames.some((n: string) => re.test(n));
  const addNames = product.additives.map((a: { additive: { name: string; nameZh: string | null; type: string | null } }) => `${a.additive.name} ${a.additive.nameZh ?? ''} ${a.additive.type ?? ''}`.toLowerCase());
  const hasAdd = (re: RegExp) => addNames.some((n: string) => re.test(n));
  const rawAdditives: string[] = (() => {
    try { return product.additivesJson ? JSON.parse(product.additivesJson) : []; }
    catch { return []; }
  })();
  const hasRawAdditive = (codes: string[]) =>
    codes.some(c => rawAdditives.includes(`en:${c.toLowerCase()}`));

  const sugarNutrient = prodNutr.find(
    (n: any) => n.nutrientId === SUGAR_NUTRIENT_ID
  );
  const sodiumNutrient = prodNutr.find(
    (n: any) => n.nutrientId === SODIUM_NUTRIENT_ID
  );
  const satfatNutrient = prodNutr.find(
    (n: any) => n.nutrientId === SATURATED_FAT_NUTRIENT_ID
  );

  const watch = [
    // NOVA 1（未加工天然食物）的糖是天然糖，不计为"添加糖"
    {
      code: 'added_sugar', icon: '🍬', name: 'Added Sugar', nameZh: '添加糖',
      present: sugarG >= sugarThreshold && (product.novaScore ?? 4) >= 2,
      value: Number(sugarNutrient?.value ?? sugarG ?? 0),
      unit: sugarNutrient?.unit ?? 'g',
      dailyValue: Number(sugarNutrient?.dailyValue ?? 0),
      ageLimit: sugarLimit,
      ageLimitUnit: 'g',
      threshold: sugarThreshold,
      referenceBasis: viewReferenceBasis(product.servingSize),
      detail: sugarLimit === 0
        ? `${sugarNutrient?.dailyValue ?? 0}% DV sugar per serving — added sugar is not recommended for this age group.`
        : `${sugarNutrient?.dailyValue ?? 0}% of daily sugar limit per serving (limit: ${sugarLimit}g).`,
      detailZh: sugarLimit === 0
        ? `每份糖分占每日参考值的${sugarNutrient?.dailyValue ?? 0}%，该年龄段不建议摄入添加糖。`
        : `每份糖分占每日上限的${sugarNutrient?.dailyValue ?? 0}%（上限：${sugarLimit}g）。`,
    },
    {
      code: 'flavors', icon: '🧪', name: 'Artificial Flavors', nameZh: '人工香精',
      present: hasIng(/flavor|extract|香精|香草提取/) || hasAdd(/flavor/) ||
        hasRawAdditive(['e620', 'e621', 'e622', 'e623', 'e624', 'e625', 'e635']),
      detail: 'Contains artificial flavoring. Generally recognized as safe, but indicates processing.',
      detailZh: '含添加香精/提取物。一般认为安全，但属于加工标志成分。'
    },
    {
      code: 'colors', icon: '🎨', name: 'Artificial Colors', nameZh: '人工色素',
      present: hasAdd(/color|色素/) || hasIng(/color|色素/) ||
        hasRawAdditive(['e102', 'e110', 'e122', 'e124', 'e129', 'e133', 'e150a', 'e150b', 'e150c', 'e150d', 'e151', 'e160']),
      detail: 'Contains artificial colors. Some are linked to hyperactivity in sensitive children.',
      detailZh: '含人工色素，部分色素与敏感儿童多动相关。'
    },
    {
      code: 'preservatives', icon: '⚗️', name: 'Preservatives', nameZh: '防腐剂',
      present: hasAdd(/preservative|防腐/) || hasIng(/benzoate|sorbate|防腐/) || hasRawAdditive(['e200', 'e202', 'e210', 'e211', 'e212', 'e213', 'e220', 'e249', 'e250', 'e251', 'e252']),
      detail: 'Contains preservatives.', detailZh: '含防腐剂。'
    },
    {
      code: 'sodium', icon: '🧂', name: 'Sodium', nameZh: '钠',
      present: Number(sodiumNutrient?.value ?? 0) > sodiumThreshold,
      value: Number(sodiumNutrient?.value ?? 0),
      unit: sodiumNutrient?.unit ?? 'mg',
      dailyValue: Number(sodiumNutrient?.dailyValue ?? 0),
      ageLimit: sodiumLimit,
      ageLimitUnit: 'mg',
      threshold: sodiumThreshold,
      referenceBasis: viewReferenceBasis(product.servingSize),
      detail: `${sodiumNutrient?.dailyValue ?? 0}% DV sodium per serving — daily limit for this age is ${sodiumLimit}mg.`,
      detailZh: `每份钠含量占每日参考值的${sodiumNutrient?.dailyValue ?? 0}%，该年龄段每日上限为${sodiumLimit}mg。`
    },
    {
      code: 'satfat', icon: '🥩', name: 'Saturated Fat', nameZh: '饱和脂肪',
      present: Number(satfatNutrient?.value ?? 0) > satfatThreshold,
      value: Number(satfatNutrient?.value ?? 0),
      unit: satfatNutrient?.unit ?? 'g',
      dailyValue: Number(satfatNutrient?.dailyValue ?? 0),
      ageLimit: satfatLimit,
      ageLimitUnit: 'g',
      threshold: satfatThreshold,
      referenceBasis: viewReferenceBasis(product.servingSize),
      detail: satfatLimit === null
        ? `${satfatNutrient?.dailyValue ?? 0}% DV saturated fat per serving — limit not established for this age group.`
        : `${satfatNutrient?.dailyValue ?? 0}% DV saturated fat per serving — daily limit for this age is ${satfatLimit}g.`,
      detailZh: satfatLimit === null
        ? `每份饱和脂肪占每日参考值的${satfatNutrient?.dailyValue ?? 0}%，该年龄段暂无明确上限。`
        : `每份饱和脂肪占每日参考值的${satfatNutrient?.dailyValue ?? 0}%，该年龄段每日上限为${satfatLimit}g。`,
    },
    {
      code: 'transfat', icon: '⛽', name: 'Trans Fat', nameZh: '反式脂肪',
      present: hasIng(/hydrogenated|氢化/) || hasRawAdditive(['e471', 'e472']),
      detail: 'Contains hydrogenated oils.',
      detailZh: '含氢化油脂。'
    },
    {
      code: 'hfcs', icon: '🌽', name: 'High Fructose Corn Syrup', nameZh: '果葡糖浆', present: hasIng(/fructose corn|果葡|高果糖/),
      detail: 'Contains high fructose corn syrup.', detailZh: '含果葡糖浆。'
    },
    // ↓↓↓ 新增: 抗氧化剂/酸度调节剂/增稠乳化剂/增味剂/甜味剂
    // present 判断依据 additive_categories.json(跟前端 ADDITIVE_DICT 生成用同一套E编号分类规则)
    {
      code: 'antioxidants', icon: '🍊', name: 'Antioxidants', nameZh: '抗氧化剂',
      present: hasAdditiveCategory(rawAdditives, 'Antioxidant'),
      detail: 'Contains antioxidant additives, commonly used to slow oxidation and extend shelf life.',
      detailZh: '含抗氧化剂类添加剂，常用于延缓氧化、延长保质期。',
    },
    {
      code: 'acidity_regulators', icon: '🔮', name: 'Acidity Regulators', nameZh: '酸度调节剂',
      present: hasAdditiveCategory(rawAdditives, 'Acidity Regulator'),
      detail: 'Contains acidity regulator additives, used to control pH or stabilize flavor.',
      detailZh: '含酸度调节剂类添加剂，用于控制酸碱度或稳定风味。',
    },
    {
      code: 'thickeners_emulsifiers', icon: '🥣', name: 'Thickeners / Emulsifiers', nameZh: '增稠剂/乳化剂',
      present: hasAdditiveCategory(rawAdditives, 'Thickener'),
      detail: 'Contains thickener/emulsifier additives, used to adjust texture or help ingredients blend.',
      detailZh: '含增稠剂/乳化剂类添加剂，用于调整口感质地或帮助成分融合。',
    },
    {
      code: 'flavor_enhancers', icon: '🍥', name: 'Flavor Enhancers', nameZh: '增味剂',
      present: hasAdditiveCategory(rawAdditives, 'Flavor Enhancer'),
      detail: 'Contains flavor enhancer additives (such as MSG-type compounds).',
      detailZh: '含增味剂类添加剂（比如味精类化合物）。',
    },
    {
      code: 'sweeteners', icon: '🍭', name: 'Sweeteners', nameZh: '甜味剂',
      present: hasAdditiveCategory(rawAdditives, 'Sweetener'),
      detail: 'Contains non-sugar sweetener additives.',
      detailZh: '含非糖类甜味剂添加剂。',
    },
  ];
  console.log('Sodium value:', prodNutr.find((n: any) => n.nutrient.name === 'Sodium')?.value);
  const matchedAllergens = product.allergens
    .filter((a) => a.present && childAllergIds.has(a.allergenId))
    .map((a) => ({ code: a.allergen.code, name: a.allergen.name, nameZh: a.allergen.nameZh, icon: a.allergen.icon }));

  // 事务写入
  const analysis = await prisma.analysis.create({
    data: {
      userId,
      childId,
      productId,
      source: input.source ?? 'search',
      imagePath: input.imagePath ?? null,
      overallScore: overall,
      grade,
      whyText: `Scored ${overall}/100 for this child.`,
      whyTextZh: `针对该孩子综合评分 ${overall}/100。`,
      breakdown: {
        create: [
          { dimension: 'devScore', score: Math.round(devScore * 100), weight: alpha },
          { dimension: 'nutriNorm', score: Math.round(nutriNorm * 100), weight: alpha },
          { dimension: 'additiveScore', score: additiveScore !== null ? Math.round(additiveScore * 100) : null, weight: 1 - alpha },
        ],
      },
      factors: { create: factors },
      allergenFlags: { create: allergenFlags },
    },
    select: { id: true },
  });
  console.log('孩子过敏原:', child.allergens.map(
    item => ({
      id: item.allergen.id,
      code: item.allergen.code,
      name: item.allergen.name,
    })
  ));
  
  console.log('产品过敏原:', product.allergens.map(
    item => ({
      id: item.allergen.id,
      code: item.allergen.code,
      name: item.allergen.name,
    })
  ));
  
  console.log('匹配结果:', matchedAllergens);
  return {
    analysisId: analysis.id,
    overallScore: overall,
    grade,

    isAllergenSafe: matchedAllergens.length === 0,
    matchedAllergens,
    recommendation:
      matchedAllergens.length === 0
        ? 'recommended'
        : 'not_recommended',

    breakdown: { nutrientDensity, riskIngredients, processingLevel, stageMatch },
    factors,
    allergenFlags,
    view: {
      product: {
        id: product.id,
        name: product.name,
        nameZh: product.nameZh,
        brand: product.brand?.name ?? null,
        category: product.category?.name ?? null,
        categoryZh: product.category?.nameZh ?? null,
        imageUrl: product.imageUrl,
        novaScore: product.novaScore,
        servingSize: product.servingSize,
        verified: product.verified,
        isAiGenerated: !product.verified && product.barcode === null,

      },
      child: { id: child.id, name: child.name, age: child.age },
      allergenSafe: matchedAllergens.length === 0,
      matchedAllergens,
      goals: viewGoals,
      nutrients: viewNutrients,
      flows,
      watch,
      additiveTags: (() => {
        try {
          const tags: string[] = product.additivesJson ? JSON.parse(product.additivesJson) : [];
          return tags.map(tag => {
            const code = tag.replace('en:', '').toUpperCase();
            return { code, name: code, nameZh: code, type: 'additive' };
          });
        } catch {
          return [];
        }
      })(),
    },
  };
}