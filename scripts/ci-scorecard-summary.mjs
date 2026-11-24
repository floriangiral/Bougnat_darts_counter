// Spec 119 (V2-SEC-04) FR-03 : usage ci-scorecard-summary.mjs <actuel.json> [précédent.json].
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

import { formatScorecardSummary } from './lib/scorecardSummary.mjs';

const [currentPath = 'scorecard-current.json', previousPath] = process.argv.slice(2);
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const markdown = formatScorecardSummary(read(currentPath), previousPath && existsSync(previousPath) ? read(previousPath) : null);

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
process.stdout.write(markdown);
