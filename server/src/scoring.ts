import { prisma } from './prisma.js';
import { computeDevScoreV2 } from './scoring/devScoreV2.js';
import { OFF_NUTRIENT_MAP } from './productFinder.js';

// nutrients 字典中 "Sugars" 的 id（见 seed.ts）
const ENERGY_NUTRIENT_ID = 16;
const SUGAR_NUTRIENT_ID = 15;
const SATFAT_NUTRIENT_ID = 17;
const SODIUM_NUTRIENT_ID = 18;
const FIBER_NUTRIENT_ID = 22;
const PROTEIN_NUTRIENT_ID = 13;


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
  console.log('additivesJson:', product.additivesJson); 
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


  // Step A: DevScore (v2 — 分类层级爬树版本)
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
    if (tag && n.value100g != null) nutrientValuesByTag[tag] = Number(n.value100g);
  }

  // 产品的 OFF 分类数组(旧数据没有 categoriesTagsJson 时当空数组处理 →
  // DevScore 会因为爬不到任何分类而对每个营养素都跳过,goalScore 记为 0,不会报错)
  let categoriesTags: string[] = [];
  try {
    categoriesTags = product.categoriesTagsJson ? JSON.parse(product.categoriesTagsJson) : [];
  } catch {
    categoriesTags = [];
  }

  const devScoreDebug: string[] = [];
  const devScore = computeDevScoreV2(
    { categoriesTags, nutrientValuesByTag, ageIdx, genderKey },
    devScoreDebug
  );
  console.log(devScoreDebug.join('\n'));

  // Step B: NutriNorm（Nutri-Score 2014）
  // 需要 per 100g 数据，serving 数据近似处理
  const servingSizeG = (() => {
    const m = (product.servingSize ?? '').match(/\(?\s*(\d+(?:\.\d+)?)\s*g\s*\)?/i);
    if (m) return parseFloat(m[1]);
    const fallback = parseFloat(product.servingSize ?? '100');
    return fallback > 0 ? fallback : 100;
  })();
  const per100 = (val: number | null) => val != null ? (val / servingSizeG) * 100 : 0;


  
  const energyKJ = per100(prodNutr.find((n: any) => n.nutrientId === ENERGY_NUTRIENT_ID)?.value ?? null) * 4.184;
  const sugarG100 = per100(prodNutr.find((n: any) => n.nutrientId === SUGAR_NUTRIENT_ID)?.value ?? null);
  const satFatG100 = per100(prodNutr.find((n: any) => n.nutrientId === SATFAT_NUTRIENT_ID)?.value ?? null);
  const saltG100 = (per100(prodNutr.find((n: any) => n.nutrientId === SODIUM_NUTRIENT_ID)?.value ?? null) * 2.5) / 1000;
  const fiberG100 = per100(prodNutr.find((n: any) => n.nutrientId === FIBER_NUTRIENT_ID)?.value ?? null);
  const proteinG100 = per100(prodNutr.find((n: any) => n.nutrientId === PROTEIN_NUTRIENT_ID)?.value ?? null);
  // Negative points
  const negEnergy = Math.min(10, Math.floor(energyKJ / 335));
  const negSugar = Math.min(15, Math.floor(sugarG100 / 4.5));
  const negSatFat = Math.min(10, Math.floor(satFatG100 / 1));
  const negSalt = Math.min(20, Math.floor(saltG100 / 0.2));
  const negative = negEnergy + negSugar + negSatFat + negSalt;

  // Positive points
  const posFiber = Math.min(5, Math.floor(fiberG100 / 0.9));
  const posProtein = Math.min(5, Math.floor(proteinG100 / 1.6));
  const positive = posFiber + posProtein; // 水果/蔬菜比例暂缺，设0

  const nutriNorm = Math.max(0, Math.min(1, (positive - negative + 55) / 72));

  // Step C: FinalScore
  const b = 0.6;

  console.log('DevScore:', devScore.toFixed(3));
  console.log('NutriNorm:', nutriNorm.toFixed(3));
  console.log('FinalScore:', (100 * nutriNorm * (b + (1 - b) * devScore)).toFixed(1));
  console.log('negative:', negative, 'positive:', positive);
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

  const overall = Math.round(100 * nutriNorm * (b + (1 - b) * devScore));
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
  
  const NEGATIVE_NUTRIENTS = new Set([17, 18, 19, 21]);// Saturated Fat, Sodium, Fat

  // ---------------- 前端视图数据（FoodAnalyzer 页面） ----------------
  // 营养素列表：排除糖/能量，按 %DV 排序
  const viewNutrients = prodNutr
    .filter((n: { nutrientId: number }) => n.nutrientId !== SUGAR_NUTRIENT_ID 
    && n.nutrientId !== ENERGY_NUTRIENT_ID 
    && !NEGATIVE_NUTRIENTS.has(n.nutrientId) )
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

  // 目标支持度：对孩子选定的每个目标，累计映射营养素的 %DV
  const childGoalIds = new Set(child.goals.map((g: { goalId: number }) => g.goalId));
  const dvOf = (nid: number) => Number(prodNutr.find((n: { nutrientId: number; dailyValue: number | null }) => n.nutrientId === nid)?.dailyValue ?? 0);

  const flows: { goalId: number; nutrientId: number; value: number }[] = [];
  const goalSupport: Record<number, number> = {}; // 现在存的是该目标映射营养素里的最大单项 %DV，不再是累加总和
  for (const goalId of childGoalIds) {
    for (const nid of GOAL_NUTRIENT_MAP[goalId] ?? []) {
      const dv = dvOf(nid);
      if (dv > 0 && viewNutrIds.has(nid)) {
        flows.push({ goalId, nutrientId: nid, value: Math.round(dv) });
        goalSupport[goalId] = Math.max(goalSupport[goalId] ?? 0, dv);
      }
    }
  }



  const SUPPORT_DV_THRESHOLD = 15; // 该目标映射营养素里，至少一项要达到每日推荐量的 15%
  const devTierOf = (goalId: number): DevTier | null => {
    if (!childGoalIds.has(goalId)) return null;
    if ((goalSupport[goalId] ?? 0) < SUPPORT_DV_THRESHOLD) return null;
    return DEV_TIERS[goalId]?.[ageIdx]?.[genderKey] ?? null;
  };

  const viewGoals = allGoals.map((g) => ({
    id: g.id,
    icon: g.icon,
    label: g.label,
    labelZh: g.labelZh,
    selected: childGoalIds.has(g.id),
    tier: devTierOf(g.id),
    //tier: childGoalIds.has(g.id) ? tierOf(g.id) : null,
    supportDV: Math.round(goalSupport[g.id] ?? 0),
  }));
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
  const watch = [
    // NOVA 1（未加工天然食物）的糖是天然糖，不计为"添加糖"
    {
      code: 'added_sugar', icon: '🍬', name: 'Added Sugar', nameZh: '添加糖',
      present: sugarG >= sugarThreshold && (product.novaScore ?? 4) >= 2,
      detail: sugarLimit === 0
        ? `${prodNutr.find(n => n.nutrientId === SUGAR_NUTRIENT_ID)?.dailyValue ?? 0}% DV sugar per serving — added sugar is not recommended for this age group.`
        : `${prodNutr.find(n => n.nutrientId === SUGAR_NUTRIENT_ID)?.dailyValue ?? 0}% of daily sugar limit per serving (limit: ${sugarLimit}g).`,
      detailZh: sugarLimit === 0
        ? `每份糖分占每日参考值的${prodNutr.find(n => n.nutrientId === SUGAR_NUTRIENT_ID)?.dailyValue ?? 0}%，该年龄段不建议摄入添加糖。`
        : `每份糖分占每日上限的${prodNutr.find(n => n.nutrientId === SUGAR_NUTRIENT_ID)?.dailyValue ?? 0}%（上限：${sugarLimit}g）。`,
    },
    {
      code: 'flavors', icon: '🧪', name: 'Added Flavors', nameZh: '添加香精',
      present: hasIng(/flavor|extract|香精|香草提取/) || hasAdd(/flavor/) ||
               hasRawAdditive(['e620','e621','e622','e623','e624','e625','e635']),
      detail: 'Contains added flavoring. Generally recognized as safe, but indicates processing.',
      detailZh: '含添加香精/提取物。一般认为安全，但属于加工标志成分。'
    },
    {
      code: 'colors', icon: '🎨', name: 'Artificial Colors', nameZh: '人工色素', 
      present: hasAdd(/color|色素/) || hasIng(/color|色素/) || 
         hasRawAdditive(['e102','e110','e122','e124','e129','e133','e150a','e150b','e150c','e150d','e151','e160']),
      detail: 'Contains artificial colors. Some are linked to hyperactivity in sensitive children.',
      detailZh: '含人工色素，部分色素与敏感儿童多动相关。'
    },
    {
      code: 'preservatives', icon: '⚗️', name: 'Preservatives', nameZh: '防腐剂', 
      present: hasAdd(/preservative|防腐/) || hasIng(/benzoate|sorbate|防腐/) || hasRawAdditive(['e200','e202','e210','e211','e212','e213','e220','e249','e250','e251','e252']),
      detail: 'Contains preservatives.', detailZh: '含防腐剂。'
    },
    {
      code: 'sodium', icon: '🧂', name: 'Sodium', nameZh: '钠',
      present: (prodNutr.find((n: any) => n.nutrientId === 18)?.value ?? 0) > sodiumThreshold,
      detail: `${prodNutr.find((n: any) => n.nutrientId === 18)?.dailyValue ?? 0}% DV sodium per serving — daily limit for this age is ${sodiumLimit}mg.`,
      detailZh: `每份钠含量占每日参考值的${prodNutr.find((n: any) => n.nutrientId === 18)?.dailyValue ?? 0}%，该年龄段每日上限为${sodiumLimit}mg。`
    },
    {
      code: 'satfat', icon: '🥩', name: 'Saturated Fat', nameZh: '饱和脂肪',
      present: (prodNutr.find((n: any) => n.nutrientId === 17)?.value ?? 0) > satfatThreshold,
      detail: satfatLimit === null
        ? `${prodNutr.find((n: any) => n.nutrientId === 17)?.dailyValue ?? 0}% DV saturated fat per serving — limit not established for this age group.`
        : `${prodNutr.find((n: any) => n.nutrientId === 17)?.dailyValue ?? 0}% DV saturated fat per serving — daily limit for this age is ${satfatLimit}g.`,
      detailZh: satfatLimit === null
        ? `每份饱和脂肪占每日参考值的${prodNutr.find((n: any) => n.nutrientId === 17)?.dailyValue ?? 0}%，该年龄段暂无明确上限。`
        : `每份饱和脂肪占每日参考值的${prodNutr.find((n: any) => n.nutrientId === 17)?.dailyValue ?? 0}%，该年龄段每日上限为${satfatLimit}g。`,
    },
    {
      code: 'transfat', icon: '⛽', name: 'Trans Fat', nameZh: '反式脂肪',
      present: hasIng(/hydrogenated|氢化/) || hasRawAdditive(['e471','e472']),
      detail: 'Contains hydrogenated oils.',
      detailZh: '含氢化油脂。'
    },
    {
      code: 'hfcs', icon: '🌽', name: 'High Fructose Corn Syrup', nameZh: '果葡糖浆', present: hasIng(/fructose corn|果葡|高果糖/),
      detail: 'Contains high fructose corn syrup.', detailZh: '含果葡糖浆。'
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
          { dimension: 'devScore', score: Math.round(devScore * 100), weight: 0.7 },
          { dimension: 'nutriNorm', score: Math.round(nutriNorm * 100), weight: 0.3 },
          { dimension: 'negative', score: negative, weight: 0 },
          { dimension: 'positive', score: positive, weight: 0 },
        ],
      },
      factors: { create: factors },
      allergenFlags: { create: allergenFlags },
    },
    select: { id: true },
  });

  return {
    analysisId: analysis.id,
    overallScore: overall,
    grade,
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