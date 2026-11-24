import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(new URL('../../../.github/workflows/scorecard.yml', import.meta.url), 'utf8');

function step(name: string) {
  const block = workflow.split(`      - name: ${name}\n`)[1]?.split('\n      - name: ')[0];
  if (!block) throw new Error(`Étape Scorecard absente : ${name}`);
  return block;
}

function shouldUpload(name: string, outcome: string, reportExists: boolean): unknown {
  const analysisId = step('Run analysis').match(/^\s+id: (\S+)/m)?.[1];
  if (!analysisId) throw new Error('L’analyse Scorecard doit avoir un identifiant.');
  const condition = step(name).match(/^\s+if: (.+)$/m)?.[1];
  if (!condition) throw new Error(`Condition d’envoi absente : ${name}`);
  return runInNewContext(condition, {
    always: () => true,
    steps: { [analysisId]: { outcome } },
    hashFiles: () => reportExists ? 'report-digest' : '',
  });
}

describe('envoi des résultats Scorecard', () => {
  it.each([
    { outcome: 'skipped', reportExists: false, artifact: false, scanning: false },
    { outcome: 'failure', reportExists: false, artifact: false, scanning: false },
    { outcome: 'failure', reportExists: true, artifact: true, scanning: true },
    { outcome: 'success', reportExists: false, artifact: true, scanning: false },
    { outcome: 'success', reportExists: true, artifact: true, scanning: true },
  ])('gère une analyse $outcome avec reportExists=$reportExists', ({ outcome, reportExists, artifact, scanning }) => {
    expect(shouldUpload('Upload SARIF artifact', outcome, reportExists)).toBe(artifact);
    expect(shouldUpload('Upload to code scanning', outcome, reportExists)).toBe(scanning);
    if (outcome === 'success' && !reportExists) {
      expect(step('Upload SARIF artifact')).toMatch(/^\s+if-no-files-found: error$/m);
    }
  });
});
