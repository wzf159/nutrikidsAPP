/**
 * 添加剂分类查询——加载 additive_categories.json(gen_additive_categories.py 生成的,
 * 跟 devScoreV2.ts/additiveScoreV2.ts 用的是同一个 ./data/ 目录),
 * 给"这个添加剂是不是抗氧化剂/酸度调节剂/增稠剂/增味剂/甜味剂"这类判断用。
 *
 * 分类规则(E编号区间)跟前端 additives.ts 里 ADDITIVE_DICT 生成时用的是同一套,
 * 两边不会脱节。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const additiveCategories: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'additive_categories.json'), 'utf-8')
);

/** @param tag 完整的OFF添加剂tag,比如 "en:e300" */
export function getAdditiveCategory(tag: string): string | undefined {
  return additiveCategories[tag.toLowerCase()];
}

/** rawAdditives(产品的完整添加剂tag数组) 里,是不是至少有一个属于指定分类 */
export function hasAdditiveCategory(rawAdditives: string[], category: string): boolean {
  return rawAdditives.some((tag) => getAdditiveCategory(tag) === category);
}
