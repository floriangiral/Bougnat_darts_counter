// Spec 117 (V2-SEC-02) FR-05 : contrôle des exceptions datées d'osv-scanner.toml (≤ 90 jours, non expirées).
import { existsSync, readFileSync } from 'node:fs';

import { parseOsvExceptions, validateOsvExceptions } from './lib/osvPolicy.mjs';

const configPath = process.argv[2] ?? 'osv-scanner.toml';
if (!existsSync(configPath)) {
  console.error(`Fichier ${configPath} introuvable.`);
  process.exit(1);
}

const entries = parseOsvExceptions(readFileSync(configPath, 'utf8'));
const errors = validateOsvExceptions(entries);

if (errors.length > 0) {
  for (const error of errors) console.error(`::error file=${configPath}::${error}`);
  process.exit(1);
}
console.log(`${entries.length} exception(s) OSV-Scanner conforme(s) dans ${configPath}.`);
