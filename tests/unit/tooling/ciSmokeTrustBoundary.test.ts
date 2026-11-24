import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const e2e = readFileSync(new URL('../../../.github/workflows/e2e.yml', import.meta.url), 'utf8');
const reusable = readFileSync(new URL('../../../.github/workflows/reusable-integration-smoke.yml', import.meta.url), 'utf8');
const notification = readFileSync(new URL('../../../.github/workflows/scheduled-failure-notify.yml', import.meta.url), 'utf8');
const dispatcher = e2e.split('\n  dispatch-nightly:\n')[1]?.split('\n  smoke:\n')[0];
const script = dispatcher?.split('          script: |\n')[1]?.replace(/^ {12}/gm, '');
const notificationScript = notification.split('          script: |\n')[1]?.replace(/^ {12}/gm, '');

if (!dispatcher || !script || !notificationScript) throw new Error('Les scripts du déclencheur et de notification doivent être présents.');

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
    { event: 'schedule', issueNumber: 1 },
    { event: 'workflow_dispatch', issueNumber: 2 },
  ])('ferme uniquement son incident après un succès $event', async ({ event, issueNumber }) => {
    const update = vi.fn().mockResolvedValue(undefined);
    const execution: unknown = runInNewContext(`(async () => {${notificationScript}})()`, {
      github: {
        paginate: vi.fn().mockResolvedValue([
          { number: 1, title: '[CI] Échec planifié : End-to-End (déclenchement)' },
          { number: 2, title: '[CI] Échec planifié : End-to-End' },
        ]),
        rest: {
          issues: {
            listForRepo: vi.fn(),
            createComment: vi.fn().mockResolvedValue(undefined),
            update,
          },
        },
      },
      context: {
        repo: { owner: 'owner', repo: 'counter' },
        payload: {
          workflow_run: {
            name: 'End-to-End',
            event,
            conclusion: 'success',
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
    expect(update).toHaveBeenCalledExactlyOnceWith({
      owner: 'owner',
      repo: 'counter',
      issue_number: issueNumber,
      state: 'closed',
      state_reason: 'completed',
    });
  });

  it('exclut les dispatchs manuels non bloquants des notifications nocturnes', () => {
    expect(notification).toContain("github.event.workflow_run.event == 'workflow_dispatch'");
    expect(notification).toContain("github.event.workflow_run.display_title == 'End-to-End (nocturne)'");
    expect(e2e).toContain("inputs.nightly && 'End-to-End (nocturne)'");
    expect(notification).toContain("github.event.workflow_run.head_branch == 'develop'");
  });
});
