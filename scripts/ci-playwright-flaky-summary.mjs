// Spec 043 (V2-QA-10) FR-07 : signale les tests Playwright réussis au second essai, sans bloquer.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { collectFlakyTests, formatFlakyAnnotations, formatFlakySummary } from './lib/ciSummaries.mjs';

const reportPath = process.argv[2] ?? 'test-results/playwright-results.json';

const publish = (markdown) => {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }
  process.stdout.write(markdown);
};

if (!existsSync(reportPath)) {
  publish(`## Tests instables (flaky)\n\nRapport JSON Playwright absent (\`${reportPath}\`) : les tests n’ont pas été exécutés.\n`);
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const flaky = collectFlakyTests(report);
const rootDir = report.config?.rootDir ? path.relative(process.cwd(), report.config.rootDir) : '';

for (const annotation of formatFlakyAnnotations(flaky, rootDir)) {
  console.log(annotation);
}
publish(formatFlakySummary(flaky));
