// Spec 119 (V2-SEC-04) FR-03 : résumé Scorecard (score global, par vérification, écart avec la publication précédente).

const formatScore = (score) => (typeof score === 'number' && score >= 0 ? String(score).replace('.', ',') : 'n/a');

const formatDelta = (current, previous) => {
  if (typeof current !== 'number' || typeof previous !== 'number' || current < 0 || previous < 0) return '—';
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return '=';
  return `${delta > 0 ? '+' : ''}${String(delta).replace('.', ',')}`;
};

/** @typedef {{ date?: string, score?: number, checks?: Array<{ name: string, score: number }> }} ScorecardResult */

/**
 * @param {ScorecardResult} current
 * @param {ScorecardResult | null} [previous]
 * @returns {string}
 */
export function formatScorecardSummary(current, previous = null) {
  if (typeof current?.score !== 'number' || !Array.isArray(current.checks)) {
    throw new Error('Résultat Scorecard invalide : score ou vérifications absents.');
  }
  const previousChecks = new Map((previous?.checks ?? []).map((check) => [check.name, check.score]));
  const reference = previous?.date ? `publication du ${previous.date}` : 'aucune publication précédente';
  const lines = [
    '## OpenSSF Scorecard',
    '',
    `Score global : **${formatScore(current.score)} / 10** (écart : ${formatDelta(current.score, previous?.score)}, référence : ${reference}).`,
    '',
    '| Vérification | Score | Écart |',
    '|---|---|---|',
    ...[...current.checks]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((check) => `| ${check.name} | ${formatScore(check.score)} | ${formatDelta(check.score, previousChecks.get(check.name))} |`),
    '',
    'Scorecard est informatif : il ne bloque aucune PR (spec 119). Plan d\'amélioration : `docs/security/scorecard-plan.md`.',
  ];
  return `${lines.join('\n')}\n`;
}
