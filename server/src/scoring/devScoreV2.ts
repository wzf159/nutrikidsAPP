/**
 * DevScore v2 —— 分类层级爬树版本。
 *
 * 跟旧版(硬编码 DRI_TABLE,单营养素得分 = min(1, actual/DRI每日推荐量))的区别:
 * 单营养素得分改成"这个产品的营养素含量,落在同类产品 P10~P90 区间的哪个位置"
 * (clip((x-L)/(U-L), 0, 1)),L/U 是从 category_nutrition_stats.json 里,按产品的
 * OFF 分类层级(爬树找最具体、样本量又达标的分类)查出来的。
 *
 * 目标/权重结构(每个发育目标下的营养素加权求和、按 tier 权重合计)保持不变,
 * 只是数据来源从硬编码表换成 nutrient_goal_mapping.json + age_gender_weight_summary.json。
 *
 * 依赖的5个参考数据文件:
 *   - category_nutrition_stats.json
 *   - nutrient_goal_mapping.json
 *   - age_gender_weight_summary.json
 *   - categories_parents.json
 */


import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CategoryTaxonomy } from './categoryTaxonomy.js';

// ESM 里没有 __dirname,用 import.meta.url 换算出等价的目录路径
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

// 启动时读一次,常驻内存,不要在请求处理函数里读盘
const categoryNutritionStats = readJson<Record<string, Record<string, CategoryStat>>>(
  'category_nutrition_stats.json'
);
const nutrientGoalMapping = readJson<NutrientGoalRow[]>('nutrient_goal_mapping.json');
const ageGenderWeightSummary = readJson<Record<string, number>>('age_gender_weight_summary.json');
const categoriesParents = readJson<Record<string, string[]>>('categories_parents.json');

const taxonomy = new CategoryTaxonomy(categoriesParents);

// 跟 Python 版 gen_category_nutrition_stats.py 里的 MIN_N 保持一致,这里只是双重保险
const MIN_N = 30;

function statsIfReliable(category: string, nutrientTag: string): CategoryStat | null {
  const stat = categoryNutritionStats[category]?.[nutrientTag];
  if (!stat) return null;
  if (stat.p10 === null || stat.p90 === null || stat.n < MIN_N) return null;
  return stat;
}

function lookupMostSpecificBounds(
  categoriesTags: string[],
  nutrientTag: string
): { L: number; U: number } | null {
  const leaves = taxonomy.mostSpecificTags(categoriesTags);
  const found: { n: number; p10: number; p90: number }[] = [];

  for (const leaf of leaves) {
    const matchedCat = taxonomy.nearestAncestorWithData(leaf, (c) => statsIfReliable(c, nutrientTag) !== null);
    if (matchedCat === null) continue;
    const stat = statsIfReliable(matchedCat, nutrientTag)!;
    found.push({ n: stat.n, p10: stat.p10 as number, p90: stat.p90 as number });
  }

  if (found.length === 0) return null;

  // 多个分支都找到时,取 n 最小(=最具体)的那个
  const best = found.reduce((a, b) => (b.n < a.n ? b : a));
  return { L: best.p10, U: best.p90 };
}

/**
 * 发育目标数字 id -> nutrient_goal_mapping.json 里 development_goal 字符串。
 * 注意: DevelopmentGoal 表里 id=3 的 label 是 'Heart Development'、id=7 是
 * 'Visual Development',但 nutrient_goal_mapping.json 里这两个分别叫
 * 'Heart Growth'、'Vision Development' —— 字符串不完全一样,所以这里显式写死
 * 这份映射,不能直接拿数据库里的 goal.label 去查 nutrient_goal_mapping.json。
 */
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

/** ageIdx(0~5,跟 scoreFood.ts 里 stageIdx() 返回值一致) -> age_group 字符串 */
export const AGE_GROUP_STRINGS = [
  '0-6 months',
  '7-12 months',
  '1-3 years',
  '4-8 years',
  '9-13 years',
  '14-18 years',
];

export interface DevScoreInput {
  categoriesTags: string[];
  /** nutrient_tag(OFF风格,比如 'vitamin-b9') -> 每100g原始值 */
  nutrientValuesByTag: Record<string, number>;
  ageIdx: number;
  genderKey: 'male' | 'female';
}

export function computeDevScoreV2(input: DevScoreInput, debug: string[] = []): number {
  const { categoriesTags, nutrientValuesByTag, ageIdx, genderKey } = input;
  const ageGroupStr = AGE_GROUP_STRINGS[ageIdx];
  const genderStr = genderKey === 'female' ? 'Female' : 'Male';

  debug.push(
    `DevScore v2: age_group=${ageGroupStr}, gender=${genderStr}, categories=${JSON.stringify(categoriesTags)}`
  );

  let weightedSum = 0;

  for (const goalIdStr of Object.keys(GOAL_ID_TO_DEVELOPMENT_GOAL)) {
    const goalId = Number(goalIdStr);
    const goalLabel = GOAL_ID_TO_DEVELOPMENT_GOAL[goalId];

    const rows = nutrientGoalMapping.filter(
      (r) => r.age_group === ageGroupStr && r.gender === genderStr && r.development_goal === goalLabel
    );
    if (rows.length === 0) continue;

    const weight = rows[0].weight;
    if (!weight) continue;

    const sList: number[] = [];
    for (const row of rows) {
      if (row.status !== 'found' || !row.nutrient_tag) continue; // 比如 Prebiotics 没有 OFF 数据,跳过

      const xj = nutrientValuesByTag[row.nutrient_tag];
      if (xj === undefined) continue; // 产品没测这个营养素

      const bounds = lookupMostSpecificBounds(categoriesTags, row.nutrient_tag);
      if (bounds === null) continue; // 爬遍分类树也查不到可靠区间

      const { L, U } = bounds;
      let sj: number;
      if (U === L) {
        sj = xj >= L ? 1 : 0;
      } else {
        sj = Math.min(1, Math.max(0, (xj - L) / (U - L)));
      }
      sList.push(sj);
      debug.push(`    ${row.nutrient_tag}: x=${xj} L(p10)=${L} U(p90)=${U} -> sj=${sj.toFixed(3)}`);
    }

    const goalScore = sList.length > 0 ? Math.min(1, sList.reduce((a, b) => a + b, 0)) : 0;
    weightedSum += goalScore * weight;
    debug.push(`  [${goalLabel}] weight=${weight} nutrients_scored=${sList.length}/${rows.length} goalScore=${goalScore.toFixed(3)}`);
  }

  const sumW = ageGenderWeightSummary[`${ageGroupStr}|${genderStr}`];
  debug.push(`sum(weightedGoalScore)=${weightedSum.toFixed(3)}, sum(w)=${sumW}`);

  if (!sumW) {
    debug.push('sum(w) 是 0 或找不到,DevScore 记为 0');
    return 0;
  }

  const devScore = weightedSum / sumW;
  debug.push(`DevScore v2 = ${devScore.toFixed(4)}`);
  return devScore;
}