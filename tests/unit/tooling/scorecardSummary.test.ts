import { describe, expect, it } from 'vitest';

import { formatScorecardSummary } from '../../../scripts/lib/scorecardSummary.mjs';

// Spec ref: specs/119-counter-sec-openssf-scorecard (FR-03 résumé avec écart)
describe('Scorecard summary', () => {
  it('shows the global score, each check and the gap with the previous publication', () => {
    const summary = formatScorecardSummary(
      { date: '2026-11-30', score: 6.4, checks: [{ name: 'Token-Permissions', score: 10 }, { name: 'Fuzzing', score: 0 }, { name: 'Packaging', score: -1 }] },
      { date: '2026-11-23', score: 5.9, checks: [{ name: 'Token-Permissions', score: 0 }, { name: 'Fuzzing', score: 0 }] },
    );

    expect(summary).toContain('Score global : **6,4 / 10** (écart : +0,5, référence : publication du 2026-11-23)');
    expect(summary).toContain('| Token-Permissions | 10 | +10 |');
    expect(summary).toContain('| Fuzzing | 0 | = |');
    expect(summary).toContain('| Packaging | n/a | — |');
  });

  it('works without a previous publication and rejects an invalid result', () => {
    expect(formatScorecardSummary({ score: 4, checks: [] })).toContain('aucune publication précédente');
    expect(() => formatScorecardSummary({ checks: [] })).toThrow(/invalide/);
  });
});
