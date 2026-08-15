import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(serverRoot, 'src', 'scoring', 'data');
const destination = resolve(serverRoot, 'dist', 'scoring', 'data');

if (!existsSync(source)) {
  throw new Error(`Static scoring data directory not found: ${source}`);
}

mkdirSync(dirname(destination), { recursive: true });
mkdirSync(destination, { recursive: true });

for (const entry of readdirSync(source, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.json')) {
    copyFileSync(resolve(source, entry.name), resolve(destination, entry.name));
  }
}

console.log(`Copied scoring data to ${destination}`);
