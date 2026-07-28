/**
 * DevScore —— 全部 categories_tags 中位数版本。
 *
 * 算法与原始 notebook / Python 实现保持一致：
 *
 * 1. 遍历产品全部 categories_tags；
 * 2. 对当前 nutrient_tag 收集每个分类中可用的 p10 / p90；
 * 3. L_j = median(all p10)；
 * 4. U_j = median(all p90)；
 * 5. s_j = clip((x_j - L_j) / (U_j - L_j), 0, 1)；
 * 6. 每个发育目标 GoalScore = min(1, sum(s_j))；
 * 7. DevScore = sum(GoalScore_i * weight_i) / sum(weight_i)。
 *
 * 不使用：
 * - 分类树
 * - 父级回溯
 * - most specific category
 * - categories_parents.json
 * - 评分阶段 MIN_N 过滤
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

interface CategoryStat {
  n: number;
  p10: number | null;
  p90: number | null;
}

interface NutrientGoalRow {
  age_group: string;
  gender: string;
  development_goal: string;
  my_nutrient: string;
  status: string;
  nutrient_tag: string | null;
  weight: number;
}

interface BoundsLookupResult {
  L: number;
  U: number;
  matchedCategories: {
    category: string;
    p10: number;
    p90: number;
  }[];
}

interface SingleGoalResult {
  goalScore: number;
  weight: number;
}

const categoryNutritionStats = readJson<
  Record<string, Record<string, CategoryStat>>
>('category_nutrition_stats.json');

const nutrientGoalMapping = readJson<NutrientGoalRow[]>(
  'nutrient_goal_mapping.json'
);

const ageGenderWeightSummary = readJson<Record<string, number>>(
  'age_gender_weight_summary.json'
);

export const GOAL_ID_TO_DEVELOPMENT_GOAL: Record<number, string> = {
  1: 'Brain Development',
  2: 'Bone Development',
  3: 'Heart Growth',
  4: 'Muscle Development',
  5: 'Immune Development',
  6: 'Gut Development',
  7: 'Vision Development',
  8: 'Dental Development',
};

export const AGE_GROUP_STRINGS = [
  '0-6 months',
  '7-12 months',
  '1-3 years',
  '4-8 years',
  '9-13 years',
  '14-18 years',
] as const;

export interface DevScoreInput {
  categoriesTags: string[];
  /** OFF nutrient_tag -> 每 100g 原始值 */
  nutrientValuesByTag: Record<string, number>;
  ageIdx: number;
  genderKey: 'male' | 'female';
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

/**
 * 遍历全部 categoriesTags，收集当前营养素所有可用 p10 / p90，
 * 分别取中位数。
 */
function lookupMedianBounds(
  categoriesTags: string[],
  nutrientTag: string
): BoundsLookupResult | null {
  const p10Values: number[] = [];
  const p90Values: number[] = [];
  const matchedCategories: BoundsLookupResult['matchedCategories'] = [];

  for (const category of categoriesTags) {
    const stat = categoryNutritionStats[category]?.[nutrientTag];
    if (!stat) continue;

    const p10 = stat.p10;
    const p90 = stat.p90;

    if (
      p10 === null ||
      p90 === null ||
      !Number.isFinite(p10) ||
      !Number.isFinite(p90)
    ) {
      continue;
    }

    p10Values.push(p10);
    p90Values.push(p90);
    matchedCategories.push({ category, p10, p90 });
  }

  const L = median(p10Values);
  const U = median(p90Values);

  if (L === null || U === null) return null;

  return {
    L,
    U,
    matchedCategories,
  };
}

function computeSingleGoalScore(
  goalLabel: string,
  categoriesTags: string[],
  nutrientValuesByTag: Record<string, number>,
  ageGroupStr: string,
  genderStr: string,
  debug: string[]
): SingleGoalResult | null {
  const rows = nutrientGoalMapping.filter(
    (row) =>
      row.age_group === ageGroupStr &&
      row.gender === genderStr &&
      row.development_goal === goalLabel
  );

  if (rows.length === 0) return null;

  const weight = Number(rows[0].weight);
  if (!Number.isFinite(weight) || weight <= 0) return null;

  const nutrientScores: number[] = [];

  debug.push(`[${goalLabel}] weight=${weight}`);

  for (const row of rows) {
    if (row.status !== 'found' || !row.nutrient_tag) {
      continue;
    }

    const nutrientTag = row.nutrient_tag;
    const x = nutrientValuesByTag[nutrientTag];

    if (x === undefined || !Number.isFinite(x)) {
      debug.push(
        `  - ${row.my_nutrient} (${nutrientTag}): 产品没有有效值，跳过`
      );
      continue;
    }

    const bounds = lookupMedianBounds(categoriesTags, nutrientTag);

    if (!bounds) {
      debug.push(
        `  - ${row.my_nutrient} (${nutrientTag}): 全部分类均无可用 p10/p90，跳过`
      );
      continue;
    }

    const { L, U, matchedCategories } = bounds;

    debug.push(`  - ${row.my_nutrient} (${nutrientTag}): x=${x}`);
    debug.push(
      `    遍历产品全部 categories_tags，共 ${categoriesTags.length} 个`
    );

    for (const matched of matchedCategories) {
      debug.push(
        `    - 命中 category=${matched.category}: p10=${matched.p10}, p90=${matched.p90}`
      );
    }

    debug.push(`    共命中 ${matchedCategories.length} 个分类`);
    debug.push(`    p10 中位数 -> L=${L}`);
    debug.push(`    p90 中位数 -> U=${U}`);

    let nutrientScore: number;

    if (U === L) {
      nutrientScore = x >= L ? 1 : 0;
    } else {
      nutrientScore = clamp01((x - L) / (U - L));
    }

    nutrientScores.push(nutrientScore);

    debug.push(`    -> sj=${nutrientScore.toFixed(3)}`);
  }

  const goalScore =
    nutrientScores.length > 0
      ? Math.min(
          1,
          nutrientScores.reduce((sum, score) => sum + score, 0)
        )
      : 0;

  debug.push(
    `  => GoalScore=min(1,sum(sj))=${goalScore.toFixed(3)}`
  );
  debug.push(
    `  => WeightedGoalScore=${(goalScore * weight).toFixed(3)}`
  );

  return {
    goalScore,
    weight,
  };
}

function resolveAgeGroup(ageIdx: number): string | null {
  return AGE_GROUP_STRINGS[ageIdx] ?? null;
}

export function computeDevScore(
  input: DevScoreInput,
  debug: string[] = []
): number {
  const {
    categoriesTags,
    nutrientValuesByTag,
    ageIdx,
    genderKey,
  } = input;

  const ageGroupStr = resolveAgeGroup(ageIdx);
  if (!ageGroupStr) {
    debug.push(`无效 ageIdx=${ageIdx}，DevScore=0`);
    return 0;
  }

  const genderStr = genderKey === 'female' ? 'Female' : 'Male';

  debug.push(
    `DevScore: age_group=${ageGroupStr}, gender=${genderStr}`
  );
  debug.push(
    `categories_tags (${categoriesTags.length}): ${JSON.stringify(categoriesTags)}`
  );

  let weightedSum = 0;

  for (const goalId of Object.keys(
    GOAL_ID_TO_DEVELOPMENT_GOAL
  ).map(Number)) {
    const goalLabel = GOAL_ID_TO_DEVELOPMENT_GOAL[goalId];

    const result = computeSingleGoalScore(
      goalLabel,
      categoriesTags,
      nutrientValuesByTag,
      ageGroupStr,
      genderStr,
      debug
    );

    if (!result) continue;

    weightedSum += result.goalScore * result.weight;
  }

  const sumWeights =
    ageGenderWeightSummary[`${ageGroupStr}|${genderStr}`];

  debug.push(
    `sum(WeightedGoalScore)=${weightedSum.toFixed(3)}`
  );
  debug.push(`sum(w)=${sumWeights}`);

  if (!Number.isFinite(sumWeights) || sumWeights <= 0) {
    debug.push('sum(w) 无效，DevScore=0');
    return 0;
  }

  const devScore = weightedSum / sumWeights;

  debug.push(
    `DevScore=${weightedSum.toFixed(3)}/${sumWeights}=${devScore.toFixed(4)}`
  );

  return devScore;
}

export function computeGoalScores(
  input: DevScoreInput,
  debug: string[] = []
): Record<number, number> {
  const {
    categoriesTags,
    nutrientValuesByTag,
    ageIdx,
    genderKey,
  } = input;

  const ageGroupStr = resolveAgeGroup(ageIdx);
  if (!ageGroupStr) return {};

  const genderStr = genderKey === 'female' ? 'Female' : 'Male';
  const scores: Record<number, number> = {};

  for (const goalId of Object.keys(
    GOAL_ID_TO_DEVELOPMENT_GOAL
  ).map(Number)) {
    const goalLabel = GOAL_ID_TO_DEVELOPMENT_GOAL[goalId];

    const result = computeSingleGoalScore(
      goalLabel,
      categoriesTags,
      nutrientValuesByTag,
      ageGroupStr,
      genderStr,
      debug
    );

    if (!result) continue;

    scores[goalId] = result.goalScore;
  }

  return scores;
}

/**
 * 兼容现有 scoring.ts。
 * 等你以后愿意统一命名时，可以把调用改成 computeDevScore / computeGoalScores，
 * 再删除这两个别名。
 */
export const computeDevScoreV2 = computeDevScore;
export const computeGoalScoresV2 = computeGoalScores;