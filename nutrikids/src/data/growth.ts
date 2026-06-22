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
export interface TierByGender      { male: Tier;     female: Tier }
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
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
      { male: 'important',  female: 'important'  },
      { male: 'supporting', female: 'important'  }, // ← 性别差异
      { male: 'supporting', female: 'supporting' },
    ],
    nutrientsByAge: [
      { male: ['DHA','Choline','Iron','Vitamin B12','Folate'],                female: ['DHA','Choline','Iron','Vitamin B12','Folate'] },
      { male: ['DHA','Choline','Iron','Vitamin B6','Vitamin B12','Folate'],   female: ['DHA','Choline','Iron','Vitamin B6','Vitamin B12','Folate'] },
      { male: ['Iron','Choline','DHA','Vitamin B12','Folate','Zinc'],         female: ['Iron','Choline','DHA','Vitamin B12','Folate','Zinc'] },
      { male: ['Iron','Choline','Zinc','Iodine'],                             female: ['Iron','Choline','Zinc','Iodine'] },
      { male: ['Iron','Omega-3','Choline','B12','Zinc'],                      female: ['Omega-3','Choline','B12','Zinc'] },
      { male: ['Omega-3','Choline','Iron','Zinc'],                            female: ['Iron','Omega-3','Choline','B12','Zinc'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'bone', emoji: '🦴', name: 'Bone Development', nameZh: '骨骼发育', nameEs: 'Desarrollo Óseo',
    tiersByAge: [
      { male: 'supporting', female: 'supporting' },
      { male: 'important',  female: 'important'  },
      { male: 'important',  female: 'important'  },
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
    ],
    nutrientsByAge: [
      { male: ['Calcium','Vitamin D','Phosphorus'],                                female: ['Calcium','Vitamin D','Phosphorus'] },
      { male: ['Calcium','Vitamin D','Phosphorus','Magnesium'],                    female: ['Calcium','Vitamin D','Phosphorus','Magnesium'] },
      { male: ['Calcium','Vitamin D','Magnesium','Protein','Vitamin K'],           female: ['Calcium','Vitamin D','Magnesium','Protein','Vitamin K'] },
      { male: ['Calcium 1000mg/d','Vitamin D','Phosphorus','Magnesium','Protein'], female: ['Calcium 1000mg/d','Vitamin D','Phosphorus','Magnesium','Protein'] },
      { male: ['Calcium 1300mg/d','Vitamin D','Magnesium','Protein','Vitamin K'],  female: ['Calcium 1300mg/d','Magnesium','Protein','Vitamin K'] },
      { male: ['Calcium 1300mg/d','Vitamin D','Magnesium','Protein','Zinc'],       female: ['Vitamin D','Magnesium','Protein','Zinc','Vitamin K'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'growth', emoji: '📏', name: 'Healthy Growth', nameZh: '健康成长', nameEs: 'Crecimiento Saludable',
    tiersByAge: [
      { male: 'core',      female: 'core'       },
      { male: 'core',      female: 'core'       },
      { male: 'important', female: 'important'  },
      { male: 'core',      female: 'core'       },
      { male: 'important', female: 'important'  },
      { male: 'important', female: 'supporting' }, // ← 性别差异
    ],
    nutrientsByAge: [
      { male: ['Protein','Total Lipid','DHA','Iron','Folate'],              female: ['Protein','Total Lipid','DHA','Iron','Folate'] },
      { male: ['Protein','Iron','Zinc','Vitamin A','Linoleic Acid'],        female: ['Protein','Iron','Zinc','Vitamin A','Linoleic Acid'] },
      { male: ['Protein','Iron','Zinc','Vitamin A','Folate','Carbohydrate'],female: ['Protein','Iron','Zinc','Vitamin A','Folate','Carbohydrate'] },
      { male: ['Protein','Iron','Zinc','Vitamin A','Linolenic Acid'],       female: ['Protein','Iron','Zinc','Vitamin A','Linolenic Acid'] },
      { male: ['Zinc','Iron','Vitamin A','Carbohydrate','Creatine'],        female: ['Protein','Zinc','Folate','Vitamin A'] },
      { male: ['Zinc','Iron','Carbohydrate'],                               female: ['Protein','Folate','Zinc','Iodine'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'muscle', emoji: '💪', name: 'Muscle Development', nameZh: '肌肉发育', nameEs: 'Desarrollo Muscular',
    tiersByAge: [
      { male: 'supporting', female: 'supporting' },
      { male: 'supporting', female: 'supporting' },
      { male: 'supporting', female: 'supporting' },
      { male: 'important',  female: 'important'  },
      { male: 'core',       female: 'important'  }, // ← 性别差异
      { male: 'core',       female: 'important'  }, // ← 性别差异
    ],
    nutrientsByAge: [
      { male: ['Protein','Iron','Zinc'],                                         female: ['Protein','Iron','Zinc'] },
      { male: ['Protein','Iron','Zinc','Vitamin D'],                             female: ['Protein','Iron','Zinc','Vitamin D'] },
      { male: ['Protein','Iron','Zinc','Magnesium','Carbohydrate'],              female: ['Protein','Iron','Zinc','Magnesium','Carbohydrate'] },
      { male: ['Protein','Iron','Zinc','Vitamin D','Potassium','Carbohydrate'],  female: ['Protein','Iron','Zinc','Vitamin D','Potassium','Carbohydrate'] },
      { male: ['Zinc','Iron','Magnesium','Vitamin D','Creatine','Carbohydrate'], female: ['Iron','Zinc','Magnesium','Vitamin D','Carbohydrate'] },
      { male: ['Zinc','Iron','Magnesium','Vitamin D','Creatine','Potassium'],    female: ['Iron','Zinc','Magnesium','Calcium','Vitamin D'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'immune', emoji: '🛡️', name: 'Immune Development', nameZh: '免疫发育', nameEs: 'Desarrollo Inmune',
    tiersByAge: [
      { male: 'important', female: 'important' },
      { male: 'important', female: 'important' },
      { male: 'core',      female: 'core'      },
      { male: 'important', female: 'important' },
      { male: 'important', female: 'important' },
      { male: 'important', female: 'important' },
    ],
    nutrientsByAge: [
      { male: ['Vitamin A','Vitamin D','Zinc','Iron'],                                    female: ['Vitamin A','Vitamin D','Zinc','Iron'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein'],               female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Probiotics'], female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Probiotics'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'],   female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'],   female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Protein','Selenium'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'],   female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Protein','Selenium','Omega-3'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'gut', emoji: '🦠', name: 'Gut Development', nameZh: '肠道发育', nameEs: 'Desarrollo Intestinal',
    tiersByAge: [
      { male: 'core',       female: 'core'       },
      { male: 'supporting', female: 'supporting' },
      { male: 'important',  female: 'important'  },
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
      { male: 'important',  female: 'core'       }, // ← 性别差异
    ],
    nutrientsByAge: [
      { male: ['DHA','Vitamin A','Lutein','Zeaxanthin'],                          female: ['DHA','Vitamin A','Lutein','Zeaxanthin'] },
      { male: ['Iron','DHA','Zinc','Iodine'],                                     female: ['Iron','DHA','Zinc','Iodine'] },
      { male: ['Iron','DHA','Zinc','Iodine','Choline'],                           female: ['Iron','DHA','Zinc','Iodine','Choline'] },
      { male: ['Iron','Zinc','Iodine','Magnesium','Vitamin B6'],                  female: ['Iron','Zinc','Iodine','Magnesium','Vitamin B6'] },
      { male: ['Iron','Omega-3','Zinc','Magnesium','Vitamin B12','Vitamin D'],    female: ['Omega-3','Zinc','Magnesium','Vitamin B12','Vitamin D','Folate'] },
      { male: ['Omega-3','Iron','Zinc','Magnesium','Vitamin B12','Vitamin D'],    female: ['Omega-3','Folate','Zinc','Magnesium','Vitamin B12'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'mood', emoji: '😌', name: 'Emotional & Mood', nameZh: '情绪与心理', nameEs: 'Emocional y Ánimo',
    tiersByAge: [
      { male: 'supporting', female: 'supporting' },
      { male: 'supporting', female: 'supporting' },
      { male: 'supporting', female: 'supporting' },
      { male: 'supporting', female: 'supporting' },
      { male: 'important',  female: 'important'  },
      { male: 'important',  female: 'core'       }, // ← 性别差异
    ],
    nutrientsByAge: [
      { male: [],                                                                           female: [] },
      { male: [],                                                                           female: [] },
      { male: ['Iron','Zinc','Vitamin D'],                                                  female: ['Iron','Zinc','Vitamin D'] },
      { male: ['Omega-3','Iron','Zinc','Vitamin D','Magnesium'],                           female: ['Omega-3','Iron','Zinc','Vitamin D','Magnesium'] },
      { male: ['Omega-3','Zinc','Magnesium','Vitamin D','B-vitamins'],                     female: ['Omega-3','Iron','Vitamin D','Vitamin B6','Folate','Zinc'] },
      { male: ['Omega-3','Zinc','Magnesium','Vitamin D','Vitamin B12','Tryptophan'],       female: ['Omega-3','Iron','Vitamin D','Vitamin B6','Folate','Tryptophan','Calcium'] },
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
export function higherTier(a: Tier, b: Tier): Tier {
  return TIER_ORDER.indexOf(a) <= TIER_ORDER.indexOf(b) ? a : b;
}
export function mergeNeutral(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b])).slice(0, 7);
}

export const TIER_CONFIG: Record<Tier, { color: string; bg: string; label: string; labelZh: string; labelEs: string; textColor: string }> = {
  core:       { color: '#893ce3', bg: 'rgba(137,60,227,0.05)', label: 'Core',       labelZh: '核心', labelEs: 'Esencial',       textColor: '#3b1f6e' },
  important:  { color: '#0891b2', bg: 'rgba(8,145,178,0.06)',  label: 'Important',  labelZh: '重要', labelEs: 'Importante',     textColor: '#0e7490' },
  supporting: { color: '#16a34a', bg: 'rgba(22,163,74,0.05)',  label: 'Supporting', labelZh: '辅助', labelEs: 'Complementario', textColor: '#15803d' },
};

/* ================================================================
 * 每日营养指南（IOM DRI，按年龄段）—— 不改动
 * ================================================================ */

export interface DriNutrient {
  name: string; nameZh: string; nameEs: string; unit: string;
  category: 0 | 1 | 2;
  values: number[];
  max: number;
  goals: string[];
}

export const DRI_NUTRIENTS: DriNutrient[] = [
  { name: 'Protein',   nameZh: '蛋白质',    nameEs: 'Proteína',      unit: 'g',   category: 0, values: [9, 11, 13, 19, 34, 49],         max: 55,   goals: ['🦠','🛡️','📏','🦷','💪'] },
  { name: 'Carbs',     nameZh: '碳水',      nameEs: 'Carbohidratos', unit: 'g',   category: 0, values: [60, 95, 130, 130, 130, 130],      max: 140,  goals: ['💪','📏'] },
  { name: 'Fiber',     nameZh: '膳食纤维',  nameEs: 'Fibra',         unit: 'g',   category: 0, values: [0, 0, 14, 25, 22, 26],            max: 30,   goals: ['🦠'] },
  { name: 'Calcium',   nameZh: '钙',        nameEs: 'Calcio',        unit: 'mg',  category: 1, values: [200, 260, 700, 1000, 1300, 1300], max: 1400, goals: ['🦷'] },
  { name: 'Iron',      nameZh: '铁',        nameEs: 'Hierro',        unit: 'mg',  category: 1, values: [0.27, 11, 7, 10, 8, 11],            max: 12,   goals: ['💪','🧠'] },
  { name: 'Zinc',      nameZh: '锌',        nameEs: 'Zinc',          unit: 'mg',  category: 1, values: [2, 3, 3, 5, 8, 9],               max: 10,   goals: ['🛡️','🧠','📏'] },
  { name: 'Magnesium', nameZh: '镁',        nameEs: 'Magnesio',      unit: 'mg',  category: 1, values: [30, 75, 80, 130, 240, 360],       max: 400,  goals: ['💪','🦷'] },
  { name: 'Vit A',     nameZh: '维生素A',   nameEs: 'Vit A',         unit: 'mcg', category: 2, values: [400, 500, 300, 400, 600, 800],    max: 900,  goals: ['📏','🛡️','👁️'] },
  { name: 'Vit D',     nameZh: '维生素D',   nameEs: 'Vit D',         unit: 'IU',  category: 2, values: [400, 400, 600, 600, 600, 600],    max: 650,  goals: ['🛡️','💪','🦷'] },
  { name: 'Vit C',     nameZh: '维生素C',   nameEs: 'Vit C',         unit: 'mg',  category: 2, values: [40, 50, 15, 25, 45, 65],          max: 75,   goals: ['🦷','🛡️'] },
  { name: 'Vit B12',   nameZh: '维生素B12', nameEs: 'Vit B12',       unit: 'mcg', category: 2, values: [0.4, 0.5, 0.9, 1.2, 1.8, 2.4],   max: 2.8,  goals: ['🧠'] },
  { name: 'Folate',    nameZh: '叶酸',      nameEs: 'Folato',        unit: 'mcg', category: 2, values: [65, 80, 150, 200, 300, 400],      max: 440,  goals: ['📏','🧠'] },
];

export const DRI_CATEGORIES = [
  { color: '#0e9aad', colorDark: '#0e7490', bg: 'rgba(14,154,173,0.18)', label: 'Macronutrients', labelZh: '宏量营养素', labelEs: 'Macronutrientes', range: [0, 2] },
  { color: '#22d3ee', colorDark: '#0891b2', bg: 'rgba(34,211,238,0.12)', label: 'Minerals',       labelZh: '矿物质',     labelEs: 'Minerales',       range: [3, 6] },
  { color: '#5eead4', colorDark: '#0d9488', bg: 'rgba(94,234,212,0.08)', label: 'Vitamins',       labelZh: '维生素',     labelEs: 'Vitaminas',       range: [7, 11] },
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