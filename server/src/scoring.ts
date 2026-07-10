import { prisma } from './prisma.js';

// nutrients 字典中 "Sugars" 的 id（见 seed.ts）
const SUGAR_NUTRIENT_ID = 15;
const ENERGY_NUTRIENT_ID = 16;


type DevTier = 'core' | 'important' | 'supporting';
const DEV_TIERS: Record<number, { male: DevTier | null; female: DevTier | null }[]> = {
  // 1 🧠 Brain Development
  1: [{male:'core',female:'core'},{male:'core',female:'core'},{male:'core',female:'core'},{male:'important',female:'important'},{male:'supporting',female:'important'},{male:'supporting',female:'important'}],
  // 2 🦴 Bone Development
  2: [{male:'supporting',female:'supporting'},{male:'important',female:'important'},{male:'important',female:'important'},{male:'core',female:'core'},{male:'core',female:'core'},{male:'core',female:'core'}],
  // 3 📏 Heart Growth
  3: [{male:null,female:null},{male:null,female:null},{male:'important',female:'important'},{male:'important',female:'important'},{male:'important',female:'important'},{male:'important',female:'core'}],
  // 4 💪 Muscle Development
  4: [{male:null,female:null},{male:'supporting',female:'supporting'},{male:'supporting',female:'supporting'},{male:'important',female:'important'},{male:'core',female:'important'},{male:'core',female:'important'}],
  // 5 🛡️ Immune Development
  5: [{male:'important',female:'important'},{male:'important',female:'important'},{male:'core',female:'core'},{male:'important',female:'important'},{male:'important',female:'important'},{male:'important',female:'important'}],
  // 6 🦠 Gut Development
  6: [{male:'core',female:'core'},{male:'core',female:'core'},{male:'core',female:'core'},{male:'supporting',female:'supporting'},{male:'supporting',female:'supporting'},{male:'supporting',female:'important'}],
  // 7 👀 Vision Development
  7: [{male:'core',female:'core'},{male:'core',female:'core'},{male:'important',female:'important'},{male:'supporting',female:'supporting'},{male:null,female:null},{male:null,female:null}],
  // 8 🦷 Dental Development
  8: [{male:null,female:null},{male:'supporting',female:'supporting'},{male:'important',female:'important'},{male:'important',female:'important'},{male:'important',female:'important'},{male:'core',female:'core'}],
};

function stageIdx(stageKey: string | null): number {
  const map: Record<string, number> = {
    '0-6m':0,'7-12m':1,'1-3y':2,'4-8y':3,'9-13y':4,'14-18y':5,
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
// nutrientId 参照 seed.ts:
// 1=Iron 2=Zinc 3=Omega-3 4=B Vitamins 5=Calcium 6=Vit D
// 7=Phosphorus 8=Complex Carbs 9=Vit C 10=Selenium
// 11=Vit A 12=Vit B12 13=Protein 14=Potassium
const GOAL_NUTRIENT_MAP: Record<number, number[]> = {
  1: [3, 1, 2, 12, 4],         // 🧠 Brain: Omega-3/Iron/Zinc/B12/B族
  2: [5, 6, 7, 13],            // 🦴 Bone: 钙/维D/磷/蛋白质
  3: [13, 1, 2, 14],           // 📏 Heart Growth: 蛋白质/Iron/Zinc/钾(Fiber/Omega-3未在nutrient字典中，用相近替代)
  4: [13, 1, 2, 6, 14, 8],     // 💪 Muscle: 蛋白质/Iron/Zinc/维D/钾/复合碳水
  5: [11, 9, 6, 2, 1, 13, 10], // 🛡️ Immune: 维A/维C/维D/Zinc/Iron/蛋白质/硒
  6: [1, 3, 2, 12],            // 🦠 Gut: Iron/Omega-3/Zinc/B12
  7: [11, 2, 6],               // 👀 Vision: VitA(11) / Zinc(2) / VitD(6)
  8: [5, 6, 9, 13],            // 🦷 Dental: Calcium(5) / VitD(6) / VitC(9) / Protein(13)
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


  // ── DRI 推荐量表（per day，按[0-6m, 7-12m, 1-3y, 4-8y, 9-13y, 14-18y]）──
  // nutrientId 与 seed.ts 对应
  const DRI_TABLE: Record<string, { male: (number|null)[]; female: (number|null)[] }> = {
    'DHA':        { male: [100,100,null,null,250,250],    female: [100,100,null,null,250,250] },
    'Choline':    { male: [125,150,200,250,375,550],      female: [125,150,200,250,375,400] },
    'Iron':       { male: [0.27,11,7,10,8,11],           female: [0.27,11,7,10,8,15] },
    'Vitamin B12':{ male: [0.4,0.5,0.9,1.2,1.8,2.4],    female: [0.4,0.5,0.9,1.2,1.8,2.4] },
    'Folate':     { male: [65,80,150,200,300,400],        female: [65,80,150,200,300,400] },
    'Calcium':    { male: [200,260,700,1000,1300,1300],   female: [200,260,700,1000,1300,1300] },
    'Vitamin D':  { male: [10,10,15,15,15,15],            female: [10,10,15,15,15,15] },
    'Phosphorus': { male: [100,275,460,500,1250,1250],    female: [100,275,460,500,1250,1250] },
    'Vitamin A':  { male: [400,500,300,400,600,900],      female: [400,500,300,400,600,700] },
    'Zinc':       { male: [2,3,3,5,8,11],                 female: [2,3,3,5,8,9] },
    'Protein':    { male: [9.1,13.5,13,19,34,52],         female: [9.1,13.5,13,19,34,46] },
    'Fluoride':   { male: [0.01,0.5,0.7,1,2,3],          female: [0.01,0.5,0.7,1,2,3] },
    'Magnesium':  { male: [30,75,80,130,240,410],         female: [30,75,80,130,240,360] },
    'Vitamin C':  { male: [40,50,15,25,45,75],            female: [40,50,15,25,45,65] },
    'Vitamin K':  { male: [2,2.5,30,55,60,75],            female: [2,2.5,30,55,60,75] },
    'Vitamin B6': { male: [0.1,0.3,0.5,0.6,1,1.3],       female: [0.1,0.3,0.5,0.6,1,1.2] },
    'Iodine':     { male: [110,130,90,90,120,150],        female: [110,130,90,90,120,150] },
    'Selenium':   { male: [15,20,20,30,40,55],            female: [15,20,20,30,40,55] },
    'Potassium':  { male: [400,700,3000,3800,4500,4700],  female: [400,700,3000,3800,4500,4700] },
    'Fiber':      { male: [null,null,19,25,26,38],        female: [null,null,19,25,31,26] },
    'Vitamin E':  { male: [4,5,6,7,11,15],               female: [4,5,6,7,11,15] },
  };

  // 目标 → 营养素名称映射
  const GOAL_NUTRIENT_NAMES: Record<number, string[]> = {
    1: ['DHA','Choline','Iron','Vitamin B12','Folate'],
    2: ['Calcium','Vitamin D','Phosphorus','Protein','Magnesium'],
    3: ['Fiber','Potassium','Magnesium'],
    4: ['Protein','Iron','Zinc','Vitamin D','Potassium'],
    5: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'],
    6: ['Fiber','Magnesium','Potassium'],
    7: ['Vitamin A','Zinc','Vitamin E'],
    8: ['Calcium','Vitamin D','Phosphorus','Vitamin C'],
  };

  const TIER_WEIGHT: Record<string, number> = { core: 3, important: 2, supporting: 1 };

  // Step A: DevScore
  const genderKey = child.gender === 'girl' ? 'female' : 'male';
  const ageIdx = stageIdx(child.stageKey);

  // 产品营养素 name→value map
  const nutrientValueMap: Record<string, number> = {};
  for (const n of prodNutr) {
    if (n.value != null) nutrientValueMap[n.nutrient.name] = Number(n.value);
  }

  let weightedSum = 0;
  let weightTotal = 0;

  for (const goal of allGoals) {
    const tier = DEV_TIERS[goal.id]?.[ageIdx]?.[genderKey] ?? null;
    const w = tier ? TIER_WEIGHT[tier] : 0;
    if (w === 0) continue;

    const nutrients = GOAL_NUTRIENT_NAMES[goal.id] ?? [];
    let goalScore = 0;
    let nutrientCount = 0;
    for (const nName of nutrients) {
      const dri = DRI_TABLE[nName];
      if (!dri) continue;
      const rec = dri[genderKey][ageIdx];
      if (!rec) continue;
      const actual = nutrientValueMap[nName] ?? 0;
      if (actual === 0) continue;  // ← 跳过产品没有数据的营养素
      const sj = Math.min(1, actual / rec);
      goalScore += sj;
      nutrientCount++;
    }
    // 用有数据的营养素数量做归一化
    goalScore = nutrientCount > 0 ? Math.min(1, goalScore / nutrientCount) : 0;
    weightedSum += goalScore * w;
    weightTotal += w;
  }

  const devScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // Step B: NutriNorm（Nutri-Score 2014）
  // 需要 per 100g 数据，serving 数据近似处理
  const servingSizeG = parseFloat(product.servingSize ?? '100') || 100;
  const per100 = (val: number | null) => val != null ? (val / servingSizeG) * 100 : 0;

  const energyKJ = per100(prodNutr.find((n: any) => n.nutrient.name === 'Energy')?.value ?? null) * 4.184; // kcal→kJ
  const sugarG100 = per100(prodNutr.find((n: any) => n.nutrient.name === 'Sugars')?.value ?? null);
  const satFatG100 = per100(prodNutr.find((n: any) => n.nutrient.name === 'Saturated Fat')?.value ?? null);
  const saltG100 = (per100(prodNutr.find((n: any) => n.nutrient.name === 'Sodium')?.value ?? null) * 2.5) / 1000;
  const fiberG100 = per100(prodNutr.find((n: any) => n.nutrient.name === 'Fiber')?.value ?? null);
  const proteinG100 = per100(prodNutr.find((n: any) => n.nutrient.name === 'Protein')?.value ?? null);

  // Negative points
  const negEnergy = Math.min(10, Math.floor(energyKJ / 335));
  const negSugar  = Math.min(15, Math.floor(sugarG100 / 4.5));
  const negSatFat = Math.min(10, Math.floor(satFatG100 / 1));
  const negSalt   = Math.min(20, Math.floor(saltG100 / 0.2));
  const negative  = negEnergy + negSugar + negSatFat + negSalt;

  // Positive points
  const posFiber   = Math.min(5, Math.floor(fiberG100 / 0.9));
  const posProtein = Math.min(5, Math.floor(proteinG100 / 1.6));
  const positive   = posFiber + posProtein; // 水果/蔬菜比例暂缺，设0

  const nutriNorm = Math.max(0, Math.min(1, (positive - negative + 55) / 72));

  // Step C: FinalScore
  const b = 0.6;

  console.log('DevScore:', devScore.toFixed(3));
  console.log('NutriNorm:', nutriNorm.toFixed(3));
  console.log('FinalScore:', (100 * nutriNorm * (b + (1 - b) * devScore)).toFixed(1));
  console.log('negative:', negative, 'positive:', positive);

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


  
  const devTierOf = (goalId: number): DevTier | null => {
    if (!childGoalIds.has(goalId)) return null;
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
          { dimension: 'devScore',   score: Math.round(devScore * 100),   weight: 0.7 },
          { dimension: 'nutriNorm',  score: Math.round(nutriNorm * 100),  weight: 0.3 },
          { dimension: 'negative',   score: negative,  weight: 0 },
          { dimension: 'positive',   score: positive,  weight: 0 },
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
