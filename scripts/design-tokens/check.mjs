#!/usr/bin/env node
// Spec 063 FR-07 / 065 FR-03 : cliquet des classes de palette brutes. Le nombre ne peut que baisser ;
// la référence est enregistrée dans scripts/design-tokens/baseline.json (0 à la fin de la migration).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRawPalette } from './palette.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SOURCES = ['App.tsx', 'views', 'components', 'src', 'utils'];

const collect = (path) => {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((entry) => collect(join(path, entry)));
  }
  return /\.(ts|tsx)$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
};

export const scanRawPalette = (root = ROOT) => {
  const perFile = [];
  for (const source of SOURCES) {
    for (const file of collect(join(root, source))) {
      const found = findRawPalette(readFileSync(file, 'utf8'));
      if (found.length) perFile.push({ file: relative(root, file), found });
    }
  }
  return perFile;
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const baseline = JSON.parse(readFileSync(join(ROOT, 'scripts/design-tokens/baseline.json'), 'utf8')).rawPaletteClasses;
  const perFile = scanRawPalette();
  const total = perFile.reduce((sum, entry) => sum + entry.found.length, 0);
  if (total > baseline) {
    for (const { file, found } of perFile) console.error(`  ${file}: ${found.length} (${[...new Set(found)].slice(0, 6).join(' ')})`);
    console.error(`design-tokens: ${total} classes de palette brute (référence ${baseline}, +${total - baseline}). Utiliser les rôles de src/styles/tokens (docs/design-system.md).`);
    process.exit(1);
  }
  console.log(`design-tokens: OK (${total}/${baseline} classes de palette brute)`);
}
