// Spec 043 (V2-QA-10) : résumés CI calculés à partir des sources (aucune valeur en dur).

/** @typedef {{ statements: number, branches: number, functions: number, lines: number }} CoverageThresholds */
/** @typedef {{ file: string, line: number, title: string, project: string }} FlakyTest */

/** @type {ReadonlyArray<[keyof CoverageThresholds, string]>} */
const COVERAGE_METRICS = [
  ['statements', 'Instructions'],
  ['branches', 'Branches'],
  ['functions', 'Fonctions'],
  ['lines', 'Lignes'],
];

/**
 * @param {any} vitestConfig
 * @returns {CoverageThresholds}
 */
export const readCoverageThresholds = (vitestConfig) => {
  const thresholds = vitestConfig?.test?.coverage?.thresholds;
  if (!thresholds || typeof thresholds !== 'object') {
    throw new Error('Seuils de couverture introuvables dans vitest.config.ts (test.coverage.thresholds).');
  }
  for (const [metric] of COVERAGE_METRICS) {
    if (typeof thresholds[metric] !== 'number') {
      throw new Error(`Seuil de couverture « ${metric} » manquant dans vitest.config.ts.`);
    }
  }
  return thresholds;
};

/**
 * @param {any} total coverage-summary.json `total` entry
 * @param {CoverageThresholds} thresholds
 * @returns {string}
 */
export const formatCoverageSummary = (total, thresholds) => {
  const lines = [
    '## Global Quality Baseline',
    '',
    '- Périmètre : toute l’application, PR vers `main`',
    '- Planchers lus dans `vitest.config.ts`',
    '',
    '| Mesure | Couverture | Plancher | État |',
    '| --- | ---: | ---: | --- |',
  ];
  for (const [metric, label] of COVERAGE_METRICS) {
    const pct = total?.[metric]?.pct;
    if (typeof pct !== 'number') {
      throw new Error(`Mesure « ${metric} » absente de coverage/coverage-summary.json.`);
    }
    const floor = thresholds[metric];
    const shown = String(pct).replace('.', ',');
    lines.push(`| ${label} | **${shown} %** | ${floor} % | ${pct >= floor ? 'conforme' : 'sous le plancher'} |`);
  }
  return `${lines.join('\n')}\n`;
};

const walkSuites = (suites, visit) => {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        visit(spec, test);
      }
    }
    walkSuites(suite.suites, visit);
  }
};

/**
 * @param {any} report Playwright JSON report
 * @returns {FlakyTest[]}
 */
export const collectFlakyTests = (report) => {
  /** @type {FlakyTest[]} */
  const flaky = [];
  walkSuites(report?.suites, (spec, test) => {
    if (test.status === 'flaky') {
      flaky.push({
        file: spec.file,
        line: spec.line,
        title: spec.title,
        project: test.projectName ?? '',
      });
    }
  });
  return flaky;
};

/**
 * @param {FlakyTest[]} flaky
 * @returns {string}
 */
export const formatFlakySummary = (flaky) => {
  const lines = ['## Tests instables (flaky)', ''];
  if (flaky.length === 0) {
    lines.push('Aucun test réussi seulement au second essai.');
  } else {
    lines.push(`${flaky.length} test(s) réussi(s) seulement au second essai (signalement non bloquant) :`, '');
    for (const test of flaky) {
      lines.push(`- \`${test.file}:${test.line}\` › ${test.title}${test.project ? ` [${test.project}]` : ''}`);
    }
  }
  return `${lines.join('\n')}\n`;
};

/**
 * @param {FlakyTest[]} flaky
 * @param {string} [fileRoot]
 * @returns {string[]}
 */
export const formatFlakyAnnotations = (flaky, fileRoot = '') =>
  flaky.map((test) => {
    const file = fileRoot ? `${fileRoot.replace(/\/$/, '')}/${test.file}` : test.file;
    const project = test.project ? ` [${test.project}]` : '';
    return `::warning file=${file},line=${test.line},title=Test instable::${test.title}${project} a réussi au second essai.`;
  });
