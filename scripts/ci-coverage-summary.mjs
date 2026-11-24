// Spec 043 (V2-QA-10) FR-04 : résumé de couverture dont les planchers sont lus dans vitest.config.ts.
import { appendFileSync, readFileSync } from 'node:fs';

import { formatCoverageSummary, readCoverageThresholdsFromSource } from './lib/ciSummaries.mjs';

const summaryPath = process.argv[2] ?? 'coverage/coverage-summary.json';
const vitestConfigSource = readFileSync(new URL('../vitest.config.ts', import.meta.url), 'utf8');
const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'));
const markdown = formatCoverageSummary(total, readCoverageThresholdsFromSource(vitestConfigSource));

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}
process.stdout.write(markdown);
