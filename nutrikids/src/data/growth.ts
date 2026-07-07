/* ================================================================
 * 成长参考数据（来自 V4 原型，硬编码过渡版）
 *
 * 数据来源：
 *  - CDC BMI-for-age charts 2000（BMI 按年龄段/性别百分位）
 *  - CDC Growth Charts 2000（8 岁身高/体重百分位样例）
 *  - IOM Dietary Reference Intakes（每日营养推荐量）
 *  - Children's Nutrition Development Matrix（发育目标，NIH ODS / IOM DRI）
 *
 * ⚠️ 后续应迁移到后端参考数据库（见 docs/reference-db-plan.md），
 *    由 CDC LMS 全表与 DRI 全表驱动，而非此处的离散样本。
 * ================================================================ */

export type StageKey = '0-6m' | '7-12m' | '1-3y' | '4-8y' | '9-13y' | '14-18y';

export interface AgeGroup {
  idx: number;
  key: StageKey;
  label: string;
  name: string;
  nameZh: string;
  nameEs: string;
  badge: string;
  badgeZh: string;
  badgeEs: string;
  icon: string;
  unit: 'm' | 'y';
  min: number;
  max: number;
}

export const AGE_GROUPS: AgeGroup[] = [
  { idx: 0, key: '0-6m',   label: '0–6m',   name: 'Baby',      nameZh: '婴儿',   nameEs: 'Bebé',        badge: 'Age 0–6m',  badgeZh: '0–6 月',   badgeEs: 'Edad 0–6m',  icon: '🍼', unit: 'm', min: 0,  max: 6 },
  { idx: 1, key: '7-12m',  label: '7–12m',  name: 'Baby',      nameZh: '婴儿',   nameEs: 'Bebé',        badge: 'Age 7–12m', badgeZh: '7–12 月',  badgeEs: 'Edad 7–12m', icon: '🧸', unit: 'm', min: 7,  max: 12 },
  { idx: 2, key: '1-3y',   label: '1–3y',   name: 'Toddler',   nameZh: '幼儿',   nameEs: 'Niño',        badge: 'Age 1–3',   badgeZh: '1–3 岁',   badgeEs: 'Edad 1–3',   icon: '🧩', unit: 'y', min: 1,  max: 3 },
  { idx: 3, key: '4-8y',   label: '4–8y',   name: 'Preschool', nameZh: '学龄前', nameEs: 'Preescolar',  badge: 'Age 4–8',   badgeZh: '4–8 岁',   badgeEs: 'Edad 4–8',   icon: '🎨', unit: 'y', min: 4,  max: 8 },
  { idx: 4, key: '9-13y',  label: '9–13y',  name: 'Grader',    nameZh: '学龄期', nameEs: 'Escolar',     badge: 'Age 9–13',  badgeZh: '9–13 岁',  badgeEs: 'Edad 9–13',  icon: '📚', unit: 'y', min: 9,  max: 13 },
  { idx: 5, key: '14-18y', label: '14–18y', name: 'Teen',      nameZh: '青少年', nameEs: 'Adolescente', badge: 'Age 14–18', badgeZh: '14–18 岁', badgeEs: 'Edad 14–18', icon: '🧑', unit: 'y', min: 14, max: 18 },
];

export function stageIdxForChild(
  stageKey: string | null | undefined,
  age: number | null | undefined,
  ageMonths?: number | null,
): number {
  const byKey = AGE_GROUPS.findIndex(g => g.key === stageKey);
  if (byKey >= 0) return byKey;
  const months = ageMonths ?? (age != null ? age * 12 : null);
  if (months == null) return 3;
  if (months <= 6)   return 0;
  if (months <= 12)  return 1;
  if (months <= 36)  return 2;
  if (months <= 96)  return 3;
  if (months <= 156) return 4;
  return 5;
}

/* ================================================================
 * 发育目标（按年龄段 × 性别分层）
 * 数据来源: Children's Nutrition Development Matrix (NIH ODS / IOM DRI)
 * ageIdx: 0=0-6m  1=7-12m  2=1-3y  3=4-8y  4=9-13y  5=14-18y
 * ================================================================ */

export type Tier = 'core' | 'important' | 'supporting';
export interface TierByGender      { male: Tier | null;     female: Tier | null }
export interface NutrientsByGender { male: string[];  female: string[] }

export interface DevGoal {
  id: string;
  emoji: string;
  name: string;
  nameZh: string;
  nameEs: string;
  tiersByAge: TierByGender[];          // length 6
  nutrientsByAge: NutrientsByGender[]; // length 6
  nutrientsZhByAge: NutrientsByGender[]; // auto-filled
}

// 营养素英→中映射
const N: Record<string, string> = {
  'DHA': 'DHA', 'Choline': '胆碱', 'Iron': '铁', 'Vitamin B12': '维生素B12',
  'Folate': '叶酸', 'Calcium': '钙', 'Calcium 1000mg/d': '钙(1000mg/天)',
  'Calcium 1300mg/d': '钙(1300mg/天)', 'Vitamin D': '维生素D', 'Phosphorus': '磷',
  'Protein': '蛋白质', 'Total Lipid': '总脂质', 'Zinc': '锌', 'Vitamin A': '维生素A',
  'Vitamin C': '维生素C', 'Vitamin K': '维生素K', 'Magnesium': '镁', 'Potassium': '钾',
  'Omega-3': 'Omega-3', 'Iodine': '碘', 'Selenium': '硒', 'Linoleic Acid': '亚油酸',
  'Linolenic Acid': '亚麻酸', 'Lutein': '叶黄素', 'Zeaxanthin': '玉米黄质',
  'Probiotics': '益生菌', 'Carbohydrate': '碳水化合物', 'Creatine': '肌酸',
  'Tryptophan': '色氨酸', 'B-vitamins': 'B族维生素', 'Vitamin B6': '维生素B6',
  'B12': '维生素B12', 'Fat': '脂肪', 'Fiber': '膳食纤维',
};
const zh = (list: string[]) => list.map(n => N[n] ?? n);

export const DEV_GOALS: DevGoal[] = [
  {
    id: 'brain', emoji: '🧠', name: 'Brain Development', nameZh: '大脑发育', nameEs: 'Desarrollo Cerebral',
    tiersByAge: [
      { male: 'core', female: 'core' },  // 0-6m
      { male: 'core', female: 'core' },  // 7-12m
      { male: 'core', female: 'core' },  // 1-3y
      { male: 'important', female: 'important' },  // 4-8y
      { male: 'supporting', female: 'important' },  // ← gender diff  // 9-13y
      { male: 'supporting', female: 'important' },  // ← gender diff  // 14-18y
    ],
    nutrientsByAge: [
      { male: ['DHA', 'Choline', 'Iron', 'Vitamin B12', 'Folate'], female: ['DHA', 'Choline', 'Iron', 'Vitamin B12', 'Folate'] },  // 0-6m
      { male: ['DHA', 'Choline', 'Iron', 'Vitamin B6', 'Vitamin B12', 'Folate'], female: ['DHA', 'Choline', 'Iron', 'Vitamin B6', 'Vitamin B12', 'Folate'] },  // 7-12m
      { male: ['Iron', 'Choline', 'DHA', 'Vitamin B12', 'Folate', 'Zinc'], female: ['Iron', 'Choline', 'DHA', 'Vitamin B12', 'Folate', 'Zinc'] },  // 1-3y
      { male: ['Iron', 'Omega-3', 'Choline', 'Zinc', 'Iodine'], female: ['Iron', 'Omega-3', 'Choline', 'Zinc', 'Iodine'] },  // 4-8y
      { male: ['Iron', 'Omega-3', 'Choline', 'B12', 'Zinc'], female: ['Iron', 'Omega-3', 'Choline', 'B12', 'Zinc'] },  // 9-13y
      { male: ['Omega-3', 'Choline', 'Iron', 'B12', 'Folate'],
        female: ['Iron', 'Omega-3', 'Folate', 'Choline', 'B12'] },  // 14-18y ⚡gender diff
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'bone', emoji: '🦴', name: 'Bone Development', nameZh: '骨骼发育', nameEs: 'Desarrollo Óseo',
    tiersByAge: [
      { male: 'supporting', female: 'supporting' },  // 0-6m
      { male: 'important', female: 'important' },  // 7-12m
      { male: 'important', female: 'important' },  // 1-3y
      { male: 'core', female: 'core' },  // 4-8y
      { male: 'core', female: 'core' },  // 9-13y
      { male: 'core', female: 'core' },  // 14-18y
    ],
    nutrientsByAge: [
      { male: ['Calcium', 'Vitamin D', 'Phosphorus'], female: ['Calcium', 'Vitamin D', 'Phosphorus'] },  // 0-6m
      { male: ['Calcium', 'Vitamin D', 'Phosphorus', 'Magnesium'], female: ['Calcium', 'Vitamin D', 'Phosphorus', 'Magnesium'] },  // 7-12m
      { male: ['Calcium', 'Vitamin D', 'Magnesium', 'Protein', 'Vitamin K'], female: ['Calcium', 'Vitamin D', 'Magnesium', 'Protein', 'Vitamin K'] },  // 1-3y
      { male: ['Calcium 1000mg/d', 'Vitamin D', 'Phosphorus', 'Magnesium', 'Protein'], female: ['Calcium 1000mg/d', 'Vitamin D', 'Phosphorus', 'Magnesium', 'Protein'] },  // 4-8y
      { male: ['Calcium 1300mg/d', 'Vitamin D', 'Magnesium', 'Protein', 'Vitamin K'], female: ['Calcium 1300mg/d', 'Vitamin D', 'Magnesium', 'Protein', 'Vitamin K'] },  // 9-13y
      { male: ['Calcium 1300mg/d', 'Vitamin D', 'Magnesium', 'Protein', 'Zinc'],
        female: ['Calcium 1300mg/d', 'Vitamin D', 'Magnesium', 'Protein', 'Zinc', 'Vitamin K'] },  // 14-18y ⚡gender diff
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'heart', emoji: '📏', name: 'Heart Growth', nameZh: '心脏发育', nameEs: 'Crecimiento Cardíaco',
    tiersByAge: [
      { male: null, female: null },  // 0-6m
      { male: null, female: null },  // 7-12m
      { male: 'important', female: 'important' },  // 1-3y
      { male: 'important', female: 'important' },  // 4-8y
      { male: 'important', female: 'important' },  // 9-13y
      { male: 'important', female: 'core' },  // ← gender diff  // 14-18y
    ],
    nutrientsByAge: [
      { male: [], female: [] },  // 0-6m
      { male: [], female: [] },  // 7-12m
      { male: ['Fiber', 'Omega-3', 'Potassium'], female: ['Fiber', 'Omega-3', 'Potassium'] },  // 1-3y
      { male: ['Fiber', 'Omega-3', 'Potassium', 'Magnesium'], female: ['Fiber', 'Omega-3', 'Potassium', 'Magnesium'] },  // 4-8y
      { male: ['Fiber', 'Omega-3', 'Potassium', 'Magnesium'], female: ['Fiber', 'Omega-3', 'Potassium', 'Magnesium'] },  // 9-13y
      { male: ['Fiber', 'Omega-3', 'Potassium', 'Magnesium'],
        female: ['Fiber', 'Omega-3', 'Potassium', 'Magnesium', 'Iron'] },  // 14-18y ⚡gender diff
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'muscle', emoji: '💪', name: 'Muscle Development', nameZh: '肌肉发育', nameEs: 'Desarrollo Muscular',
    tiersByAge: [
      { male: null, female: null },  // 0-6m
      { male: 'supporting', female: 'supporting' },  // 7-12m
      { male: 'supporting', female: 'supporting' },  // 1-3y
      { male: 'important', female: 'important' },  // 4-8y
      { male: 'core', female: 'important' },  // ← gender diff  // 9-13y
      { male: 'core', female: 'important' },  // ← gender diff  // 14-18y
    ],
    nutrientsByAge: [
      { male: [], female: [] },  // 0-6m
      { male: ['Protein', 'Iron', 'Zinc', 'Vitamin D'], female: ['Protein', 'Iron', 'Zinc', 'Vitamin D'] },  // 7-12m
      { male: ['Protein', 'Iron', 'Zinc', 'Magnesium', 'Carbohydrate'], female: ['Protein', 'Iron', 'Zinc', 'Magnesium', 'Carbohydrate'] },  // 1-3y
      { male: ['Protein', 'Iron', 'Zinc', 'Vitamin D', 'Potassium', 'Carbohydrate'], female: ['Protein', 'Iron', 'Zinc', 'Vitamin D', 'Potassium', 'Carbohydrate'] },  // 4-8y
      { male: ['Protein', 'Zinc', 'Iron', 'Magnesium', 'Vitamin D', 'Creatine', 'Carbohydrate'],
        female: ['Protein', 'Iron', 'Zinc', 'Magnesium', 'Vitamin D', 'Carbohydrate'] },  // 9-13y ⚡gender diff
      { male: ['Protein', 'Zinc', 'Iron', 'Magnesium', 'Vitamin D', 'Creatine', 'Potassium'],
        female: ['Protein', 'Iron', 'Zinc', 'Magnesium', 'Calcium', 'Vitamin D'] },  // 14-18y ⚡gender diff
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'immune', emoji: '🛡️', name: 'Immune Development', nameZh: '免疫发育', nameEs: 'Desarrollo Inmune',
    tiersByAge: [
      { male: 'important', female: 'important' },  // 0-6m
      { male: 'important', female: 'important' },  // 7-12m
      { male: 'core', female: 'core' },  // 1-3y
      { male: 'important', female: 'important' },  // 4-8y
      { male: 'important', female: 'important' },  // 9-13y
      { male: 'important', female: 'important' },  // 14-18y
    ],
    nutrientsByAge: [
      { male: ['Vitamin A', 'Vitamin D', 'Zinc', 'Iron', 'Protein'], female: ['Vitamin A', 'Vitamin D', 'Zinc', 'Iron', 'Protein'] },  // 0-6m
      { male: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein'], female: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein'] },  // 7-12m
      { male: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Probiotics'], female: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Probiotics'] },  // 1-3y
      { male: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Selenium'], female: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Selenium'] },  // 4-8y
      { male: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Selenium'], female: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Selenium'] },  // 9-13y
      { male: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Selenium', 'Omega-3'], female: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Zinc', 'Iron', 'Protein', 'Selenium', 'Omega-3'] },  // 14-18y
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'gut', emoji: '🦠', name: 'Gut Development', nameZh: '肠道发育', nameEs: 'Desarrollo Intestinal',
    tiersByAge: [
      { male: 'core', female: 'core' },  // 0-6m
      { male: 'core', female: 'core' },  // 7-12m
      { male: 'core', female: 'core' },  // 1-3y
      { male: 'supporting', female: 'supporting' },  // 4-8y
      { male: 'supporting', female: 'supporting' },  // 9-13y
      { male: 'supporting', female: 'important' },  // ← gender diff  // 14-18y
    ],
    nutrientsByAge: [
      { male: ['Breast milk oligosaccharides', 'Probiotics', 'Vitamin D'], female: ['Breast milk oligosaccharides', 'Probiotics', 'Vitamin D'] },  // 0-6m
      { male: ['Fiber', 'Probiotics', 'Magnesium', 'Potassium', 'Carbohydrate'], female: ['Fiber', 'Probiotics', 'Magnesium', 'Potassium', 'Carbohydrate'] },  // 7-12m
      { male: ['Dietary Fiber', 'Probiotics', 'Prebiotics', 'Magnesium', 'Potassium'], female: ['Dietary Fiber', 'Probiotics', 'Prebiotics', 'Magnesium', 'Potassium'] },  // 1-3y
      { male: ['Dietary Fiber', 'Probiotics', 'Magnesium', 'Potassium', 'Zinc'], female: ['Dietary Fiber', 'Probiotics', 'Magnesium', 'Potassium', 'Zinc'] },  // 4-8y
      { male: ['Dietary Fiber', 'Probiotics', 'Magnesium', 'Potassium'], female: ['Dietary Fiber', 'Probiotics', 'Magnesium', 'Potassium'] },  // 9-13y
      { male: ['Dietary Fiber', 'Probiotics', 'Magnesium', 'Potassium'],
        female: ['Dietary Fiber', 'Probiotics', 'Magnesium', 'Potassium', 'Iron'] },  // 14-18y ⚡gender diff
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'vision', emoji: '👀', name: 'Vision Development', nameZh: '视力发育', nameEs: 'Desarrollo Visual',
    tiersByAge: [
      { male: 'core', female: 'core' },  // 0-6m
      { male: 'core', female: 'core' },  // 7-12m
      { male: 'important', female: 'important' },  // 1-3y
      { male: 'supporting', female: 'supporting' },  // 4-8y
      { male: null, female: null },  // 9-13y
      { male: null, female: null },  // 14-18y
    ],
    nutrientsByAge: [
      { male: ['DHA', 'Vitamin A', 'Lutein', 'Zeaxanthin'], female: ['DHA', 'Vitamin A', 'Lutein', 'Zeaxanthin'] },  // 0-6m
      { male: ['DHA', 'Vitamin A', 'Lutein', 'Zinc', 'Vitamin E'], female: ['DHA', 'Vitamin A', 'Lutein', 'Zinc', 'Vitamin E'] },  // 7-12m
      { male: ['Vitamin A', 'DHA', 'Vitamin E', 'Zinc', 'Lutein'], female: ['Vitamin A', 'DHA', 'Vitamin E', 'Zinc', 'Lutein'] },  // 1-3y
      { male: ['Vitamin A', 'Zinc', 'Vitamin E', 'Lutein', 'Zeaxanthin'], female: ['Vitamin A', 'Zinc', 'Vitamin E', 'Lutein', 'Zeaxanthin'] },  // 4-8y
      { male: ['Vitamin A', 'Zinc'], female: ['Vitamin A', 'Zinc'] },  // 9-13y
      { male: ['Vitamin A', 'Zinc', 'Lutein'], female: ['Vitamin A', 'Zinc', 'Lutein'] },  // 14-18y
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'dental', emoji: '🦷', name: 'Dental Development', nameZh: '牙齿发育', nameEs: 'Desarrollo Dental',
    tiersByAge: [
      { male: null, female: null },  // 0-6m
      { male: 'supporting', female: 'supporting' },  // 7-12m
      { male: 'important', female: 'important' },  // 1-3y
      { male: 'important', female: 'important' },  // 4-8y
      { male: 'important', female: 'important' },  // 9-13y
      { male: 'core', female: 'core' },  // 14-18y
    ],
    nutrientsByAge: [
      { male: ['Fluoride', 'Vitamin D'], female: ['Fluoride', 'Vitamin D'] },  // 0-6m
      { male: ['Fluoride', 'Calcium', 'Vitamin D', 'Phosphorus'], female: ['Fluoride', 'Calcium', 'Vitamin D', 'Phosphorus'] },  // 7-12m
      { male: ['Fluoride', 'Calcium', 'Vitamin D', 'Phosphorus', 'Vitamin C'], female: ['Fluoride', 'Calcium', 'Vitamin D', 'Phosphorus', 'Vitamin C'] },  // 1-3y
      { male: ['Fluoride', 'Calcium', 'Vitamin D', 'Phosphorus', 'Vitamin C'], female: ['Fluoride', 'Calcium', 'Vitamin D', 'Phosphorus', 'Vitamin C'] },  // 4-8y
      { male: ['Fluoride', 'Calcium 1300mg/d', 'Vitamin D', 'Phosphorus', 'Vitamin C'], female: ['Fluoride', 'Calcium 1300mg/d', 'Vitamin D', 'Phosphorus', 'Vitamin C'] },  // 9-13y
      { male: ['Fluoride', 'Calcium 1300mg/d', 'Vitamin D', 'Phosphorus', 'Vitamin C', 'Magnesium'], female: ['Fluoride', 'Calcium 1300mg/d', 'Vitamin D', 'Phosphorus', 'Vitamin C', 'Magnesium'] },  // 14-18y
    ],
    nutrientsZhByAge: [],
  },
];
// 自动填充中文营养素
DEV_GOALS.forEach(g => {
  g.nutrientsZhByAge = g.nutrientsByAge.map(a => ({
    male: zh(a.male),
    female: zh(a.female),
  }));
});

// 工具函数：性别未知时取较高优先级
const TIER_ORDER: Tier[] = ['core', 'important', 'supporting'];
export function higherTier(a: Tier | null, b: Tier | null): Tier | null {
  if (a === null) return b;
  if (b === null) return a;
  return TIER_ORDER.indexOf(a) <= TIER_ORDER.indexOf(b) ? a : b;
}
export function mergeNeutral(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b])).slice(0, 7);
}

export const TIER_CONFIG: Record<Tier, { color: string; bg: string; label: string; labelZh: string; labelEs: string; textColor: string }> = {
  core:       { color: '#4c1d95', bg: 'rgba(109,40,217,0.07)',  label: 'Core',       labelZh: '核心', labelEs: 'Esencial',       textColor: '#4c1d95' },
  important:  { color: '#a21caf', bg: 'rgba(162,28,175,0.07)',  label: 'Important',  labelZh: '重要', labelEs: 'Importante',     textColor: '#701a75' },
  supporting: { color: '#db2777', bg: 'rgba(219,39,119,0.07)',  label: 'Supporting', labelZh: '辅助', labelEs: 'Complementario', textColor: '#9d174d' },
};

/* ================================================================
 * 每日营养指南（IOM DRI，按年龄段）—— 不改动
 * ================================================================ */

export interface DriNutrient {
  name: string; nameZh: string; nameEs: string; unit: string;
  category: 0 | 1 | 2;
  values: number[];        // 中性/男（ageIdx 0-5）
  valuesFemale?: number[]; // 女性专用（ageIdx 0-5），没有则同 values
  max: number;
  goals: string[];
}
export const DRI_NUTRIENTS: DriNutrient[] = [
  // ── Macronutrients (3) ──
  {
    name: 'Protein', nameZh: '蛋白质', nameEs: 'Proteína', unit: 'g', category: 0,
    values:       [9,  11, 13, 19, 34, 52],
    valuesFemale: [9,  11, 13, 19, 34, 46],
    max: 55, goals: ['🦠','🛡️','📏','🦷','💪'],
  },
  {
    name: 'Carbs', nameZh: '碳水', nameEs: 'Carbohidratos', unit: 'g', category: 0,
    values: [60, 95, 130, 130, 130, 130],
    max: 140, goals: ['💪','📏'],
  },
  {
    name: 'Fiber', nameZh: '膳食纤维', nameEs: 'Fibra', unit: 'g', category: 0,
    values:       [0, 0, 19, 25, 25, 31],
    valuesFemale: [0, 0, 19, 17, 22, 25],
    max: 35, goals: ['🦠'],
  },

  // ── Minerals (4) ──
  {
    name: 'Calcium', nameZh: '钙', nameEs: 'Calcio', unit: 'mg', category: 1,
    values: [200, 260, 700, 1000, 1300, 1300],
    max: 1400, goals: ['🦷'],
  },
  {
    name: 'Iron', nameZh: '铁', nameEs: 'Hierro', unit: 'mg', category: 1,
    values:       [0.27, 11, 7, 10, 8,  11],
    valuesFemale: [0.27, 11, 7, 10, 8,  15],
    max: 16, goals: ['💪','🧠'],
  },
  {
    name: 'Magnesium', nameZh: '镁', nameEs: 'Magnesio', unit: 'mg', category: 1,
    values:       [30, 75, 80, 130, 240, 410],
    valuesFemale: [30, 75, 80, 130, 240, 360],
    max: 420, goals: ['💪','🦷'],
  },
  {
    name: 'Zinc', nameZh: '锌', nameEs: 'Zinc', unit: 'mg', category: 1,
    values:       [2, 3, 3, 5, 8, 11],
    valuesFemale: [2, 3, 3, 5, 8,  9],
    max: 12, goals: ['🛡️','🧠','📏'],
  },

  // ── Vitamins (5) ──
  {
    name: 'Vit A', nameZh: '维生素A', nameEs: 'Vit A', unit: 'mcg', category: 2,
    values:       [400, 500, 300, 400, 600, 900],
    valuesFemale: [400, 500, 300, 400, 600, 700],
    max: 950, goals: ['📏','🛡️','👁️'],
  },
  {
    name: 'Vit D', nameZh: '维生素D', nameEs: 'Vit D', unit: 'IU', category: 2,
    values: [400, 400, 600, 600, 600, 600],
    max: 650, goals: ['🛡️','💪','🦷'],
  },
  {
    name: 'Vit C', nameZh: '维生素C', nameEs: 'Vit C', unit: 'mg', category: 2,
    values:       [40, 50, 15, 25, 45, 75],
    valuesFemale: [40, 50, 15, 25, 45, 65],
    max: 80, goals: ['🦷','🛡️'],
  },
  {
    name: 'Vit B12', nameZh: '维生素B12', nameEs: 'Vit B12', unit: 'mcg', category: 2,
    values: [0.4, 0.5, 0.9, 1.2, 1.8, 2.4],
    max: 2.8, goals: ['🧠'],
  },
  {
    name: 'Folate', nameZh: '叶酸', nameEs: 'Folato', unit: 'mcg', category: 2,
    values: [65, 80, 150, 200, 300, 400],
    max: 440, goals: ['📏','🧠'],
  },
];

export const DRI_CATEGORIES = [
  { color: '#0e9aad', colorDark: '#0e7490', bg: 'rgba(14,154,173,0.18)', label: 'Macronutrients', labelZh: '宏量营养素', labelEs: 'Macronutrientes', range: [0, 2] },
  { color: '#22d3ee', colorDark: '#0891b2', bg: 'rgba(34,211,238,0.12)', label: 'Minerals',       labelZh: '矿物质',     labelEs: 'Minerales',       range: [3,6] },
  { color: '#5eead4', colorDark: '#0d9488', bg: 'rgba(94,234,212,0.08)', label: 'Vitamins',       labelZh: '维生素',     labelEs: 'Vitaminas',       range: [7,11] },
];


/* ================================================================
 * CDC BMI 百分位表 —— 不改动
 * ================================================================ */

export const CDC_PCTS = [5, 10, 15, 25, 50, 75, 85, 90, 95];
export const CDC_PCT_LABELS = ['5th', '10th', '15th', '25th', '50th', '75th', '85th', '90th', '95th'];

export const CDC_BMI: Record<'boys' | 'girls', Record<StageKey, number[]>> = {
  boys: {
    '0-6m':   [12.0, 12.6, 13.0, 13.5, 14.4, 15.4, 16.0, 16.5, 17.2],
    '7-12m':  [15.2, 15.7, 16.0, 16.5, 17.4, 18.5, 19.2, 19.7, 20.5],
    '1-3y':   [14.3, 14.7, 15.0, 15.5, 16.2, 17.1, 17.7, 18.1, 18.9],
    '4-8y':   [13.6, 14.1, 14.4, 15.0, 15.8, 17.0, 17.9, 18.5, 19.6],
    '9-13y':  [14.6, 15.2, 15.6, 16.4, 17.8, 19.9, 21.3, 22.2, 23.7],
    '14-18y': [16.7, 17.5, 18.0, 18.9, 20.6, 22.8, 24.4, 25.4, 27.1],
  },
  girls: {
    '0-6m':   [11.8, 12.4, 12.7, 13.2, 14.1, 15.2, 15.8, 16.3, 17.1],
    '7-12m':  [14.9, 15.4, 15.7, 16.2, 17.1, 18.3, 19.0, 19.6, 20.5],
    '1-3y':   [13.8, 14.2, 14.6, 15.1, 15.9, 16.9, 17.6, 18.1, 18.9],
    '4-8y':   [13.3, 13.8, 14.1, 14.7, 15.7, 17.0, 18.0, 18.7, 20.0],
    '9-13y':  [14.3, 14.9, 15.3, 16.1, 17.6, 20.0, 21.6, 22.6, 24.4],
    '14-18y': [16.3, 17.1, 17.6, 18.5, 20.3, 22.8, 24.5, 25.6, 27.6],
  },
};

export const CDC_AGE8_HEIGHT = [119.0, 121.2, 122.7, 125.2, 128.1, 131.1, 132.8, 133.9, 135.6];
export const CDC_AGE8_WEIGHT = [20.3, 21.4, 22.1, 23.6, 26.0, 29.2, 31.3, 32.8, 35.5];

/* ================================================================
 * 计算工具 —— 不改动
 * ================================================================ */

export function bmiOf(heightCm: number, weightKg: number): number {
  return Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
}

export function interpolatePercentile(value: number, pcts: number[]): number {
  if (value <= pcts[0]) return CDC_PCTS[0];
  if (value >= pcts[pcts.length - 1]) return CDC_PCTS[CDC_PCTS.length - 1];
  for (let i = 0; i < pcts.length - 1; i++) {
    if (value >= pcts[i] && value <= pcts[i + 1]) {
      const t = (value - pcts[i]) / (pcts[i + 1] - pcts[i]);
      return Math.round(CDC_PCTS[i] + t * (CDC_PCTS[i + 1] - CDC_PCTS[i]));
    }
  }
  return 50;
}

export function bmiPercentile(bmi: number, stageKey: StageKey, gender: string | null): number {
  const table = gender === 'girl' ? CDC_BMI.girls : CDC_BMI.boys;
  return interpolatePercentile(bmi, table[stageKey]);
}

export function bmiCategory(pct: number): { label: string; labelZh: string; labelEs: string; color: string } {
  if (pct < 5)  return { label: 'Underweight',    labelZh: '偏瘦', labelEs: 'Bajo peso',      color: '#0ea5e9' };
  if (pct < 85) return { label: 'Healthy weight', labelZh: '健康', labelEs: 'Peso saludable', color: '#22c55e' };
  if (pct < 95) return { label: 'Overweight',     labelZh: '超重', labelEs: 'Sobrepeso',      color: '#f97316' };
  return          { label: 'Obese',               labelZh: '肥胖', labelEs: 'Obeso',          color: '#ef4444' };
}

export function ordinal(pct: number): string {
  if (pct % 10 === 1 && pct !== 11) return `${pct}st`;
  if (pct % 10 === 2 && pct !== 12) return `${pct}nd`;
  if (pct % 10 === 3 && pct !== 13) return `${pct}rd`;
  return `${pct}th`;
}

/* ================================================================
 * LMS 数据表（WHO 0-23m + CDC 24-216m）
 * 格式：[L, M, S]，月龄为 key
 * ================================================================ */

type LMS = [number, number, number];

// 身高 LMS
export const HEIGHT_LMS: Record<'M' | 'F', Record<number, LMS>> = {
  M: {
    0:[1,49.8842,0.03795],1:[1,54.7244,0.03557],2:[1,58.4249,0.03424],3:[1,61.4292,0.03328],4:[1,63.886,0.03257],5:[1,65.9026,0.03204],6:[1,67.6236,0.03165],7:[1,69.1645,0.03139],8:[1,70.5994,0.03124],9:[1,71.9687,0.03117],10:[1,73.2812,0.03118],11:[1,74.5388,0.03125],12:[1,75.7488,0.03137],13:[1,76.9186,0.03154],14:[1,78.0497,0.03174],15:[1,79.1458,0.03197],16:[1,80.2113,0.03222],17:[1,81.2487,0.0325],18:[1,82.2587,0.03279],19:[1,83.2418,0.0331],20:[1,84.1996,0.03342],21:[1,85.1348,0.03376],22:[1,86.0477,0.0341],23:[1,86.941,0.03445],
    24:[1.007208,86.861609,0.040396],25:[0.837251,87.652473,0.040578],26:[0.681493,88.423264,0.040723],27:[0.53878,89.175492,0.040833],28:[0.407697,89.910409,0.040909],29:[0.286762,90.629078,0.040952],30:[0.174489,91.332424,0.040965],31:[0.069445,92.021272,0.04095],32:[-0.029721,92.696379,0.040909],33:[-0.124252,93.358465,0.040844],34:[-0.215288,94.008229,0.040758],35:[-0.303854,94.64637,0.040654],36:[-0.390918,95.273591,0.040534],48:[0.827637,102.510474,0.041344],60:[1.545829,109.174305,0.042108],72:[2.099689,115.435507,0.042483],84:[2.288551,121.587132,0.04268],96:[2.218384,127.786499,0.042938],108:[2.038029,133.927605,0.043339],120:[1.820623,140.197952,0.043881],132:[1.597614,146.584946,0.044516],144:[1.39142,153.021896,0.045247],156:[1.224685,159.197204,0.045932],168:[1.568503,164.696732,0.04592],180:[1.902876,168.733574,0.045232],192:[2.113023,173.610052,0.043086],204:[1.724738,175.340954,0.041408],216:[1.399999,176.185021,0.040644],
  },
  F: {
    0:[1,49.1477,0.0379],1:[1,53.6872,0.0364],2:[1,57.0673,0.03568],3:[1,59.8029,0.0352],4:[1,62.0899,0.03486],5:[1,64.0301,0.03463],6:[1,65.7311,0.03448],7:[1,67.2873,0.03441],8:[1,68.7498,0.0344],9:[1,70.1435,0.03444],10:[1,71.4818,0.03452],11:[1,72.771,0.03464],12:[1,74.015,0.03479],13:[1,75.2176,0.03496],14:[1,76.3817,0.03514],15:[1,77.5099,0.03534],16:[1,78.6055,0.03555],17:[1,79.671,0.03576],18:[1,80.7079,0.03598],19:[1,81.7182,0.0362],20:[1,82.7036,0.03643],21:[1,83.6654,0.03666],22:[1,84.604,0.03688],23:[1,85.5202,0.03711],
    24:[1.051273,85.397317,0.04086],25:[1.041951,86.290263,0.041142],26:[1.012592,87.157142,0.041349],27:[0.970542,87.996018,0.0415],28:[0.92113,88.805511,0.041611],29:[0.868221,89.584767,0.041692],30:[0.814544,90.333417,0.041754],31:[0.761958,91.051544,0.041804],32:[0.71166,91.739635,0.041847],33:[0.664323,92.398544,0.041888],34:[0.620285,93.029454,0.041929],35:[0.579556,93.633823,0.041972],36:[0.541981,94.213357,0.042018],48:[1.016948,163.004678,0.039715],60:[1.025143,163.040195,0.039707],72:[1.032977,163.072877,0.0397],84:[1.040452,163.088240,0.039693],96:[0.999506,162.923845,0.039732],108:[0.971038,162.771874,0.039767],120:[0.941146,162.568996,0.039821],132:[0.911,162.35,0.03987],144:[0.880,162.13,0.03993],156:[0.951110,162.643542,0.0398],168:[0.966094,162.742117,0.039774],180:[0.980785,162.827289,0.039754],192:[0.992,162.878,0.039749],204:[1.003994,162.945391,0.039727],216:[1.047571,163.130787,0.039687],
  },
};

// 体重 LMS
export const WEIGHT_LMS: Record<'M' | 'F', Record<number, LMS>> = {
  M: {
    0:[0.3487,3.3464,0.14602],1:[0.2297,4.4709,0.13395],2:[0.197,5.5675,0.12385],3:[0.1738,6.3762,0.11727],4:[0.1553,7.0023,0.11316],5:[0.1395,7.5105,0.1108],6:[0.1257,7.934,0.10958],7:[0.1134,8.297,0.10902],8:[0.1021,8.6151,0.10882],9:[0.0917,8.9014,0.10881],10:[0.082,9.1649,0.10891],11:[0.073,9.4122,0.10906],12:[0.0644,9.6479,0.10925],13:[0.0563,9.8749,0.10949],14:[0.0487,10.0953,0.10976],15:[0.0413,10.3108,0.11007],16:[0.0343,10.5228,0.11041],17:[0.0275,10.7319,0.11079],18:[0.0211,10.9385,0.11119],19:[0.0148,11.143,0.11164],20:[0.0087,11.3462,0.11211],21:[0.0029,11.5486,0.11261],22:[-0.0028,11.7504,0.11314],23:[-0.0083,11.9514,0.11369],
    24:[-0.216501,12.741544,0.108166],36:[-0.62132,14.402627,0.111875],48:[-0.915242,16.316767,0.119955],60:[-1.079839,18.347788,0.128646],72:[-1.144824,20.548046,0.136739],84:[-1.168614,22.936272,0.143937],96:[-1.175011,25.520842,0.150536],108:[-1.178236,28.357481,0.157113],120:[-1.183988,31.49929,0.163683],132:[-1.191638,35.008127,0.170288],144:[-1.196327,39.025124,0.176826],156:[-1.193083,43.584743,0.183162],168:[-1.178091,48.702516,0.189041],180:[-1.148459,54.27427,0.193957],192:[-0.801993,61.095368,0.172459],204:[-0.973245,64.699614,0.16564],216:[-1.066224,67.289926,0.161923],
  },
  F: {
    0:[0.3809,3.2322,0.14171],1:[0.1714,4.1873,0.13724],2:[0.0962,5.1282,0.13],3:[0.0402,5.8458,0.12619],4:[-0.005,6.4237,0.12402],5:[-0.043,6.8985,0.12274],6:[-0.0756,7.297,0.12204],7:[-0.1039,7.6422,0.12178],8:[-0.1288,7.9487,0.12181],9:[-0.1507,8.2254,0.12199],10:[-0.17,8.48,0.12223],11:[-0.1872,8.7192,0.12247],12:[-0.2024,8.9481,0.12268],13:[-0.2158,9.1699,0.12283],14:[-0.2278,9.387,0.12294],15:[-0.2384,9.6008,0.12299],16:[-0.2478,9.8124,0.12303],17:[-0.2562,10.0226,0.12306],18:[-0.2637,10.2315,0.12309],19:[-0.2703,10.4393,0.12315],20:[-0.2762,10.6464,0.12323],21:[-0.2815,10.8534,0.12335],22:[-0.2862,11.0608,0.1235],23:[-0.2903,11.2688,0.12369],
    24:[-0.752207,12.134555,0.10774],36:[-1.024471,13.941083,0.119492],48:[-1.131368,15.207214,0.128006],60:[-1.228026,17.179409,0.136765],72:[-1.318459,19.468684,0.145476],84:[-1.399339,22.090064,0.154148],96:[-1.468007,25.08046,0.162683],108:[-1.523103,28.475573,0.170978],120:[-1.564519,32.311832,0.178955],132:[-1.592613,36.61782,0.186542],144:[-1.607814,41.413714,0.193596],156:[-1.610803,46.719136,0.199941],168:[-1.602844,52.439869,0.205327],180:[-1.585285,58.383609,0.209486],192:[-1.651248,53.945437,0.168125],204:[-1.838092,55.182168,0.161753],216:[-1.850946,56.229696,0.16037],
  },
};

// BMI LMS
export const BMI_LMS: Record<'M' | 'F', Record<number, LMS>> = {
  M: {
    0:[-0.3053,13.4069,0.0956],1:[0.2708,14.9441,0.09027],2:[0.1118,16.3195,0.08677],3:[0.0068,16.8987,0.08495],4:[-0.0727,17.1579,0.08378],5:[-0.137,17.2919,0.08296],6:[-0.1913,17.3422,0.08234],7:[-0.2385,17.3288,0.08183],8:[-0.2802,17.2647,0.0814],9:[-0.3176,17.1662,0.08102],10:[-0.3516,17.0488,0.08068],11:[-0.3828,16.9239,0.08037],12:[-0.4115,16.7981,0.08009],13:[-0.4382,16.6743,0.07982],14:[-0.463,16.5548,0.07958],15:[-0.4863,16.4409,0.07935],16:[-0.5082,16.3335,0.07913],17:[-0.5289,16.2329,0.07892],18:[-0.5484,16.1392,0.07873],19:[-0.5669,16.0528,0.07854],20:[-0.5846,15.9743,0.07836],21:[-0.6014,15.9039,0.07818],22:[-0.6174,15.8412,0.07802],23:[-0.6328,15.7852,0.07786],
    24:[-1.982374,16.547775,0.080127],36:[-1.419991,16.000304,0.072634],48:[-1.714869,15.628173,0.071889],60:[-1.935673,15.441658,0.071927],72:[-2.013074,15.327844,0.072508],84:[-2.060958,15.250234,0.073208],96:[-2.064736,15.240856,0.074198],108:[-2.021254,15.314736,0.075432],120:[-1.93714,15.477516,0.077017],132:[-1.817085,15.739888,0.079163],144:[-1.669897,16.117256,0.081849],156:[-1.499619,16.618827,0.084902],168:[-1.31239,17.234427,0.087846],180:[-1.118484,17.942979,0.090484],192:[-2.039015,20.557647,0.134198],204:[-1.9635,21.130069,0.133238],216:[-1.87467,21.895868,0.132286],
  },
  F: {
    0:[-0.0631,13.3363,0.09272],1:[0.3448,14.5679,0.09556],2:[0.1749,15.7679,0.09371],3:[0.0643,16.3574,0.09254],4:[-0.0191,16.6703,0.09166],5:[-0.0864,16.8386,0.09096],6:[-0.1429,16.9083,0.09036],7:[-0.1916,16.902,0.08984],8:[-0.2344,16.8404,0.08939],9:[-0.2725,16.7406,0.08898],10:[-0.3068,16.6184,0.08861],11:[-0.3381,16.4875,0.08828],12:[-0.3667,16.3568,0.08797],13:[-0.3932,16.2311,0.08768],14:[-0.4177,16.1128,0.08741],15:[-0.4407,16.0028,0.08716],16:[-0.4623,15.9017,0.08693],17:[-0.4825,15.8096,0.08671],18:[-0.5017,15.7263,0.0865],19:[-0.5199,15.6517,0.0863],20:[-0.5372,15.5855,0.08612],21:[-0.5537,15.5278,0.08594],22:[-0.5695,15.4787,0.08577],23:[-0.5846,15.438,0.0856],
    24:[-1.024497,16.388041,0.085026],36:[-2.096829,15.699242,0.078605],48:[-2.768465,15.401934,0.078011],60:[-3.047224,15.24263,0.07836],72:[-3.122586,15.169208,0.079258],84:[-3.103906,15.183738,0.080666],96:[-2.980716,15.283036,0.082529],108:[-2.769791,15.469093,0.084714],120:[-2.484963,15.744014,0.087089],132:[-2.143166,16.110282,0.089614],144:[-1.762099,16.573278,0.092286],156:[-1.357882,17.140538,0.095065],168:[-0.946418,17.814462,0.09794],180:[-0.543034,18.589978,0.100741],192:[-2.119157,20.453256,0.14909],204:[-2.215738,20.905758,0.147638],216:[-2.303688,21.275322,0.147269],
  },
};

/* ----------------------------------------------------------------
 * LMS Z-score → 百分位（标准正态 CDF 近似）
 * ---------------------------------------------------------------- */
function normCDF(z: number): number {
  // Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z >= 0 ? 1 - p : p;
}

function lmsLookup(table: Record<'M' | 'F', Record<number, LMS>>, sex: 'M' | 'F', ageMonths: number): LMS | null {
  const sexTable = table[sex];
  if (!sexTable) return null;
  // 精确匹配
  if (sexTable[ageMonths]) return sexTable[ageMonths];
  // 线性插值
  const ages = Object.keys(sexTable).map(Number).sort((a, b) => a - b);
  const lo = ages.filter(a => a <= ageMonths).at(-1);
  const hi = ages.find(a => a > ageMonths);
  if (lo === undefined || hi === undefined) return sexTable[ages[ages.length - 1]] ?? null;
  const t = (ageMonths - lo) / (hi - lo);
  const a = sexTable[lo], b = sexTable[hi];
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
}

function lmsPercentile(value: number, lms: LMS): number {
  const [L, M, S] = lms;
  let z: number;
  if (Math.abs(L) < 1e-6) {
    z = Math.log(value / M) / S;
  } else {
    z = (Math.pow(value / M, L) - 1) / (L * S);
  }
  return Math.min(99.9, Math.max(0.1, normCDF(z) * 100));
}

/**
 * 根据月龄、性别、身高/体重/BMI 计算百分位
 * gender: 'boy' | 'girl' | 'other' | null
 * 返回 null 表示该月龄没有数据
 */
export function calcPercentiles(opts: {
  ageMonths: number;
  gender: string | null | undefined;
  heightCm?: number | null;
  weightKg?: number | null;
}): { height: number | null; weight: number | null; bmi: number | null } {
  const sex: 'M' | 'F' = opts.gender === 'girl' ? 'F' : 'M';
  const age = Math.round(opts.ageMonths);

  const hLms = opts.heightCm != null ? lmsLookup(HEIGHT_LMS, sex, age) : null;
  const wLms = opts.weightKg != null ? lmsLookup(WEIGHT_LMS, sex, age) : null;
  const bmiVal = opts.heightCm && opts.weightKg ? bmiOf(opts.heightCm, opts.weightKg) : null;
  const bLms = bmiVal != null ? lmsLookup(BMI_LMS, sex, age) : null;

  return {
    height: hLms && opts.heightCm != null ? Math.round(lmsPercentile(opts.heightCm, hLms)) : null,
    weight: wLms && opts.weightKg != null ? Math.round(lmsPercentile(opts.weightKg, wLms)) : null,
    bmi: bLms && bmiVal != null ? Math.round(lmsPercentile(bmiVal, bLms)) : null,
  };
}