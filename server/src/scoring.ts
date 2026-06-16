import { prisma } from './prisma.js';

// nutrients 字典中 "Sugars" 的 id（见 seed.ts）
const SUGAR_NUTRIENT_ID = 15;
const ENERGY_NUTRIENT_ID = 16;

const WEIGHTS = {
  nutrientDensity: 0.4,
  riskIngredients: 0.3,
  processingLevel: 0.2,
  stageMatch: 0.1,
} as const;

// 发育目标 ↔ 营养素 静态映射（营养学常识，后续可由营养师校准/入库）
// goalId 见 seed: 1学习专注 2骨骼 3日常能量 4免疫 5肠道 6大脑
const GOAL_NUTRIENT_MAP: Record<number, number[]> = {
  1: [1, 3, 4, 2],          // Learning & Focus: 铁/Omega-3/B族/锌
  2: [5, 6, 7, 13],         // Bone: 钙/维D/磷/蛋白质
  3: [8, 4, 1, 14],         // Daily Energy: 复合碳水/B族/铁/钾
  4: [9, 6, 2, 11, 10, 12], // Immune: 维C/维D/锌/维A/硒/B12
  5: [2, 12],               // Gut: 锌/B12
  6: [3, 1, 2, 12, 4],      // Brain: Omega-3/铁/锌/B12/B族
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

  const overall = Math.round(nutrientDensity + riskIngredients + processingLevel + stageMatch);
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
  const viewNutrients = prodNutr
    .filter((n: { nutrientId: number }) => n.nutrientId !== SUGAR_NUTRIENT_ID && n.nutrientId !== ENERGY_NUTRIENT_ID)
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
  const goalSupport: Record<number, number> = {};
  for (const goalId of childGoalIds) {
    for (const nid of GOAL_NUTRIENT_MAP[goalId] ?? []) {
      const dv = dvOf(nid);
      if (dv > 0 && viewNutrIds.has(nid)) {
        flows.push({ goalId, nutrientId: nid, value: Math.round(dv) });
        goalSupport[goalId] = (goalSupport[goalId] ?? 0) + dv;
      }
    }
  }

  const tierOf = (goalId: number): 'core' | 'important' | 'supporting' | null => {
    const s = goalSupport[goalId] ?? 0;
    if (s >= 35) return 'core';
    if (s >= 18) return 'important';
    if (s > 0) return 'supporting';
    return null;
  };

  const viewGoals = allGoals.map((g) => ({
    id: g.id,
    icon: g.icon,
    label: g.label,
    labelZh: g.labelZh,
    selected: childGoalIds.has(g.id),
    tier: childGoalIds.has(g.id) ? tierOf(g.id) : null,
    supportDV: Math.round(goalSupport[g.id] ?? 0),
  }));

  // 留意成分（8 固定槽位，规则可后续细化）
  const ingNames = product.ingredients.map((i: { ingredient: { name: string; nameZh: string | null } }) => `${i.ingredient.name} ${i.ingredient.nameZh ?? ''}`.toLowerCase());
  const hasIng = (re: RegExp) => ingNames.some((n: string) => re.test(n));
  const addNames = product.additives.map((a: { additive: { name: string; nameZh: string | null; type: string | null } }) => `${a.additive.name} ${a.additive.nameZh ?? ''} ${a.additive.type ?? ''}`.toLowerCase());
  const hasAdd = (re: RegExp) => addNames.some((n: string) => re.test(n));

  const watch = [
    // NOVA 1（未加工天然食物）的糖是天然糖，不计为"添加糖"
    { code: 'added_sugar', icon: '🍬', name: 'Added Sugar', nameZh: '添加糖', present: sugarG >= 5 && (product.novaScore ?? 4) >= 2,
      detail: `~${sugarG}g sugar per serving — about ${Math.round((sugarG / 25) * 100)}% of a child's daily limit (25g).`,
      detailZh: `每份含约${sugarG}克糖，约占儿童每日上限(25克)的${Math.round((sugarG / 25) * 100)}%。` },
    { code: 'flavors', icon: '🧪', name: 'Added Flavors', nameZh: '添加香精', present: hasIng(/flavor|extract|香精|香草提取/) || hasAdd(/flavor/),
      detail: 'Contains added flavoring. Generally recognized as safe, but indicates processing.',
      detailZh: '含添加香精/提取物。一般认为安全，但属于加工标志成分。' },
    { code: 'colors', icon: '🎨', name: 'Artificial Colors', nameZh: '人工色素', present: hasAdd(/color|色素/) || hasIng(/color|色素/),
      detail: 'Contains artificial colors. Some are linked to hyperactivity in sensitive children.',
      detailZh: '含人工色素，部分色素与敏感儿童多动相关。' },
    { code: 'preservatives', icon: '⚗️', name: 'Preservatives', nameZh: '防腐剂', present: hasAdd(/preservative|防腐/) || hasIng(/benzoate|sorbate|防腐/),
      detail: 'Contains preservatives.', detailZh: '含防腐剂。' },
    { code: 'sodium', icon: '🧂', name: 'Sodium', nameZh: '钠', present: false, detail: '', detailZh: '' },
    { code: 'satfat', icon: '🥩', name: 'Saturated Fat', nameZh: '饱和脂肪', present: false, detail: '', detailZh: '' },
    { code: 'transfat', icon: '⛽', name: 'Trans Fat', nameZh: '反式脂肪', present: hasIng(/hydrogenated|氢化/),
      detail: 'Contains hydrogenated oils.', detailZh: '含氢化油脂。' },
    { code: 'hfcs', icon: '🌽', name: 'High Fructose Corn Syrup', nameZh: '果葡糖浆', present: hasIng(/fructose corn|果葡|高果糖/),
      detail: 'Contains high fructose corn syrup.', detailZh: '含果葡糖浆。' },
  ];

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
          { dimension: 'nutrientDensity', score: nutrientDensity, weight: WEIGHTS.nutrientDensity },
          { dimension: 'riskIngredients', score: riskIngredients, weight: WEIGHTS.riskIngredients },
          { dimension: 'processingLevel', score: processingLevel, weight: WEIGHTS.processingLevel },
          { dimension: 'stageMatch', score: stageMatch, weight: WEIGHTS.stageMatch },
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
      },
      child: { id: child.id, name: child.name, age: child.age },
      allergenSafe: matchedAllergens.length === 0,
      matchedAllergens,
      goals: viewGoals,
      nutrients: viewNutrients,
      flows,
      watch,
    },
  };
}
