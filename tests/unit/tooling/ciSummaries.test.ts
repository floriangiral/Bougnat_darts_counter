import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';

import {
  collectFlakyTests,
  formatCoverageSummary,
  formatFlakyAnnotations,
  formatFlakySummary,
  readCoverageThresholds,
  readCoverageThresholdsFromSource,
} from '../../../scripts/lib/ciSummaries.mjs';
import vitestConfig from '../../../vitest.config.ts';

// Spec ref: specs/043-counter-qa-ci-hardening (FR-04 coverage floors read at the source, FR-07 flaky report)
const total = {
  statements: { pct: 97.05 },
  branches: { pct: 79.5 },
  functions: { pct: 99 },
  lines: { pct: 97.75 },
};

describe('coverage summary', () => {
  it('displays the floors declared in vitest.config.ts', () => {
    const configSource = readFileSync(new URL('../../../vitest.config.ts', import.meta.url), 'utf8');
    const thresholds = readCoverageThresholdsFromSource(configSource);
    const summary = formatCoverageSummary(total, thresholds);

    for (const metric of ['statements', 'branches', 'functions', 'lines'] as const) {
      expect(summary).toContain(`| ${thresholds[metric]} % |`);
    }
    expect(thresholds).toEqual(readCoverageThresholds(vitestConfig));
  });

  it('follows a changed threshold and flags measures below their floor', () => {
    const summary = formatCoverageSummary(total, { statements: 95, branches: 80, functions: 90, lines: 99 });

    expect(summary).toContain('| Instructions | **97,05 %** | 95 % | conforme |');
    expect(summary).toContain('| Branches | **79,5 %** | 80 % | sous le plancher |');
    expect(summary).toContain('| Lignes | **97,75 %** | 99 % | sous le plancher |');
  });

  it('rejects a configuration without thresholds or a report without a measure', () => {
    expect(() => readCoverageThresholds({ test: { coverage: {} } })).toThrow(/introuvables/);
    expect(() => readCoverageThresholds({ test: { coverage: { thresholds: { statements: 90 } } } })).toThrow(
      /branches/,
    );
    expect(() => readCoverageThresholdsFromSource('export default {};')).toThrow(/introuvables/);
    expect(() => readCoverageThresholdsFromSource('thresholds: { statements: 90 }')).toThrow(/branches/);
    expect(() =>
      formatCoverageSummary({ statements: { pct: 90 } }, { statements: 90, branches: 80, functions: 90, lines: 90 }),
    ).toThrow(/branches/);
  });
});

describe('flaky tests report', () => {
  const report = {
    suites: [
      {
        specs: [
          {
            file: 'home.smoke.spec.ts',
            line: 12,
            title: 'ouvre le jeu',
            tests: [
              { projectName: 'chromium', status: 'flaky' },
              { projectName: 'tablet-ipad-portrait', status: 'expected' },
            ],
          },
        ],
        suites: [
          {
            specs: [{ file: 'x01.smoke.spec.ts', line: 40, title: 'termine une manche', tests: [{ status: 'flaky' }] }],
          },
        ],
      },
    ],
  };

  it('lists only the tests that passed on retry, nested suites included', () => {
    expect(collectFlakyTests(report)).toEqual([
      { file: 'home.smoke.spec.ts', line: 12, title: 'ouvre le jeu', project: 'chromium' },
      { file: 'x01.smoke.spec.ts', line: 40, title: 'termine une manche', project: '' },
    ]);
  });

  it('formats a non-blocking summary and warning annotations', () => {
    const flaky = collectFlakyTests(report);

    expect(formatFlakySummary(flaky)).toContain('2 test(s) réussi(s) seulement au second essai');
    expect(formatFlakySummary(flaky)).toContain('- `home.smoke.spec.ts:12` › ouvre le jeu [chromium]');
    expect(formatFlakyAnnotations(flaky, 'tests/e2e/')[0]).toBe(
      '::warning file=tests/e2e/home.smoke.spec.ts,line=12,title=Test instable::ouvre le jeu [chromium] a réussi au second essai.',
    );
    expect(formatFlakyAnnotations(flaky)[1]).toContain('file=x01.smoke.spec.ts,line=40');
  });

  it('reports a clean run', () => {
    expect(collectFlakyTests({})).toEqual([]);
    expect(formatFlakySummary([])).toContain('Aucun test réussi seulement au second essai.');
  });
});
