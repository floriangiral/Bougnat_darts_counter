#!/usr/bin/env node
// Spec 065 : conversion outillée des classes de palette brutes (cas non ambigus) vers les rôles.
// Usage : node scripts/design-tokens/migrate.mjs <fichier|dossier>… [--dry-run]
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrateText } from './palette.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targets = args.filter((arg) => arg !== '--dry-run');

const collect = (path) => {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((entry) => collect(join(path, entry)));
  }
  return /\.(ts|tsx)$/.test(path) ? [path] : [];
};

let changed = 0;
for (const file of targets.flatMap(collect)) {
  const source = readFileSync(file, 'utf8');
  const { output, unmapped } = migrateText(source);
  if (output !== source) {
    changed += 1;
    if (!dryRun) writeFileSync(file, output);
  }
  if (unmapped.length) {
    console.log(`${file}: ${unmapped.length} à migrer à la main → ${[...new Set(unmapped)].join(' ')}`);
  }
}
console.log(`${changed} fichier(s) ${dryRun ? 'à modifier' : 'modifié(s)'}.`);
