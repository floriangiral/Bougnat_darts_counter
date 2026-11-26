import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const e2e = readFileSync(new URL('../../../.github/workflows/e2e.yml', import.meta.url), 'utf8');
const reusable = readFileSync(new URL('../../../.github/workflows/reusable-integration-smoke.yml', import.meta.url), 'utf8');
const notification = readFileSync(new URL('../../../.github/workflows/scheduled-failure-notify.yml', import.meta.url), 'utf8');
const dispatcher = e2e.split('\n  dispatch-nightly:\n')[1]?.split('\n  smoke:\n')[0];
const script = dispatcher?.split('          script: |\n')[1]?.replace(/^ {12}/gm, '');
const notificationScript = notification.split('          script: |\n')[1]?.replace(/^ {12}/gm, '');
const notificationCondition = notification.match(/ {4}if: >-\n([\s\S]*?) {4}runs-on:/)?.[1]?.trim();

if (!dispatcher || !script || !notificationScript || !notificationCondition) throw new Error('Les scripts et la condition de notification doivent être présents.');

function dispatch(createWorkflowDispatch: ReturnType<typeof vi.fn>) {
  const execution: unknown = runInNewContext(`(async () => {${script}})()`, {
    github: { rest: { actions: { createWorkflowDispatch } } },
    context: { repo: { owner: 'owner', repo: 'counter' } },
    core: { notice: vi.fn() },
  });
  return execution;
}

describe('frontière de confiance du smoke CI', () => {
  it('teste le commit du contexte appelant sans ref de checkout indépendante', () => {
    expect(reusable).not.toMatch(/^\s+ref:/m);
    expect(reusable).not.toContain('inputs.ref');
    expect(e2e).toContain("if: github.event_name != 'schedule'");
    expect(e2e).toContain("fail-on-smoke-failure: ${{ github.event_name == 'workflow_dispatch' && inputs.nightly }}");
  });

  it('déclenche develop sans exécuter son code dans le contexte du planificateur', async () => {
    const createWorkflowDispatch = vi.fn().mockResolvedValue(undefined);

    await expect(dispatch(createWorkflowDispatch)).resolves.toBeUndefined();
    expect(createWorkflowDispatch).toHaveBeenCalledExactlyOnceWith({
      owner: 'owner',
      repo: 'counter',
      workflow_id: 'e2e.yml',
      ref: 'develop',
      inputs: { nightly: 'true' },
    });
    expect(dispatcher).toContain('actions: write');
    expect(dispatcher).not.toMatch(/contents:|secrets:|checkout@|uses: \.\//);
    expect(dispatcher).not.toMatch(/^\s+run:/m);
  });

  it('propage un refus de dispatch sans annoncer de succès', async () => {
    const error = new Error('Dispatch refusé');

    await expect(dispatch(vi.fn().mockRejectedValue(error))).rejects.toBe(error);
  });

  it.each([
    { event: 'schedule', name: 'End-to-End', conclusion: 'success', issueNumber: 1 },
    { event: 'workflow_dispatch', name: 'End-to-End (nocturne)', conclusion: 'success', issueNumber: 2 },
    { event: 'schedule', name: 'End-to-End', conclusion: 'failure', issueNumber: 1 },
    { event: 'workflow_dispatch', name: 'End-to-End (nocturne)', conclusion: 'failure', issueNumber: 2 },
  ])('actualise uniquement son incident après $event / $conclusion', async ({ event, name, conclusion, issueNumber }) => {
    const update = vi.fn().mockResolvedValue(undefined);
    const createComment = vi.fn<(params: {
      owner: string; repo: string; issue_number: number; body: string;
    }) => Promise<void>>().mockResolvedValue(undefined);
    const execution: unknown = runInNewContext(`(async () => {${notificationScript}})()`, {
      github: {
        paginate: vi.fn().mockResolvedValue([
          { number: 1, title: '[CI] Échec planifié : End-to-End (déclenchement)' },
          { number: 2, title: '[CI] Échec planifié : End-to-End' },
        ]),
        rest: {
          issues: {
            listForRepo: vi.fn(),
            createComment,
            getLabel: vi.fn().mockResolvedValue(undefined),
            update,
          },
        },
      },
      context: {
        repo: { owner: 'owner', repo: 'counter' },
        payload: {
          workflow_run: {
            name,
            path: '.github/workflows/e2e.yml',
            event,
            conclusion,
            run_number: 10,
            html_url: 'https://example.com/run/10',
            head_branch: 'develop',
            head_sha: 'commit',
            updated_at: '2026-11-24T03:17:00Z',
          },
        },
      },
      core: { notice: vi.fn() },
    });

    await expect(execution).resolves.toBeUndefined();
    expect(createComment).toHaveBeenCalledOnce();
    expect(createComment.mock.calls[0][0]).toMatchObject({
      owner: 'owner',
      repo: 'counter',
      issue_number: issueNumber,
    });
    expect(createComment.mock.calls[0][0].body).toContain(conclusion === 'success' ? 'a réussi' : 'Nouvel échec');
    if (conclusion === 'failure') {
      expect(update).not.toHaveBeenCalled();
      return;
    }
    expect(update).toHaveBeenCalledExactlyOnceWith({
      owner: 'owner',
      repo: 'counter',
      issue_number: issueNumber,
      state: 'closed',
      state_reason: 'completed',
    });
  });

  it.each([
    { overrides: {}, expected: true },
    { overrides: { conclusion: 'success' }, expected: true },
    { overrides: { name: 'End-to-End' }, expected: true },
    { overrides: { display_title: 'End-to-End' }, expected: false },
    { overrides: { head_branch: 'autre-branche' }, expected: false },
    { overrides: { path: '.github/workflows/autre.yml' }, expected: false },
    { overrides: { event: 'pull_request' }, expected: false },
    { overrides: { conclusion: 'cancelled' }, expected: false },
    { overrides: { event: 'schedule', path: '.github/workflows/secret-scan.yml', name: 'Secret Scan' }, expected: true },
  ])('sélectionne les événements planifiés réels : $overrides → $expected', ({ overrides, expected }) => {
    const result: unknown = runInNewContext(notificationCondition, {
      github: {
        event: {
          workflow_run: {
            path: '.github/workflows/e2e.yml',
            name: 'End-to-End (nocturne)',
            display_title: 'End-to-End (nocturne)',
            event: 'workflow_dispatch',
            head_branch: 'develop',
            conclusion: 'failure',
            ...overrides,
          },
        },
      },
    });
    expect(result).toBe(expected);
  });

  it('écoute aussi le nom nocturne renvoyé par GitHub', () => {
    const triggers = notification.split('\nconcurrency:')[0];
    expect(triggers).toContain('      - End-to-End (nocturne)');
  });
});
