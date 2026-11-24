import { describe, expect, it } from 'vitest';

import {
  evaluateOsvGate,
  formatOsvGateSummary,
  parseOsvExceptions,
  validateOsvExceptions,
} from '../../../scripts/lib/osvPolicy.mjs';

// Spec ref: specs/117-counter-sec-vulnerability-scanning (FR-03 seuil ≥ haute, FR-05 exceptions datées)
const report = (...packages: Array<{ name: string; version?: string; groups: Array<Record<string, unknown>>; vulns?: Array<Record<string, unknown>> }>) => ({
  results: [
    {
      packages: packages.map(({ name, version = '1.0.0', groups, vulns = [] }) => ({
        package: { name, version, ecosystem: 'npm' },
        groups,
        vulnerabilities: vulns,
      })),
    },
  ],
});

describe('OSV-Scanner gate', () => {
  it('blocks only vulnerabilities introduced by the PR at high severity or above', () => {
    const base = report({ name: 'legacy', groups: [{ ids: ['GHSA-old'], max_severity: '9.8' }] });
    const head = report(
      { name: 'legacy', version: '1.0.1', groups: [{ ids: ['GHSA-old'], max_severity: '9.8' }] },
      { name: 'fresh', groups: [{ ids: ['GHSA-high'], max_severity: '7.5' }] },
      { name: 'minor', groups: [{ ids: ['GHSA-medium'], max_severity: '5.3' }] },
    );

    const outcome = evaluateOsvGate(base, head);

    expect(outcome.blocking.map((finding) => finding.name)).toEqual(['fresh']);
    expect(outcome.reported.map((finding) => finding.name)).toEqual(['minor']);
    expect(formatOsvGateSummary(outcome)).toContain('PR bloquée');
  });

  it('falls back on the advisory label, blocks malicious packages and reports unknown severities', () => {
    const head = report(
      { name: 'labelled', groups: [{ ids: ['GHSA-label'], max_severity: '' }], vulns: [{ id: 'GHSA-label', database_specific: { severity: 'CRITICAL' } }] },
      { name: 'malware', groups: [{ ids: ['MAL-2026-1'] }] },
      { name: 'unknown', groups: [], vulns: [{ id: 'OSV-unknown' }] },
    );

    const outcome = evaluateOsvGate({ results: [] }, head);

    expect(outcome.blocking.map((finding) => finding.name)).toEqual(['labelled', 'malware']);
    expect(outcome.reported).toMatchObject([{ name: 'unknown', label: 'sévérité inconnue' }]);
  });

  it('passes and says so when nothing new is introduced', () => {
    const outcome = evaluateOsvGate(report(), report());

    expect(outcome.blocking).toEqual([]);
    expect(formatOsvGateSummary(outcome)).toContain('Aucune nouvelle vulnérabilité');
    expect(formatOsvGateSummary(outcome, { scope: 'branch' })).toContain('Aucune vulnérabilité connue');
  });

  it('treats every high finding of a full scan as blocking', () => {
    const outcome = evaluateOsvGate({ results: [] }, report({ name: 'legacy', groups: [{ ids: ['GHSA-old'], max_severity: '9.8' }] }));

    expect(formatOsvGateSummary(outcome, { scope: 'branch' })).toContain('1 vulnérabilité(s) de sévérité haute ou critique à traiter');
  });
});

describe('OSV-Scanner exceptions', () => {
  const today = new Date('2026-11-24T10:00:00Z');
  const reason = 'paquet : demo ; responsable : @floriangiral ; motif : non exploitable';

  it('reads IgnoredVulns blocks and accepts a documented exception within 90 days', () => {
    const entries = parseOsvExceptions(`# commentaire\n[[IgnoredVulns]]\nid = "GHSA-1"\neffectiveUntil = 2027-02-22 # limite\nreason = "${reason}"\n\n[[PackageOverrides]]\nname = "ignored"\n`);

    expect(entries).toEqual([{ id: 'GHSA-1', effectiveUntil: '2027-02-22', reason }]);
    expect(validateOsvExceptions(entries, today)).toEqual([]);
  });

  it('rejects expired, too long, undated or undocumented exceptions', () => {
    const errors = validateOsvExceptions(
      [
        { id: 'GHSA-expired', ignoreUntil: '2026-11-23', reason },
        { id: 'GHSA-long', effectiveUntil: '2027-02-23', reason },
        { id: 'GHSA-undated', reason },
        { ignoreUntil: '2026-12-01', reason: 'motif : oubli' },
      ],
      today,
    );

    expect(errors).toEqual([
      'Exception GHSA-expired : exception expirée le 2026-11-23.',
      'Exception GHSA-long : expiration au-delà de 90 jours.',
      "Exception GHSA-undated : date d'expiration `effectiveUntil` manquante ou invalide.",
      'Exception n° 4 : identifiant `id` manquant.',
      'Exception n° 4 : `reason` doit renseigner « paquet : … », « responsable : … ».',
    ]);
  });
});
