import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface HarmfulAdditive {
  tag: string;
  code: string;
  name: string;
  nameZh: string | null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const harmfulAdditives = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'data', 'harmful_additives_reference.json'),
    'utf-8',
  ),
) as HarmfulAdditive[];

const harmfulAdditiveByTag = new Map(
  harmfulAdditives.map((additive) => [additive.tag.toLowerCase(), additive]),
);

export function getHarmfulAdditives(): readonly HarmfulAdditive[] {
  return harmfulAdditives;
}

export function findHarmfulAdditives(tags: readonly string[]): HarmfulAdditive[] {
  const uniqueTags = new Set(
    tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim().toLowerCase()),
  );

  return [...uniqueTags]
    .map((tag) => harmfulAdditiveByTag.get(tag))
    .filter((additive): additive is HarmfulAdditive => additive !== undefined);
}
