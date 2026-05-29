import { describe, expect, it, vi } from 'vitest';
import { mapTournamentMatchDetail, mapX01TournamentResultSubmission } from '../../../src/application/scoring/tournamentScoring';
import { TournamentScoringApiError } from '../../../src/features/tournament-scoring/tournamentScoringApi';
import {
  LocalTournamentSubmissionRepository,
  createTournamentSubmissionRecord,
  submitTournamentResultWithLocalDraft,
} from '../../../src/features/tournament-scoring/localTournamentSubmissions';

describe('LocalTournamentSubmissionRepository', () => {
  it('conserve localement une soumission echouee avec retry possible', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalTournamentSubmissionRepository(storage);
    const submission = buildSubmission();
    const gateway = {
      submitResult: vi.fn().mockRejectedValue(new Error('API down')),
    };

    const result = await submitTournamentResultWithLocalDraft(gateway, repository, submission);
    const drafts = await repository.listDrafts();

    expect(result.status).toBe('network_error');
    expect(drafts[0]).toMatchObject({
      idempotencyKey: submission.idempotencyKey,
      status: 'network_error',
      errorMessage: 'API down',
    });
  });

  it('marque une soumission locale comme envoyee apres succes backend', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalTournamentSubmissionRepository(storage);
    const submission = buildSubmission();
    const gateway = {
      submitResult: vi.fn().mockResolvedValue(createTournamentSubmissionRecord(submission, 'submitted')),
    };

    await submitTournamentResultWithLocalDraft(gateway, repository, submission);
    const draft = await repository.getDraft(submission.idempotencyKey);

    expect(draft?.status).toBe('submitted');
  });

  it('mappe une erreur 401 vers le statut unauthorized', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalTournamentSubmissionRepository(storage);
    const submission = buildSubmission();
    const gateway = {
      submitResult: vi.fn().mockRejectedValue(new TournamentScoringApiError('Session expiree', 401, 'unauthorized')),
    };

    const result = await submitTournamentResultWithLocalDraft(gateway, repository, submission);
    const drafts = await repository.listDrafts();

    expect(result.status).toBe('unauthorized');
    expect(result.errorMessage).toContain('Session expiree');
    expect(drafts[0]).toMatchObject({ status: 'unauthorized' });
  });

  it('mappe une erreur 409 vers le statut conflict', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalTournamentSubmissionRepository(storage);
    const submission = buildSubmission();
    const gateway = {
      submitResult: vi.fn().mockRejectedValue(new TournamentScoringApiError('Déjà soumis', 409, 'conflict')),
    };

    const result = await submitTournamentResultWithLocalDraft(gateway, repository, submission);

    expect(result.status).toBe('conflict');
  });

  it('mappe une erreur 422 vers le statut rejected', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalTournamentSubmissionRepository(storage);
    const submission = buildSubmission();
    const gateway = {
      submitResult: vi.fn().mockRejectedValue(new TournamentScoringApiError('Resultat invalide', 422, 'rejected')),
    };

    const result = await submitTournamentResultWithLocalDraft(gateway, repository, submission);

    expect(result.status).toBe('rejected');
  });
});

function buildSubmission() {
  const detail = mapTournamentMatchDetail({
    tournament_id: 't1',
    match_id: 'm1',
    players: [
      { id: 'p1', name: 'A', team_id: 'team1' },
      { id: 'p2', name: 'B', team_id: 'team2' },
    ],
  });
  return mapX01TournamentResultSubmission(detail.context, detail.match);
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
