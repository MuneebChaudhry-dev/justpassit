// After tsc emits dist/esm and dist/cjs, drop a minimal package.json into each so
// Node treats the folder's .js files as ESM / CJS respectively. This lets `shared`
// serve real ESM to Vite and CJS to the NestJS build from one source.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  { dir: resolve(root, 'dist/esm'), type: 'module' },
  { dir: resolve(root, 'dist/cjs'), type: 'commonjs' },
];

for (const { dir, type } of targets) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'package.json'), JSON.stringify({ type }, null, 2) + '\n');
}

console.log('Wrote dist/esm and dist/cjs package.json type markers');
