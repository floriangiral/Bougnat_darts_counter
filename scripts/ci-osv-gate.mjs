// Spec 117 (V2-SEC-02) FR-03, Q3 : seules les nouvelles vulnérabilités de sévérité haute ou critique bloquent la PR.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

import { evaluateOsvGate, formatOsvGateSummary } from './lib/osvPolicy.mjs';

// Usage : ci-osv-gate.mjs <ancien.json> <nouveau.json> (PR) ou ci-osv-gate.mjs --full <rapport.json> (scan complet).
const args = process.argv.slice(2);
const full = args[0] === '--full';
const [oldPath, newPath] = full ? [null, args[1] ?? 'osv-results.json'] : [args[0] ?? 'old-results.json', args[1] ?? 'new-results.json'];
if (!existsSync(newPath)) {
  console.error(`Rapport OSV-Scanner ${newPath} introuvable : le scan n'a pas abouti.`);
  process.exit(1);
}

const readReport = (path) => (path && existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { results: [] });
const outcome = evaluateOsvGate(readReport(oldPath), readReport(newPath));
const markdown = formatOsvGateSummary(outcome, { scope: full ? 'branch' : 'pr' });

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
process.stdout.write(markdown);
process.exit(outcome.blocking.length > 0 ? 1 : 0);
