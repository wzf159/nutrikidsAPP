// ================================================================
// 发育目标数据 — 按年龄段 × 性别分层
// 来源: Children's Nutrition Development Matrix (NIH ODS / IOM DRI)
// ageIdx: 0=0-6m  1=7-12m  2=1-3y  3=4-8y  4=9-13y  5=14-18y
// ================================================================

export type Tier = 'core' | 'important' | 'supporting';

export interface TierByGender { male: Tier; female: Tier }
export interface NutrientsByGender { male: string[]; female: string[] }

export interface DevGoal {
  id: string;
  emoji: string;
  name: string;
  nameZh: string;
  nameEs: string;
  tiersByAge: TierByGender[];         // length 6, indexed by ageIdx
  nutrientsByAge: NutrientsByGender[]; // length 6, indexed by ageIdx
  nutrientsZhByAge: NutrientsByGender[];
}

// 营养素英文→中文映射
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
  'Vitamin B9': '维生素B9', 'Fat': '脂肪', 'Fiber': '膳食纤维',
  'Vitamin E': '维生素E', 'B12': '维生素B12', 'Calcium (Foundational)': '钙',
};

function zh(list: string[]): string[] {
  return list.map(n => N[n] ?? n);
}

export const DEV_GOALS: DevGoal[] = [
  {
    id: 'brain',
    emoji: '🧠',
    name: 'Brain Development',
    nameZh: '大脑发育',
    nameEs: 'Desarrollo cerebral',
    tiersByAge: [
      { male: 'core',       female: 'core'      }, // 0-6m
      { male: 'core',       female: 'core'      }, // 7-12m
      { male: 'core',       female: 'core'      }, // 1-3y
      { male: 'important',  female: 'important' }, // 4-8y
      { male: 'supporting', female: 'important' }, // 9-13y ← 性别差异
      { male: 'supporting', female: 'supporting'}, // 14-18y
    ],
    nutrientsByAge: [
      { male: ['DHA','Choline','Iron','Vitamin B12','Folate'],           female: ['DHA','Choline','Iron','Vitamin B12','Folate'] },
      { male: ['DHA','Choline','Iron','Vitamin B6','Vitamin B12','Folate'], female: ['DHA','Choline','Iron','Vitamin B6','Vitamin B12','Folate'] },
      { male: ['Iron','Choline','DHA','Vitamin B12','Folate','Zinc'],    female: ['Iron','Choline','DHA','Vitamin B12','Folate','Zinc'] },
      { male: ['Iron','Choline','Zinc','Iodine'],                        female: ['Iron','Choline','Zinc','Iodine'] },
      { male: ['Iron','Omega-3','Choline','B12','Zinc'],                 female: ['Omega-3','Choline','B12','Zinc'] },
      { male: ['Omega-3','Choline','Iron','Zinc'],                       female: ['Iron','Omega-3','Choline','B12','Zinc'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'bone',
    emoji: '🦴',
    name: 'Bone Development',
    nameZh: '骨骼发育',
    nameEs: 'Desarrollo óseo',
    tiersByAge: [
      { male: 'supporting', female: 'supporting' },
      { male: 'important',  female: 'important'  },
      { male: 'important',  female: 'important'  },
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
    ],
    nutrientsByAge: [
      { male: ['Calcium','Vitamin D','Phosphorus'],                           female: ['Calcium','Vitamin D','Phosphorus'] },
      { male: ['Calcium','Vitamin D','Phosphorus','Magnesium'],               female: ['Calcium','Vitamin D','Phosphorus','Magnesium'] },
      { male: ['Calcium','Vitamin D','Magnesium','Protein','Vitamin K'],      female: ['Calcium','Vitamin D','Magnesium','Protein','Vitamin K'] },
      { male: ['Calcium 1000mg/d','Vitamin D','Phosphorus','Magnesium','Protein'], female: ['Calcium 1000mg/d','Vitamin D','Phosphorus','Magnesium','Protein'] },
      { male: ['Calcium 1300mg/d','Vitamin D','Magnesium','Protein','Vitamin K'], female: ['Calcium 1300mg/d','Magnesium','Protein','Vitamin K'] },    // ← 女生少Vitamin D在9-13y
      { male: ['Calcium 1300mg/d','Vitamin D','Magnesium','Protein','Zinc'], female: ['Vitamin D','Magnesium','Protein','Zinc','Vitamin K'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'growth',
    emoji: '📏',
    name: 'Healthy Growth',
    nameZh: '健康成长',
    nameEs: 'Crecimiento saludable',
    tiersByAge: [
      { male: 'core',       female: 'core'       },
      { male: 'core',       female: 'core'       },
      { male: 'important',  female: 'important'  },
      { male: 'core',       female: 'core'       },
      { male: 'important',  female: 'important'  },
      { male: 'important',  female: 'supporting' }, // 14-18y ← 性别差异
    ],
    nutrientsByAge: [
      { male: ['Protein','Total Lipid','DHA','Iron','Folate'],         female: ['Protein','Total Lipid','DHA','Iron','Folate'] },
      { male: ['Protein','Iron','Zinc','Vitamin A','Linoleic Acid'],   female: ['Protein','Iron','Zinc','Vitamin A','Linoleic Acid'] },
      { male: ['Protein','Iron','Zinc','Vitamin A','Folate','Carbohydrate'], female: ['Protein','Iron','Zinc','Vitamin A','Folate','Carbohydrate'] },
      { male: ['Protein','Iron','Zinc','Vitamin A','Linolenic Acid'],  female: ['Protein','Iron','Zinc','Vitamin A','Linolenic Acid'] },
      { male: ['Zinc','Iron','Vitamin A','Carbohydrate','Creatine'],   female: ['Protein','Zinc','Folate','Vitamin A'] },  // ← 差异
      { male: ['Zinc','Iron','Carbohydrate'],                          female: ['Protein','Folate','Zinc','Iodine'] },     // ← 差异
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'muscle',
    emoji: '💪',
    name: 'Muscle Development',
    nameZh: '肌肉发育',
    nameEs: 'Desarrollo muscular',
    tiersByAge: [
      { male: 'supporting', female: 'supporting' }, // 0-6m (not present → default)
      { male: 'supporting', female: 'supporting' },
      { male: 'supporting', female: 'supporting' },
      { male: 'important',  female: 'important'  },
      { male: 'core',       female: 'important'  }, // 9-13y ← 性别差异
      { male: 'core',       female: 'important'  }, // 14-18y ← 性别差异
    ],
    nutrientsByAge: [
      { male: ['Protein','Iron','Zinc'],                                    female: ['Protein','Iron','Zinc'] },
      { male: ['Protein','Iron','Zinc','Vitamin D'],                        female: ['Protein','Iron','Zinc','Vitamin D'] },
      { male: ['Protein','Iron','Zinc','Magnesium','Carbohydrate'],         female: ['Protein','Iron','Zinc','Magnesium','Carbohydrate'] },
      { male: ['Protein','Iron','Zinc','Vitamin D','Potassium','Carbohydrate'], female: ['Protein','Iron','Zinc','Vitamin D','Potassium','Carbohydrate'] },
      { male: ['Zinc','Iron','Magnesium','Vitamin D','Creatine','Carbohydrate'], female: ['Iron','Zinc','Magnesium','Vitamin D','Carbohydrate'] },
      { male: ['Zinc','Iron','Magnesium','Vitamin D','Creatine','Potassium'], female: ['Iron','Zinc','Magnesium','Calcium','Vitamin D'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'immune',
    emoji: '🛡️',
    name: 'Immune Development',
    nameZh: '免疫发育',
    nameEs: 'Desarrollo inmunológico',
    tiersByAge: [
      { male: 'important', female: 'important' },
      { male: 'important', female: 'important' },
      { male: 'core',      female: 'core'      },
      { male: 'important', female: 'important' },
      { male: 'important', female: 'important' },
      { male: 'important', female: 'important' },
    ],
    nutrientsByAge: [
      { male: ['Vitamin A','Vitamin D','Zinc','Iron'],                          female: ['Vitamin A','Vitamin D','Zinc','Iron'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein'],    female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Probiotics'], female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Probiotics'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'], female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'], female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Protein','Selenium'] },
      { male: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Iron','Protein','Selenium'], female: ['Vitamin A','Vitamin C','Vitamin D','Zinc','Protein','Selenium','Omega-3'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'gut',
    emoji: '🦠',
    name: 'Gut Development',
    nameZh: '肠道发育',
    nameEs: 'Desarrollo intestinal',
    tiersByAge: [
      { male: 'core',      female: 'core'      },
      { male: 'supporting',female: 'supporting'},
      { male: 'important', female: 'important' },
      { male: 'core',      female: 'core'      },
      { male: 'core',      female: 'core'      },
      { male: 'important', female: 'core'      }, // 14-18y ← 性别差异
    ],
    nutrientsByAge: [
      { male: ['DHA','Vitamin A','Lutein','Zeaxanthin'],                female: ['DHA','Vitamin A','Lutein','Zeaxanthin'] },
      { male: ['Iron','DHA','Zinc','Iodine'],                           female: ['Iron','DHA','Zinc','Iodine'] },
      { male: ['Iron','DHA','Zinc','Iodine','Choline'],                 female: ['Iron','DHA','Zinc','Iodine','Choline'] },
      { male: ['Iron','Zinc','Iodine','Magnesium','Vitamin B6'],        female: ['Iron','Zinc','Iodine','Magnesium','Vitamin B6'] },
      { male: ['Iron','Omega-3','Zinc','Magnesium','Vitamin B12','Vitamin D'], female: ['Omega-3','Zinc','Magnesium','Vitamin B12','Vitamin D','Folate'] },
      { male: ['Omega-3','Iron','Zinc','Magnesium','Vitamin B12','Vitamin D'], female: ['Omega-3','Folate','Zinc','Magnesium','Vitamin B12'] },
    ],
    nutrientsZhByAge: [],
  },
  {
    id: 'mood',
    emoji: '😌',
    name: 'Emotional & Mood',
    nameZh: '情绪与心理',
    nameEs: 'Emocional y estado de ánimo',
    tiersByAge: [
      { male: 'supporting', female: 'supporting' }, // 0-6m (not present)
      { male: 'supporting', female: 'supporting' }, // 7-12m (not present)
      { male: 'supporting', female: 'supporting' },
      { male: 'supporting', female: 'supporting' },
      { male: 'important',  female: 'important'  }, // ← 注意CSV原始数据这里两性都是Important
      { male: 'important',  female: 'core'       }, // 14-18y ← 性别差异
    ],
    nutrientsByAge: [
      { male: [],                                                         female: [] },
      { male: [],                                                         female: [] },
      { male: ['Iron','Zinc','Vitamin D'],                                female: ['Iron','Zinc','Vitamin D'] },
      { male: ['Omega-3','Iron','Zinc','Vitamin D','Magnesium'],          female: ['Omega-3','Iron','Zinc','Vitamin D','Magnesium'] },
      { male: ['Omega-3','Zinc','Magnesium','Vitamin D','B-vitamins'],    female: ['Omega-3','Iron','Vitamin D','Vitamin B6','Folate','Zinc'] },
      { male: ['Omega-3','Zinc','Magnesium','Vitamin D','Vitamin B12','Tryptophan'], female: ['Omega-3','Iron','Vitamin D','Vitamin B6','Folate','Tryptophan','Calcium'] },
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

// 工具函数：合并性别中性视图（取两性中优先级更高的）
const TIER_ORDER: Tier[] = ['core', 'important', 'supporting'];
export function higherTier(a: Tier, b: Tier): Tier {
  return TIER_ORDER.indexOf(a) <= TIER_ORDER.indexOf(b) ? a : b;
}

export function mergeNeutral(a: string[], b: string[]): string[] {
  const set = new Set([...a, ...b]);
  return Array.from(set).slice(0, 7);
}

// 年龄段配置（与CSV对齐）
export const CSV_AGE_GROUPS = [
  { key: '0-6m',   label: '0–6m',   name: '0–6 months',  nameZh: '0–6个月',  nameEs: '0–6 meses',  icon: '🍼', badge: 'Infant 0–6m',     badgeZh: '婴儿 0–6月',     badgeEs: 'Bebé 0–6m',     min: 0, max: 6,  unit: 'm' },
  { key: '7-12m',  label: '7–12m',  name: '7–12 months', nameZh: '7–12个月', nameEs: '7–12 meses', icon: '🧸', badge: 'Infant 7–12m',    badgeZh: '婴儿 7–12月',    badgeEs: 'Bebé 7–12m',    min: 7, max: 12, unit: 'm' },
  { key: '1-3y',   label: '1–3y',   name: '1–3 years',   nameZh: '1–3岁',    nameEs: '1–3 años',   icon: '🐣', badge: 'Toddler 1–3y',   badgeZh: '幼儿 1–3岁',     badgeEs: 'Pequeño 1–3a',  min: 1, max: 3,  unit: 'y' },
  { key: '4-8y',   label: '4–8y',   name: '4–8 years',   nameZh: '4–8岁',    nameEs: '4–8 años',   icon: '🎒', badge: 'Child 4–8y',      badgeZh: '儿童 4–8岁',     badgeEs: 'Niño 4–8a',     min: 4, max: 8,  unit: 'y' },
  { key: '9-13y',  label: '9–13y',  name: '9–13 years',  nameZh: '9–13岁',   nameEs: '9–13 años',  icon: '🎓', badge: 'Pre-teen 9–13y',  badgeZh: '少年 9–13岁',    badgeEs: 'Preadol. 9–13a',min: 9, max: 13, unit: 'y' },
  { key: '14-18y', label: '14–18y', name: '14–18 years', nameZh: '14–18岁',  nameEs: '14–18 años', icon: '🧑', badge: 'Teen 14–18y',      badgeZh: '青少年 14–18岁', badgeEs: 'Adolesc. 14–18a',min: 14, max: 18, unit: 'y' },
];

// 根据孩子档案信息推断 ageIdx
export function stageIdxFromProfile(stageKey: string | null | undefined, age: number | null | undefined, ageMonths: number | null | undefined): number {
  // 先尝试 stageKey 匹配
  if (stageKey) {
    const idx = CSV_AGE_GROUPS.findIndex(g => g.key === stageKey);
    if (idx >= 0) return idx;
  }
  // 按月龄/年龄推断
  const months = ageMonths ?? (age != null ? age * 12 : null);
  if (months == null) return 3; // 默认 4-8y
  if (months <= 6)  return 0;
  if (months <= 12) return 1;
  if (months <= 36) return 2;
  if (months <= 96) return 3;
  if (months <= 156) return 4;
  return 5;
}

export const TIER_CONFIG = {
  core:       { label: 'Core',       labelZh: '核心',   labelEs: 'Esencial',    color: '#893ce3', bg: 'rgba(137,60,227,0.07)',  textColor: '#5b21b6' },
  important:  { label: 'Important',  labelZh: '重要',   labelEs: 'Importante',  color: '#0891b2', bg: 'rgba(8,145,178,0.07)',   textColor: '#0e7490' },
  supporting: { label: 'Supporting', labelZh: '辅助',   labelEs: 'Complementario', color: '#16a34a', bg: 'rgba(22,163,74,0.07)', textColor: '#15803d' },
};
