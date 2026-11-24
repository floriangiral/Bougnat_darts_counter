// Spec 117 (V2-SEC-02) : politique OSV-Scanner — exceptions datées (FR-05, RM-01) et seuil bloquant ≥ haute (Q3).

/** @typedef {{ id?: string, effectiveUntil?: string, ignoreUntil?: string, reason?: string }} OsvException */
/** @typedef {{ key: string, ecosystem: string, name: string, version: string, ids: string[], level: 'blocking' | 'reported' | 'unknown', label: string }} OsvFinding */
/** @typedef {{ blocking: OsvFinding[], reported: OsvFinding[] }} OsvGateOutcome */

const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_EXCEPTION_DAYS = 90;
export const BLOCKING_CVSS_SCORE = 7;
const BLOCKING_LABELS = new Set(['HIGH', 'CRITICAL']);
const REASON_FIELDS = ['paquet', 'responsable', 'motif'];

const unquote = (raw) => {
  const value = raw.trim();
  if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
    return value.slice(1, -1);
  }
  return value;
};

/**
 * Lit les blocs `[[IgnoredVulns]]` d'un `osv-scanner.toml` (clés simples sur une ligne).
 * @param {string} toml
 * @returns {OsvException[]}
 */
export function parseOsvExceptions(toml) {
  const entries = [];
  let current = null;
  for (const rawLine of toml.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('[')) {
      current = line === '[[IgnoredVulns]]' ? {} : null;
      if (current) entries.push(current);
      continue;
    }
    const match = /^([A-Za-z]+)\s*=\s*(.+)$/.exec(line);
    if (current && match) current[match[1]] = unquote(match[2]);
  }
  return entries;
}

const parseReason = (reason) =>
  Object.fromEntries(
    reason
      .split(';')
      .map((part) => part.split(':'))
      .filter((pair) => pair.length >= 2)
      .map(([key, ...rest]) => [key.trim().toLowerCase(), rest.join(':').trim()]),
  );

/**
 * Retourne la liste des erreurs ; une liste vide signifie que les exceptions sont conformes.
 * @param {OsvException[]} entries
 * @param {Date} [today]
 * @returns {string[]}
 */
export function validateOsvExceptions(entries, today = new Date()) {
  const errors = [];
  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  entries.forEach((entry, index) => {
    const label = entry.id ? `Exception ${entry.id}` : `Exception n° ${index + 1}`;
    if (!entry.id) errors.push(`${label} : identifiant \`id\` manquant.`);
    const reason = parseReason(entry.reason ?? '');
    const missing = REASON_FIELDS.filter((field) => !reason[field]);
    if (missing.length > 0) {
      errors.push(`${label} : \`reason\` doit renseigner ${missing.map((field) => `« ${field} : … »`).join(', ')}.`);
    }
    // `effectiveUntil` remplace `ignoreUntil`, déprécié par OSV-Scanner 2.x mais encore accepté.
    const expiry = entry.effectiveUntil ?? entry.ignoreUntil ?? '';
    if (!/^\d{4}-\d{2}-\d{2}/.test(expiry)) {
      errors.push(`${label} : date d'expiration \`effectiveUntil\` manquante ou invalide.`);
      return;
    }
    const until = Date.parse(`${expiry.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(until)) {
      errors.push(`${label} : date d'expiration \`effectiveUntil\` invalide.`);
    } else if (until < startOfToday) {
      errors.push(`${label} : exception expirée le ${expiry.slice(0, 10)}.`);
    } else if (until - startOfToday > MAX_EXCEPTION_DAYS * DAY_MS) {
      errors.push(`${label} : expiration au-delà de ${MAX_EXCEPTION_DAYS} jours.`);
    }
  });
  return errors;
}

const cvssScore = (value) => {
  const score = Number.parseFloat(value ?? '');
  return Number.isFinite(score) ? score : null;
};

const groupSeverity = (group, vulnerabilities) => {
  if (group.ids.some((id) => id.startsWith('MAL-'))) return { level: 'blocking', label: 'paquet malveillant' };
  const score = cvssScore(group.max_severity);
  if (score !== null) {
    return { level: score >= BLOCKING_CVSS_SCORE ? 'blocking' : 'reported', label: `CVSS ${score}` };
  }
  const labels = vulnerabilities
    .filter((vuln) => group.ids.includes(vuln.id))
    .map((vuln) => String(vuln.database_specific?.severity ?? '').toUpperCase())
    .filter(Boolean);
  const blocking = labels.find((label) => BLOCKING_LABELS.has(label));
  if (blocking) return { level: 'blocking', label: blocking.toLowerCase() };
  if (labels.length > 0) return { level: 'reported', label: labels[0].toLowerCase() };
  return { level: 'unknown', label: 'sévérité inconnue' };
};

/**
 * Aplatit un rapport JSON d'OSV-Scanner en constats par paquet et groupe d'avis.
 * @param {any} report rapport `--format=json` d'OSV-Scanner
 * @returns {OsvFinding[]}
 */
export function collectOsvFindings(report) {
  const findings = [];
  for (const result of report?.results ?? []) {
    for (const entry of result.packages ?? []) {
      const { name, version, ecosystem } = entry.package ?? {};
      const vulnerabilities = entry.vulnerabilities ?? [];
      const groups = entry.groups?.length ? entry.groups : vulnerabilities.map((vuln) => ({ ids: [vuln.id] }));
      for (const group of groups) {
        const ids = [...(group.ids ?? [])].sort();
        if (ids.length === 0) continue;
        findings.push({
          key: `${ecosystem}/${name}:${ids.join(',')}`,
          ecosystem,
          name,
          version,
          ids,
          ...groupSeverity({ ...group, ids }, vulnerabilities),
        });
      }
    }
  }
  return findings;
}

/**
 * Compare la branche cible et la PR : seules les nouvelles vulnérabilités ≥ haute bloquent.
 * @param {any} oldReport
 * @param {any} newReport
 * @returns {OsvGateOutcome}
 */
export function evaluateOsvGate(oldReport, newReport) {
  const known = new Set(collectOsvFindings(oldReport).map((finding) => finding.key));
  const introduced = collectOsvFindings(newReport).filter((finding) => !known.has(finding.key));
  return {
    blocking: introduced.filter((finding) => finding.level === 'blocking'),
    reported: introduced.filter((finding) => finding.level !== 'blocking'),
  };
}

const formatFinding = (finding) =>
  `| \`${finding.name}@${finding.version}\` (${finding.ecosystem}) | ${finding.ids.join(', ')} | ${finding.label} |`;

/**
 * @param {OsvGateOutcome} outcome
 * @param {{ scope?: 'pr' | 'branch' }} [options]
 * @returns {string}
 */
export function formatOsvGateSummary({ blocking, reported }, { scope = 'pr' } = {}) {
  const pr = scope === 'pr';
  const lines = ['## OSV-Scanner', ''];
  if (blocking.length === 0 && reported.length === 0) {
    lines.push(pr ? 'Aucune nouvelle vulnérabilité introduite par cette PR.' : 'Aucune vulnérabilité connue sur la branche analysée.');
    return `${lines.join('\n')}\n`;
  }
  lines.push(
    blocking.length > 0
      ? pr
        ? `**${blocking.length} nouvelle(s) vulnérabilité(s) de sévérité haute ou critique : PR bloquée.**`
        : `**${blocking.length} vulnérabilité(s) de sévérité haute ou critique à traiter selon SECURITY.md.**`
      : 'Aucune vulnérabilité de sévérité haute ou critique.',
    '',
    '| Paquet | Avis | Sévérité |',
    '|---|---|---|',
    ...[...blocking, ...reported].map(formatFinding),
  );
  if (reported.length > 0) {
    lines.push('', 'Les vulnérabilités de sévérité moyenne, basse ou inconnue sont signalées sans bloquer (spec 117).');
  }
  return `${lines.join('\n')}\n`;
}
