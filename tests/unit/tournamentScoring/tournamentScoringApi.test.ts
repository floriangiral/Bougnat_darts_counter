import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpTournamentScoringClient, TournamentScoringApiError } from '../../../src/features/tournament-scoring/tournamentScoringApi';
import { mapTournamentMatchDetail, mapX01TournamentResultSubmission } from '../../../src/application/scoring/tournamentScoring';
import { submitTurn } from '../../../src/application/scoring/matchLifecycle';

const apiResponse = (data: unknown, ok = true, status = ok ? 200 : 500) => ({
  ok,
  status,
  text: vi.fn().mockResolvedValue(JSON.stringify({ data })),
});

describe('HttpTournamentScoringClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('liste les matchs assignes avec Authorization bearer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      matches: [buildRawMatch()],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpTournamentScoringClient('https://api.bougnatdarts.fr/', async () => 'jwt-player');
    const matches = await client.listAssignedMatches();

    expect(matches).toHaveLength(1);
    expect(matches[0].matchId).toBe('match-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bougnatdarts.fr/v1/scoring/me/tournament-matches',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-player',
        }),
      }),
    );
  });

  it('charge un match tournoi et le mappe en MatchState', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse(buildRawMatch()));
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpTournamentScoringClient('http://localhost:8080', async () => 'jwt-player');
    const detail = await client.loadMatch('tournament-1', 'match-1');

    expect(detail.match.id).toBe('tournament:tournament-1:match-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/v1/scoring/tournaments/tournament-1/matches/match-1',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('soumet le resultat avec une cle idempotente', async () => {
    const detail = mapTournamentMatchDetail(buildRawMatch());
    const finished = submitTurn(detail.match, 101, 3);
    const submission = mapX01TournamentResultSubmission(detail.context, finished);
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({ id: 'submission-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpTournamentScoringClient('https://api.bougnatdarts.fr', async () => 'jwt-player');
    const record = await client.submitResult(submission);

    expect(record.status).toBe('submitted');
    expect(record.remoteSubmissionId).toBe('submission-1');
    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(requestInit.headers).toEqual(expect.objectContaining({
      Authorization: 'Bearer jwt-player',
      'Idempotency-Key': submission.idempotencyKey,
    }));
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      contract: 'bougnat-counter.x01-result.v0',
      idempotency_key: submission.idempotencyKey,
    });
  });

  it('classe les erreurs 401 pour une session expiree', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: { message: 'Unauthorized' } })),
    }));

    const client = new HttpTournamentScoringClient('https://api.bougnatdarts.fr', async () => 'expired');
    await expect(client.listAssignedMatches()).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
    } satisfies Partial<TournamentScoringApiError>);
  });
});

function buildRawMatch() {
  return {
    tournament_id: 'tournament-1',
    match_id: 'match-1',
    tournament_name: 'Open Bougnat',
    starting_score: 101,
    legs_to_win: 1,
    match_mode: 'LEGS',
    check_out: 'Open',
    players: [
      { id: 'alice', display_name: 'Alice', team_id: 'team1' },
      { id: 'bob', display_name: 'Bob', team_id: 'team2' },
    ],
  };
}
