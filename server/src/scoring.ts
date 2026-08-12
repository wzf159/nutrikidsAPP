import { prisma } from './prisma.js';
import { computeDevScoreV2, computeGoalScoresV2 } from './scoring/devScoreV2.js';
import { computeAdditiveScoreV2 } from './scoring/additiveScoreV2.js';
import { hasAdditiveCategory } from './scoring/additiveCategories.js';
import { OFF_NUTRIENT_MAP, TOTAL_SUGAR_NUTRIENT_ID, ADDED_SUGAR_NUTRIENT_ID } from './productFinder.js';

// nutrients 字典 ID（见 seed.ts / productFinder.ts）
const SUGAR_NUTRIENT_ID = TOTAL_SUGAR_NUTRIENT_ID;
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


// ================================================================
// 儿童每日参考量：严格按当前 NutriKids 参考表。
// Added Sugar / Saturated Fat / Sodium 不在这里：它们继续走下方独立 watch limit。
// 没有表格值时返回 null，不再 fallback 到 OFF_NUTRIENT_MAP.dvRef。
// ================================================================

type DailyRefKey =
  | 'M0-6'
  | 'F0-6'
  | 'M7-12'
  | 'F7-12'
  | 'M1-3'
  | 'F1-3'
  | 'M4-8'
  | 'F4-8'
  | 'M9-13'
  | 'F9-13'
  | 'M14-18'
  | 'F14-18';

type DailyRefRow = Partial<Record<DailyRefKey, number>>;

// ================================================================
// 儿童每日参考量
// 严格按当前提供的 Nutrient × Gender × Age 表。
// N/A / 空白 = 没有官方每日摄入参考值，因此这里直接缺省，childDailyReference() 返回 null。
// 不再用其他年龄段替代，也不 fallback 到 OFF_NUTRIENT_MAP.dvRef。
//
// 单位必须与 ProductNutrient.value 的展示单位一致：
// - DHA 在 productFinder.ts 中当前以 g 存储，因此表里的 mg/day 在这里换算成 g/day。
// - 其余数值按当前 nutrient mapping 的 g / mg / μg 单位直接保存。
// ================================================================
const CHILD_DAILY_REFERENCE: Record<number, DailyRefRow> = {
  // DHA — nutrientId 24
  // source table: 100 mg/day (0–6m, 7–12m), N/A (1–3y, 4–8y), 250 mg/day (9–13y, 14–18y)
  // ProductNutrient.value unit is g, so 100 mg = 0.1 g; 250 mg = 0.25 g.
  24: {
    'M0-6': 0.1, 'F0-6': 0.1,
    'M7-12': 0.1, 'F7-12': 0.1,
    'M9-13': 0.25, 'F9-13': 0.25,
    'M14-18': 0.25, 'F14-18': 0.25,
  },

  // Choline mg/day — nutrientId 25
  25: {
    'M0-6': 125, 'F0-6': 125,
    'M7-12': 150, 'F7-12': 150,
    'M1-3': 200, 'F1-3': 200,
    'M4-8': 250, 'F4-8': 250,
    'M9-13': 375, 'F9-13': 375,
    'M14-18': 550, 'F14-18': 400,
  },

  // Iron mg/day — nutrientId 1
  1: {
    'M0-6': 0.27, 'F0-6': 0.27,
    'M7-12': 11, 'F7-12': 11,
    'M1-3': 7, 'F1-3': 7,
    'M4-8': 10, 'F4-8': 10,
    'M9-13': 8, 'F9-13': 8,
    'M14-18': 11, 'F14-18': 15,
  },

  // Vitamin B12 μg/day — nutrientId 12
  12: {
    'M0-6': 0.4, 'F0-6': 0.4,
    'M7-12': 0.5, 'F7-12': 0.5,
    'M1-3': 0.9, 'F1-3': 0.9,
    'M4-8': 1.2, 'F4-8': 1.2,
    'M9-13': 1.8, 'F9-13': 1.8,
    'M14-18': 2.4, 'F14-18': 2.4,
  },

  // Folate μg/day — nutrientId 28
  28: {
    'M0-6': 65, 'F0-6': 65,
    'M7-12': 80, 'F7-12': 80,
    'M1-3': 150, 'F1-3': 150,
    'M4-8': 200, 'F4-8': 200,
    'M9-13': 300, 'F9-13': 300,
    'M14-18': 400, 'F14-18': 400,
  },

  // Calcium mg/day — nutrientId 5
  5: {
    'M0-6': 200, 'F0-6': 200,
    'M7-12': 260, 'F7-12': 260,
    'M1-3': 700, 'F1-3': 700,
    'M4-8': 1000, 'F4-8': 1000,
    'M9-13': 1300, 'F9-13': 1300,
    'M14-18': 1300, 'F14-18': 1300,
  },

  // Vitamin D μg/day — nutrientId 6
  6: {
    'M0-6': 10, 'F0-6': 10,
    'M7-12': 10, 'F7-12': 10,
    'M1-3': 15, 'F1-3': 15,
    'M4-8': 15, 'F4-8': 15,
    'M9-13': 15, 'F9-13': 15,
    'M14-18': 15, 'F14-18': 15,
  },

  // Phosphorus mg/day — nutrientId 7
  7: {
    'M0-6': 100, 'F0-6': 100,
    'M7-12': 275, 'F7-12': 275,
    'M1-3': 460, 'F1-3': 460,
    'M4-8': 500, 'F4-8': 500,
    'M9-13': 1250, 'F9-13': 1250,
    'M14-18': 1250, 'F14-18': 1250,
  },

  // Vitamin A μg/day — nutrientId 11
  11: {
    'M0-6': 400, 'F0-6': 400,
    'M7-12': 500, 'F7-12': 500,
    'M1-3': 300, 'F1-3': 300,
    'M4-8': 400, 'F4-8': 400,
    'M9-13': 600, 'F9-13': 600,
    'M14-18': 900, 'F14-18': 700,
  },

  // Zinc mg/day — nutrientId 2
  2: {
    'M0-6': 2, 'F0-6': 2,
    'M7-12': 3, 'F7-12': 3,
    'M1-3': 3, 'F1-3': 3,
    'M4-8': 5, 'F4-8': 5,
    'M9-13': 8, 'F9-13': 8,
    'M14-18': 11, 'F14-18': 9,
  },

  // Protein g/day — nutrientId 13
  13: {
    'M0-6': 9.1, 'F0-6': 9.1,
    'M7-12': 13.5, 'F7-12': 13.5,
    'M1-3': 13, 'F1-3': 13,
    'M4-8': 19, 'F4-8': 19,
    'M9-13': 34, 'F9-13': 34,
    'M14-18': 52, 'F14-18': 46,
  },

  // Fluoride mg/day — nutrientId 27
  27: {
    'M0-6': 0.01, 'F0-6': 0.01,
    'M7-12': 0.5, 'F7-12': 0.5,
    'M1-3': 0.7, 'F1-3': 0.7,
    'M4-8': 1, 'F4-8': 1,
    'M9-13': 2, 'F9-13': 2,
    'M14-18': 3, 'F14-18': 3,
  },

  // Vitamin B6 mg/day — nutrientId 31
  31: {
    'M0-6': 0.1, 'F0-6': 0.1,
    'M7-12': 0.3, 'F7-12': 0.3,
    'M1-3': 0.5, 'F1-3': 0.5,
    'M4-8': 0.6, 'F4-8': 0.6,
    'M9-13': 1, 'F9-13': 1,
    'M14-18': 1.3, 'F14-18': 1.2,
  },

  // Magnesium mg/day — nutrientId 23
  23: {
    'M0-6': 30, 'F0-6': 30,
    'M7-12': 75, 'F7-12': 75,
    'M1-3': 80, 'F1-3': 80,
    'M4-8': 130, 'F4-8': 130,
    'M9-13': 240, 'F9-13': 240,
    'M14-18': 410, 'F14-18': 360,
  },

  // Vitamin C mg/day — nutrientId 9
  9: {
    'M0-6': 40, 'F0-6': 40,
    'M7-12': 50, 'F7-12': 50,
    'M1-3': 15, 'F1-3': 15,
    'M4-8': 25, 'F4-8': 25,
    'M9-13': 45, 'F9-13': 45,
    'M14-18': 75, 'F14-18': 65,
  },

  // Dietary Fiber g/day — nutrientId 20 + alias 22
  // 0–6m / 7–12m are N/A, so those keys are intentionally absent.
  20: {
    'M1-3': 19, 'F1-3': 19,
    'M4-8': 25, 'F4-8': 25,
    'M9-13': 26, 'F9-13': 31,
    'M14-18': 38, 'F14-18': 26,
  },
  22: {
    'M1-3': 19, 'F1-3': 19,
    'M4-8': 25, 'F4-8': 25,
    'M9-13': 26, 'F9-13': 31,
    'M14-18': 38, 'F14-18': 26,
  },

  // Potassium mg/day — nutrientId 14
  14: {
    'M0-6': 400, 'F0-6': 400,
    'M7-12': 700, 'F7-12': 700,
    'M1-3': 3000, 'F1-3': 3000,
    'M4-8': 3800, 'F4-8': 3800,
    'M9-13': 4500, 'F9-13': 4500,
    'M14-18': 4700, 'F14-18': 4700,
  },

  // Carbohydrate g/day — nutrientId 21
  21: {
    'M0-6': 60, 'F0-6': 60,
    'M7-12': 95, 'F7-12': 95,
    'M1-3': 130, 'F1-3': 130,
    'M4-8': 130, 'F4-8': 130,
    'M9-13': 130, 'F9-13': 130,
    'M14-18': 130, 'F14-18': 130,
  },

  // Vitamin E mg/day — nutrientId 32
  32: {
    'M0-6': 4, 'F0-6': 4,
    'M7-12': 5, 'F7-12': 5,
    'M1-3': 6, 'F1-3': 6,
    'M4-8': 7, 'F4-8': 7,
    'M9-13': 11, 'F9-13': 11,
    'M14-18': 15, 'F14-18': 15,
  },

  // Vitamin K μg/day — nutrientId 33
  33: {
    'M0-6': 2, 'F0-6': 2,
    'M7-12': 2.5, 'F7-12': 2.5,
    'M1-3': 30, 'F1-3': 30,
    'M4-8': 55, 'F4-8': 55,
    'M9-13': 60, 'F9-13': 60,
    'M14-18': 75, 'F14-18': 75,
  },

  // Iodine μg/day — nutrientId 29
  29: {
    'M0-6': 110, 'F0-6': 110,
    'M7-12': 130, 'F7-12': 130,
    'M1-3': 90, 'F1-3': 90,
    'M4-8': 90, 'F4-8': 90,
    'M9-13': 120, 'F9-13': 120,
    'M14-18': 150, 'F14-18': 150,
  },

  // Selenium μg/day — nutrientId 10
  10: {
    'M0-6': 15, 'F0-6': 15,
    'M7-12': 20, 'F7-12': 20,
    'M1-3': 20, 'F1-3': 20,
    'M4-8': 30, 'F4-8': 30,
    'M9-13': 40, 'F9-13': 40,
    'M14-18': 55, 'F14-18': 55,
  },

  // Intentionally omitted because the provided table says N/A / no official DRI:
  // - HMO
  // - Probiotics
  // - Lutein
  // - Zeaxanthin
  // - Prebiotics
  // - Creatine (nutrientId 26)
};

type ChildForReference = {
  age: number | null;
  ageMonths: number | null;
  stageKey: string | null;
  gender: string | null;
};

function dailyRefKey(child: ChildForReference): DailyRefKey | null {
  const sex = child.gender === 'girl' ? 'F' : 'M';

  switch (child.stageKey) {
    case '0-6m':
      return `${sex}0-6` as DailyRefKey;
    case '7-12m':
      return `${sex}7-12` as DailyRefKey;
    case '1-3y':
      return `${sex}1-3` as DailyRefKey;
    case '4-8y':
      return `${sex}4-8` as DailyRefKey;
    case '9-13y':
      return `${sex}9-13` as DailyRefKey;
    case '14-18y':
      return `${sex}14-18` as DailyRefKey;
    default:
      return null;
  }
}

function childDailyReference(
  nutrientId: number,
  child: ChildForReference
): number | null {
  const key = dailyRefKey(child);
  if (!key) return null;

  const ref = CHILD_DAILY_REFERENCE[nutrientId]?.[key];

  // N/A / 空白没有写进表，因此这里自然返回 null。
  return typeof ref === 'number' && Number.isFinite(ref) && ref > 0
    ? ref
    : null;
}

// 只使用“真实每份 value ÷ 儿童年龄/性别 daily reference”。
// value 为 null（OFF 没有可靠 serving size）或该营养素该年龄段为 N/A 时，不计算百分比。
function childDailyPercent(
  nutrient: { nutrientId: number; value: number | null },
  child: ChildForReference
): number | null {
  if (nutrient.value == null) return null;

  const amount = Number(nutrient.value);
  const ref = childDailyReference(nutrient.nutrientId, child);

  if (!Number.isFinite(amount) || ref == null) return null;
  return (amount / ref) * 100;
}

function watchLimitPercent(
  value: number | null | undefined,
  limit: number | null
): number | null {
  if (value == null || limit == null || limit <= 0) return null;

  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;

  return (amount / limit) * 100;
}

// ProductNutrient.value100g 是 OFF 原始单位；UI 需要按 mapping.factor 转为展示单位。
function displayValue100g(nutrientId: number, rawValue100g: number | null | undefined): number | null {
  if (rawValue100g == null) return null;
  const raw = Number(rawValue100g);
  if (!Number.isFinite(raw)) return null;

  const mapping = OFF_NUTRIENT_MAP.find((m) => m.nutrientId === nutrientId);
  if (!mapping) return raw;

  return raw * mapping.factor;
}

const WEIGHTS = {
  nutrientDensity: 0.4,
  riskIngredients: 0.3,
  processingLevel: 0.2,
  stageMatch: 0.1,
} as const;

// ================================================================
// 发育目标 Priority + Key Nutrients
// 严格对应 Children's Nutrition Development Matrix 的两列：
//   Priority / Key Nutrients
// stage index: 0=0–6m, 1=7–12m, 2=1–3y, 3=4–8y, 4=9–13y, 5=14–18y
//
// 说明：
// - Omega-3 / DHA/EPA 统一映射到当前数据库已有 DHA nutrientId=24。
// - Probiotics / Prebiotics / HMO / Zeaxanthin 当前没有对应 nutrientId，不能凭空映射，因此不进入 nutrient evidence。
// - Fluoride 在当前 Development Matrix 的 Dental Key Nutrients 中明确列出，因此按 nutrientId=27 保留。
// - Creatine 虽标为 Unverified / no official DRI，但表中列于 Key Nutrients，且数据库已有 nutrientId=26，因此保留。
// ================================================================

type StageGenderNutrients = {
  male: number[];
  female: number[];
};

export const GOAL_NUTRIENT_MAP: Record<number, StageGenderNutrients[]> = {
  // 1 🧠 Brain Development
  1: [
    { male: [24, 25, 1, 12, 28], female: [24, 25, 1, 12, 28] },
    { male: [24, 25, 1, 31, 12, 28], female: [24, 25, 1, 31, 12, 28] },
    { male: [1, 25, 24, 12, 28, 2], female: [1, 25, 24, 12, 28, 2] },
    { male: [1, 24, 25, 2, 29], female: [1, 24, 25, 2, 29] },
    { male: [1, 24, 25, 12, 2], female: [1, 24, 25, 12, 2] },
    { male: [24, 25, 1, 12, 28], female: [1, 24, 28, 25, 12] },
  ],

  // 2 🦴 Bone Development
  2: [
    { male: [5, 6, 7], female: [5, 6, 7] },
    { male: [5, 6, 7, 23], female: [5, 6, 7, 23] },
    { male: [5, 6, 23, 13, 33], female: [5, 6, 23, 13, 33] },
    { male: [5, 6, 7, 23, 13], female: [5, 6, 7, 23, 13] },
    { male: [5, 6, 23, 13, 33], female: [5, 6, 23, 13, 33] },
    { male: [5, 6, 23, 13, 2], female: [5, 6, 23, 13, 2, 33] },
  ],

  // 3 ❤️ Heart Growth
  3: [
    { male: [], female: [] },
    { male: [], female: [] },
    { male: [22, 24, 14], female: [22, 24, 14] },
    { male: [22, 24, 14, 23], female: [22, 24, 14, 23] },
    { male: [22, 24, 14, 23], female: [22, 24, 14, 23] },
    { male: [22, 24, 14, 23], female: [22, 24, 14, 23, 1] },
  ],

  // 4 💪 Muscle Development
  4: [
    { male: [], female: [] },
    { male: [13, 1, 2, 6], female: [13, 1, 2, 6] },
    { male: [13, 1, 2, 23, 21], female: [13, 1, 2, 23, 21] },
    { male: [13, 1, 2, 6, 14, 21], female: [13, 1, 2, 6, 14, 21] },
    { male: [13, 2, 1, 23, 6, 26, 21], female: [13, 1, 2, 23, 6, 21] },
    { male: [13, 2, 1, 23, 6, 26, 14], female: [13, 1, 2, 23, 5, 6] },
  ],

  // 5 🛡️ Immune Development
  5: [
    { male: [11, 6, 2, 1, 13], female: [11, 6, 2, 1, 13] },
    { male: [11, 9, 6, 2, 1, 13], female: [11, 9, 6, 2, 1, 13] },
    { male: [11, 9, 6, 2, 1, 13], female: [11, 9, 6, 2, 1, 13] },
    { male: [11, 9, 6, 2, 1, 13, 10], female: [11, 9, 6, 2, 1, 13, 10] },
    { male: [11, 9, 6, 2, 1, 13, 10], female: [11, 9, 6, 2, 1, 13, 10] },
    { male: [11, 9, 6, 2, 1, 13, 10, 24], female: [11, 9, 6, 2, 1, 13, 10, 24] },
  ],

  // 6 🦠 Gut Development
  6: [
    { male: [6], female: [6] },
    { male: [22, 23, 14, 21], female: [22, 23, 14, 21] },
    { male: [22, 23, 14], female: [22, 23, 14] },
    { male: [22, 23, 14, 2], female: [22, 23, 14, 2] },
    { male: [22, 23, 14], female: [22, 23, 14] },
    { male: [22, 23, 14], female: [22, 23, 14, 1] },
  ],

  // 7 👀 Vision Development
  7: [
    { male: [24, 11, 30], female: [24, 11, 30] },
    { male: [24, 11, 30, 2, 32], female: [24, 11, 30, 2, 32] },
    { male: [11, 24, 32, 2, 30], female: [11, 24, 32, 2, 30] },
    { male: [11, 2, 32, 30], female: [11, 2, 32, 30] },
    { male: [11, 2], female: [11, 2] },
    { male: [11, 2, 30], female: [11, 2, 30] },
  ],

  // 8 🦷 Dental Development
  // Matrix Key Nutrients includes Fluoride at every age.
  // Fluoride = nutrientId 27.
  8: [
    { male: [27, 6], female: [27, 6] },
    { male: [27, 5, 6, 7], female: [27, 5, 6, 7] },
    { male: [27, 5, 6, 7, 9], female: [27, 5, 6, 7, 9] },
    { male: [27, 5, 6, 7, 9], female: [27, 5, 6, 7, 9] },
    { male: [27, 5, 6, 7, 9], female: [27, 5, 6, 7, 9] },
    { male: [27, 5, 6, 7, 9, 23], female: [27, 5, 6, 7, 9, 23] },
  ],
};

function goalNutrientIds(
  goalId: number,
  ageIdx: number,
  genderKey: 'male' | 'female'
): number[] {
  return GOAL_NUTRIENT_MAP[goalId]?.[ageIdx]?.[genderKey] ?? [];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export interface ScoreInput {
  userId: string;
  childId: string;
  productId: number;
  source?: string;
  imagePath?: string | null;
}

function viewReferenceBasis(servingSize: string | null): string {
  return servingSize?.trim() || 'serving unavailable';
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

  // AI fallback 产品没有 barcode。它可以展示营养估算、发育目标和 watch 信息，
  // 但不进入 Nutri-Score / FinalScore 评分流程。
  const isAiGenerated = !product.verified && product.barcode === null;

  const prodNutr = product.nutrients;
  console.log('additivesJson:', product.additivesJson);

  // 正向营养素不再读取数据库 dailyValue：
  // productFinder 现在只存真实 per-serving value（有 serving size 时）和 value100g。
  const positiveDailyPercents = prodNutr
    .filter((n: { nutrientId: number }) =>
      !EXCLUDED_FROM_POSITIVE_NUTRIENTS.has(n.nutrientId)
    )
    .map((n) => childDailyPercent(n, child))
    .filter((v): v is number => v != null && Number.isFinite(v));

  // 这些 breakdown 只是旧 UI 明细，不参与新版 FinalScore；
  // 仍保持可用，但来源改成真正的儿童年龄/性别参考占比。
  const densityRaw = positiveDailyPercents.reduce((sum, v) => sum + v, 0);
  const nutrientDensity = clamp(Math.round(densityRaw * 0.5), 0, 40);

  const badAdditives = product.additives.filter(
    (a: { additive: { type: string | null } }) =>
      a.additive.type !== 'beneficial'
  );

  // Added Sugar 的风险百分比在得到 ageIdx 和独立 sugarLimit 后再计算。
  // 这里先只保留添加剂扣分，避免读取已废弃的数据库 dailyValue。
  let riskIngredients = clamp(30 - badAdditives.length * 2, 0, 30);

  // 加工程度 (0..20)：NOVA 越低越好
  const novaMap: Record<number, number> = { 1: 20, 2: 17, 3: 15, 4: 8 };
  const processingLevel = novaMap[product.novaScore ?? 4] ?? 8;

  // 阶段匹配：也改用 childDailyPercent，不再读取 ProductNutrient.dailyValue。
  const childNutrIds = new Set(
    child.nutrients.map((c: { nutrientId: number }) => c.nutrientId)
  );
  const matched = prodNutr.filter((n) => {
    if (!childNutrIds.has(n.nutrientId)) return false;
    const pct = childDailyPercent(n, child);
    return pct != null && pct >= 10;
  }).length;

  const stageMatch = clamp(
    Math.round((matched / Math.max(childNutrIds.size, 1)) * 10),
    0,
    10
  );


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

  // Step B / C: NutriNorm + FinalScore
  //
  // 规则：
  // 1) AI fallback 产品：不使用 Nutri-Score，也不计算 FinalScore。
  // 2) 非 AI 产品：严格按 notebook 原算法走 Nutri-Score 分支。
  //    - A/B: NutriNorm + DevScore
  //    - C/D/E: NutriNorm - AdditiveScore
  // ======================================================
  // Step B / C: NutriNorm + FinalScore
  // ======================================================

  const alpha = 0.5;

  const hasNutriScore =
    product.nutriScore !== null &&
    product.nutriScore !== undefined;

  const nutriGradeLower =
    (product.nutriGrade ?? '').toLowerCase();

  let nutriNorm: number | null = null;
  let overallRaw: number | null = null;
  let additiveScore: number | null = null;


  // ------------------------------------------------------
  // 只有 OFF 提供了 Nutri-Score 时才计算 FinalScore
  // ------------------------------------------------------
  if (hasNutriScore) {
    nutriNorm = Math.max(
      0,
      Math.min(
        1,
        (55 - product.nutriScore!) / 72
      )
    );

    // ====================================================
    // Nutri-Score A / B
    // FinalScore = NutriNorm + DevScore
    // ====================================================
    if (
      nutriGradeLower === 'a' ||
      nutriGradeLower === 'b'
    ) {
      overallRaw =
        100 *
        (
          alpha * nutriNorm +
          (1 - alpha) * devScore
        );
    }

    // ====================================================
    // Nutri-Score C / D / E
    // FinalScore = NutriNorm - AdditiveScore
    // ====================================================
    else if (
      nutriGradeLower === 'c' ||
      nutriGradeLower === 'd' ||
      nutriGradeLower === 'e'
    ) {
      const additiveDebug: string[] = [];

      let additiveTagsForScore: string[] = [];

      try {
        additiveTagsForScore =
          product.additivesJson
            ? JSON.parse(product.additivesJson)
            : [];
      } catch {
        additiveTagsForScore = [];
      }

      additiveScore = computeAdditiveScoreV2(
        additiveTagsForScore,
        additiveDebug
      );

      console.log(additiveDebug.join('\n'));

      overallRaw = Math.max(
        0,
        100 *
        (
          alpha * nutriNorm -
          (1 - alpha) * additiveScore
        )
      );
    }

    // ====================================================
    // 有 nutriScore，但 grade 不合法
    // 不硬算分，也不报 422
    // ====================================================
    else {
      console.warn(
        `Nutri-Score exists but nutriGrade='${product.nutriGrade}' is invalid; FinalScore skipped.`
      );

      nutriNorm = null;
      overallRaw = null;
      additiveScore = null;
    }
  }

  // ======================================================
  // 没有 Nutri-Score
  // 包括：OFF 本身没有 Nutri-Score / AI 产品
  // 不计算最终分，但其他分析继续
  // ======================================================
  else {
    console.log(
      'Nutri-Score unavailable: skipping NutriNorm and FinalScore.'
    );

    nutriNorm = null;
    overallRaw = null;
    additiveScore = null;
  }



  // ======================================================
  // Debug
  // ======================================================

  console.log(
    'DevScore:',
    devScore.toFixed(3)
  );

  console.log(
    'NutriNorm:',
    nutriNorm !== null
      ? nutriNorm.toFixed(3)
      : 'N/A'
  );

  console.log(
    'nutriGrade:',
    nutriGradeLower || 'N/A',
    'additiveScore:',
    additiveScore
  );

  console.log(
    'FinalScore:',
    overallRaw !== null
      ? overallRaw.toFixed(1)
      : 'N/A'
  );

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


  // Added Sugar / Sodium / Saturated Fat 使用独立 watch-limit 表，
  // 不使用 CHILD_DAILY_REFERENCE，也不使用数据库 dailyValue。
  const addedSugarNutrient = prodNutr.find(
    (n: { nutrientId: number }) => n.nutrientId === ADDED_SUGAR_NUTRIENT_ID
  );

  const addedSugarG =
    addedSugarNutrient?.value == null
      ? null
      : Number(addedSugarNutrient.value);

  const addedSugarDailyPercent =
    sugarLimit > 0
      ? watchLimitPercent(addedSugarG, sugarLimit)
      : addedSugarG != null && addedSugarG > 0
        ? 100
        : 0;

  // legacy breakdown only
  riskIngredients = clamp(
    30 - Number(addedSugarDailyPercent ?? 0) * 0.6 - badAdditives.length * 2,
    0,
    30
  );

  let overall: number | null =
    overallRaw !== null ? Math.round(overallRaw) : null;

  let grade: string | null =
    overall === null
      ? null
      : overall >= 80
        ? 'Excellent'
        : overall >= 60
          ? 'Good'
          : overall >= 40
            ? 'Fair'
            : 'Poor';

  console.log('DevScore:', devScore.toFixed(3));
  console.log(
    'NutriNorm:',
    nutriNorm !== null ? nutriNorm.toFixed(3) : 'N/A'
  );
  console.log(
    'FinalScore:',
    overallRaw !== null ? overallRaw.toFixed(1) : 'N/A'
  );
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
  if (Number(addedSugarDailyPercent ?? 0) >= 10) factors.push({ kind: 'negative', label: 'Added Sugar' });
  if (allergenFlags.some((f: { matchesChild: boolean }) => f.matchesChild))
    factors.push({ kind: 'negative', label: 'Contains Child Allergen' });

  // ---------------- 前端视图数据（FoodAnalyzer 页面） ----------------
  // 营养素列表：排除糖/能量，按 %DV 排序
  const viewNutrients = prodNutr
    .filter(
      (n: { nutrientId: number }) =>
        !EXCLUDED_FROM_POSITIVE_NUTRIENTS.has(n.nutrientId)
    )
    .map((n) => {
      const dailyReference = childDailyReference(n.nutrientId, child);
      const dailyReferencePercent = childDailyPercent(n, child);

      return {
        id: n.nutrientId,
        name: n.nutrient.name,
        nameZh: n.nutrient.nameZh,
        icon: n.nutrient.icon,

        // value = 真实每份含量；OFF 没有可靠 serving size 时为 null。
        value: n.value,
        value100g: displayValue100g(n.nutrientId, (n as any).value100g),
        unit: n.unit,

        // 暂时保留 dailyValue 字段名兼容现有 FoodAnalyzer；
        // 语义现在是 child-specific daily reference percent，不是 FDA %DV。
        dailyValue: dailyReferencePercent,
        dailyReference,
        dailyReferencePercent,

        level:
          dailyReferencePercent == null
            ? 'Unavailable'
            : dailyReferencePercent >= 20
              ? 'High'
              : dailyReferencePercent >= 10
                ? 'Moderate'
                : 'Low',
      };
    })
    .filter(
      (n): n is typeof n & { dailyValue: number; dailyReferencePercent: number } =>
        n.dailyValue != null && n.dailyValue > 0
    )
    .sort((a, b) => b.dailyValue - a.dailyValue)
    .slice(0, 6);
  const viewNutrIds = new Set(viewNutrients.map((n: { id: number }) => n.id));

  // 目标分类与营养支持：
  // - tier 直接来自 Development Matrix 的 Priority 列；
  // - 对应营养素直接来自同一年龄/性别行的 Key Nutrients 列；
  // - flows 仍用真实每份占儿童 daily reference 的百分比展示实际贡献。
  const childGoalIds = new Set(child.goals.map((g: { goalId: number }) => g.goalId));
  const dvOf = (nid: number) => {
    const nutrient = prodNutr.find(
      (n: { nutrientId: number }) => n.nutrientId === nid
    );
    return nutrient ? (childDailyPercent(nutrient, child) ?? 0) : 0;
  };

  const flows: { goalId: number; nutrientId: number; value: number }[] = [];
  for (const goalId of childGoalIds) {
    for (const nid of goalNutrientIds(goalId, ageIdx, genderKey)) {
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
    const mappedIds = goalNutrientIds(goalId, ageIdx, genderKey);

    const contributing = mappedIds
      .map((nutrientId) => {
        const nutrient = prodNutr.find(
          (n: { nutrientId: number }) => n.nutrientId === nutrientId
        );

        if (!nutrient) return null;

        const dailyValue = childDailyPercent(nutrient, child) ?? 0;
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

    // Development goal classification comes directly from the matrix Priority column.
    // Product nutrient evidence affects supportDV / active-vs-inactive display,
    // but it does not redefine the developmental priority itself.
    return DEV_TIERS[goalId]?.[ageIdx]?.[genderKey] ?? null;
  };

  const viewGoals = allGoals.map((g) => {
    const evidence = goalEvidence(g.id);
    const tier = devTierOf(g.id);

    // supportDV 是 UI 展示值，不参与最终 DevScore。
    // 使用证据覆盖率抑制“一个营养素让整个目标满分”的视觉误导。
    const mappedCount = Math.max(goalNutrientIds(g.id, ageIdx, genderKey).length, 1);
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
  // scoreFood 函数里，在 flows 计算之前加
  console.log('childGoalIds:', [...childGoalIds]);
  console.log('viewNutrIds:', [...viewNutrIds]);
  console.log('viewNutrients:', viewNutrients.map(n => ({ id: n.id, name: n.name, dv: n.dailyValue })));
  console.log('GOAL_NUTRIENT_MAP check:', [...childGoalIds].map(gid => {
    const mappedNutrients = goalNutrientIds(gid, ageIdx, genderKey);
    return {
      goalId: gid,
      priority: DEV_TIERS[gid]?.[ageIdx]?.[genderKey] ?? null,
      mappedNutrients,
      matches: mappedNutrients.filter(nid => viewNutrIds.has(nid)),
    };
  }));
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

  const sodiumNutrient = prodNutr.find(
    (n: any) => n.nutrientId === SODIUM_NUTRIENT_ID
  );
  const satfatNutrient = prodNutr.find(
    (n: any) => n.nutrientId === SATURATED_FAT_NUTRIENT_ID
  );

  const sodiumDailyPercent = watchLimitPercent(
    sodiumNutrient?.value,
    sodiumLimit
  );

  const satfatDailyPercent = watchLimitPercent(
    satfatNutrient?.value,
    satfatLimit
  );

  const watch = [
    {
      code: 'added_sugar',
      icon: '🍬',
      name: 'Added Sugar',
      nameZh: '添加糖',

      // 没有真实 serving size -> value 为 null -> 不假装检测到 high。
      present:
        addedSugarG != null &&
        addedSugarG >= sugarThreshold &&
        (product.novaScore ?? 4) >= 2,

      value: addedSugarG,
      value100g: displayValue100g(
        ADDED_SUGAR_NUTRIENT_ID,
        (addedSugarNutrient as any)?.value100g
      ),
      unit: addedSugarNutrient?.unit ?? 'g',

      // 这里的 dailyValue 是“每份占该年龄段独立 sugar limit 的百分比”
      // 仅为了兼容现有前端字段名，不是 FDA %DV。
      dailyValue: addedSugarDailyPercent,
      ageLimit: sugarLimit,
      ageLimitUnit: 'g',
      threshold: sugarThreshold,
      referenceBasis: viewReferenceBasis(product.servingSize),

      detail:
        addedSugarG == null
          ? 'Serving size is unavailable, so per-serving added sugar cannot be calculated.'
          : sugarLimit === 0
            ? 'Added sugar is not recommended for this age group.'
            : `${Number(addedSugarDailyPercent ?? 0).toFixed(1)}% of the age-specific daily added sugar limit per serving (limit: ${sugarLimit}g).`,

      detailZh:
        addedSugarG == null
          ? '缺少可靠的每份重量，因此无法计算每份添加糖。'
          : sugarLimit === 0
            ? '该年龄段不建议摄入添加糖。'
            : `每份添加糖约占该年龄段每日上限的${Number(addedSugarDailyPercent ?? 0).toFixed(1)}%（上限：${sugarLimit}g）。`,
    },
    {
      code: 'flavors', icon: '🧪', name: 'Added Flavors', nameZh: '添加香精',
      present: hasIng(/flavor|extract|香精|香草提取/) || hasAdd(/flavor/) ||
        hasRawAdditive(['e620', 'e621', 'e622', 'e623', 'e624', 'e625', 'e635']),
      detail: 'Contains added flavoring. Generally recognized as safe, but indicates processing.',
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
      present:
        sodiumNutrient?.value != null &&
        Number(sodiumNutrient.value) > sodiumThreshold,
      value: sodiumNutrient?.value == null ? null : Number(sodiumNutrient.value),
      value100g: displayValue100g(
        SODIUM_NUTRIENT_ID,
        (sodiumNutrient as any)?.value100g
      ),
      unit: sodiumNutrient?.unit ?? 'mg',
      dailyValue: sodiumDailyPercent,
      ageLimit: sodiumLimit,
      ageLimitUnit: 'mg',
      threshold: sodiumThreshold,
      referenceBasis: viewReferenceBasis(product.servingSize),
      detail:
        sodiumNutrient?.value == null
          ? 'Serving size is unavailable, so per-serving sodium cannot be calculated.'
          : `${Number(sodiumDailyPercent ?? 0).toFixed(1)}% of the age-specific daily sodium limit per serving (limit: ${sodiumLimit}mg).`,
      detailZh:
        sodiumNutrient?.value == null
          ? '缺少可靠的每份重量，因此无法计算每份钠含量。'
          : `每份钠约占该年龄段每日上限的${Number(sodiumDailyPercent ?? 0).toFixed(1)}%（上限：${sodiumLimit}mg）。`
    },
    {
      code: 'satfat', icon: '🥩', name: 'Saturated Fat', nameZh: '饱和脂肪',
      present:
        satfatNutrient?.value != null &&
        Number(satfatNutrient.value) > satfatThreshold,
      value: satfatNutrient?.value == null ? null : Number(satfatNutrient.value),
      value100g: displayValue100g(
        SATURATED_FAT_NUTRIENT_ID,
        (satfatNutrient as any)?.value100g
      ),
      unit: satfatNutrient?.unit ?? 'g',
      dailyValue: satfatDailyPercent,
      ageLimit: satfatLimit,
      ageLimitUnit: 'g',
      threshold: satfatThreshold,
      referenceBasis: viewReferenceBasis(product.servingSize),
      detail:
        satfatNutrient?.value == null
          ? 'Serving size is unavailable, so per-serving saturated fat cannot be calculated.'
          : satfatLimit === null
            ? 'No daily saturated fat limit is defined for this age group.'
            : `${Number(satfatDailyPercent ?? 0).toFixed(1)}% of the age-specific daily saturated fat limit per serving (limit: ${satfatLimit}g).`,
      detailZh:
        satfatNutrient?.value == null
          ? '缺少可靠的每份重量，因此无法计算每份饱和脂肪。'
          : satfatLimit === null
            ? '该年龄段暂无明确的每日饱和脂肪上限。'
            : `每份饱和脂肪约占该年龄段每日上限的${Number(satfatDailyPercent ?? 0).toFixed(1)}%（上限：${satfatLimit}g）。`,
    },
    {
      code: 'transfat', icon: '⛽', name: 'Trans Fat', nameZh: '反式脂肪',
      // 只要出现即判定：配料含氢化油脂 / 添加剂 e471/e472 / 营养标签反式脂肪 > 0
      present:
        hasIng(/hydrogenated|氢化/) ||
        hasRawAdditive(['e471', 'e472']) ||
        Number(prodNutr.find((n: any) => n.nutrient.name === 'Trans Fat')?.value ?? 0) > 0,
      detail: 'Contains hydrogenated oils or trans fat.',
      detailZh: '含氢化油脂或反式脂肪。'
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
      code: 'acidity_regulators', icon: '🍋', name: 'Acidity Regulators', nameZh: '酸度调节剂',
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
      whyText:
        overall !== null
          ? `Scored ${overall}/100 for this child.`
          : 'AI-estimated nutrition data; overall score is not calculated.',
      whyTextZh:
        overall !== null
          ? `针对该孩子综合评分 ${overall}/100。`
          : 'AI 估算营养数据，不计算综合评分。',
      breakdown: {
        create: [
          {
            dimension: 'devScore',
            score: Math.round(devScore * 100),
            weight: isAiGenerated ? null : alpha,
          },
          {
            dimension: 'nutriNorm',
            score:
              nutriNorm !== null
                ? Math.round(nutriNorm * 100)
                : null,
            weight: isAiGenerated ? null : alpha,
          },
          {
            dimension: 'additiveScore',
            score:
              additiveScore !== null
                ? Math.round(additiveScore * 100)
                : null,
            weight: isAiGenerated ? null : 1 - alpha,
          },
        ],
      },
      factors: { create: factors },
      allergenFlags: { create: allergenFlags },
    },
    select: { id: true },
  });

  // Benefit（成长益处）展示规则：Overall Assessment 为 Level 1–3 时不展示、不计算。
  // 与前端 scoreToLevel 保持一致：≥75→5, ≥58→4, ≥44→3, ≥37→2, 其余→1。
  const benefitLevel = overall === null
    ? 0
    : overall >= 75
      ? 5
      : overall >= 58
        ? 4
        : overall >= 44
          ? 3
          : overall >= 37
            ? 2
            : 1;
  const computeBenefits = matchedAllergens.length === 0 && benefitLevel >= 4;

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
        isAiGenerated,

      },
      child: { id: child.id, name: child.name, age: child.age },
      allergenSafe: matchedAllergens.length === 0,
      matchedAllergens,
      goals: computeBenefits ? viewGoals : [],
      nutrients: computeBenefits ? viewNutrients : [],
      flows: computeBenefits ? flows : [],
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