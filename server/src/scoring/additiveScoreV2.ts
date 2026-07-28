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

// 启动时读一次,常驻内存
const harmfulAdditiveTags = new Set(readJson<string[]>('harmful_additives_reference.json'));

/**
 * @param additiveTags 产品的 OFF 添加剂标签数组(比如 ["en:e300","en:e306",...],
 *   来自 product.additivesJson 解析后的结果)
 */
export function computeAdditiveScoreV2(additiveTags: string[], debug: string[] = []): number {
  const tagSet = new Set(additiveTags);
  const hits = [...tagSet].filter((t) => harmfulAdditiveTags.has(t));

  debug.push(`产品 additives_tags 共 ${tagSet.size} 个`);
  debug.push(`有害添加剂参考表(ANSES/EFSA)共 ${harmfulAdditiveTags.size} 个`);
  debug.push(hits.length > 0 ? `命中的有害添加剂(${hits.length}个): ${JSON.stringify(hits)}` : '命中的有害添加剂: 无');

  if (harmfulAdditiveTags.size === 0) return 0;

  const score = hits.length / harmfulAdditiveTags.size;
  debug.push(`additive_score = ${hits.length} / ${harmfulAdditiveTags.size} = ${score.toFixed(4)}`);
  return score;
}
