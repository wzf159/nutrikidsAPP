/**
 * additive_score —— 还原 notebook 里 NutriKidsScorer.compute_additive_score 的逻辑。
 *
 * additive_score = 产品命中的有害添加剂数 / harmful_additives_reference.json 里
 * 有害添加剂总数。用于 Nutri-Score C/D/E 等级产品的扣分项。
 *
 * 依赖 harmful_additives_reference.json(gen_harmful_additives_reference.py 生成的,
 * 基于 ANSES/EFSA 官方评估判定 is_harmful 的那份),跟 devScoreV2.ts 用的是
 * 同一个 ./data/ 目录,不用重复拷文件。
 */

import { findHarmfulAdditives, getHarmfulAdditives } from './harmfulAdditives.js';

const harmfulAdditiveCount = getHarmfulAdditives().length;

/**
 * @param additiveTags 产品的 OFF 添加剂标签数组(比如 ["en:e300","en:e306",...],
 *   来自 product.additivesJson 解析后的结果)
 */
export function computeAdditiveScoreV2(additiveTags: string[], debug: string[] = []): number {
  const tagSet = new Set(additiveTags);
  const hits = findHarmfulAdditives([...tagSet]).map((additive) => additive.tag);

  debug.push(`产品 additives_tags 共 ${tagSet.size} 个`);
  debug.push(`有害添加剂参考表(OFF/EFSA high)共 ${harmfulAdditiveCount} 个`);
  debug.push(hits.length > 0 ? `命中的有害添加剂(${hits.length}个): ${JSON.stringify(hits)}` : '命中的有害添加剂: 无');

  if (harmfulAdditiveCount === 0) return 0;

  const score = hits.length / harmfulAdditiveCount;
  debug.push(`additive_score = ${hits.length} / ${harmfulAdditiveCount} = ${score.toFixed(4)}`);
  return score;
}
