import { describe, expect, it, vi } from 'vitest';

import type { PersonalCricketMatchPayload, PersonalX01MatchPayload } from '../../../src/features/player-account/playerAccountTypes';
import {
  LocalPersonalX01MatchRepository,
  retryPendingPersonalX01Matches,
  submitPersonalX01MatchWithLocalDraft,
} from '../../../src/features/player-account/localPersonalX01Matches';

describe('LocalPersonalX01MatchRepository', () => {
  it('marque un match comme synchronise apres succes API', async () => {
    const repository = new LocalPersonalX01MatchRepository(createMemoryStorage());
    const payload = buildPayload('local-match-1');
    const gateway = {
      submitPersonalMatch: vi.fn().mockResolvedValue({ match: { id: 'remote-match-1', client_match_id: 'local-match-1' } }),
    };

    const result = await submitPersonalX01MatchWithLocalDraft(gateway, repository, payload);
    const records = await repository.list();

    expect(result.status).toBe('synced');
    expect(result.response?.match).toMatchObject({ id: 'remote-match-1' });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ clientMatchId: 'local-match-1', status: 'synced', response: { match: { id: 'remote-match-1' } } });
  });

  it('conserve le meme client_match_id entre echec reseau et retry', async () => {
    const repository = new LocalPersonalX01MatchRepository(createMemoryStorage());
    const payload = buildPayload('stable-client-id');
    const gateway = {
      submitPersonalMatch: vi
        .fn()
        .mockRejectedValueOnce(new Error('Network down'))
        .mockResolvedValueOnce({ match: { id: 'remote-stable', client_match_id: 'stable-client-id' } }),
    };

    const failed = await submitPersonalX01MatchWithLocalDraft(gateway, repository, payload);
    const retried = await retryPendingPersonalX01Matches(gateway, repository);
    const records = await repository.list();

    expect(failed.status).toBe('sync_pending');
    expect(retried[0].status).toBe('synced');
    expect(gateway.submitPersonalMatch).toHaveBeenCalledTimes(2);
    expect(gateway.submitPersonalMatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ client_match_id: 'stable-client-id' }));
    expect(gateway.submitPersonalMatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ client_match_id: 'stable-client-id' }));
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ clientMatchId: 'stable-client-id', status: 'synced' });
  });

  it('retry un match Cricket avec le meme client_match_id', async () => {
    const repository = new LocalPersonalX01MatchRepository(createMemoryStorage());
    const payload = buildCricketPayload('stable-cricket-client-id');
    const gateway = {
      submitPersonalMatch: vi
        .fn()
        .mockRejectedValueOnce(new Error('Network down'))
        .mockResolvedValueOnce({ match: { id: 'remote-cricket', client_match_id: 'stable-cricket-client-id', game_mode: 'cricket' } }),
    };

    await submitPersonalX01MatchWithLocalDraft(gateway, repository, payload);
    const retried = await retryPendingPersonalX01Matches(gateway, repository);

    expect(retried[0].status).toBe('synced');
    expect(gateway.submitPersonalMatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ client_match_id: 'stable-cricket-client-id', game_mode: 'cricket' }));
    expect(gateway.submitPersonalMatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ client_match_id: 'stable-cricket-client-id', game_mode: 'cricket' }));
  });

  it('conserve une entree de sync distincte par participant lie', async () => {
    const repository = new LocalPersonalX01MatchRepository(createMemoryStorage());
    const playerPayload = {
      ...buildPayload('shared-match-id'),
      participant_key: 'p1',
      target_player_id: 'player_1',
    };
    const opponentPayload = {
      ...buildPayload('shared-match-id'),
      participant_key: 'p2',
      target_player_id: 'player_2',
      result: 'loss' as const,
    };

    await repository.savePending(playerPayload);
    await repository.savePending(opponentPayload);
    const records = await repository.list();

    expect(records).toHaveLength(2);
    expect(records.map((record) => record.clientMatchId).sort()).toEqual([
      'shared-match-id:p1',
      'shared-match-id:p2',
    ]);
  });
});

function buildPayload(clientMatchId: string): PersonalX01MatchPayload {
  return {
    client_match_id: clientMatchId,
    game_mode: 'x01',
    target: 501,
    started_at: '2026-05-29T09:00:00.000Z',
    completed_at: '2026-05-29T09:20:00.000Z',
    duration_sec: 1200,
    opponent: { type: 'local', name: 'Alice' },
    result: 'win',
    player_score: 3,
    opponent_score: 1,
    stats: {
      match_average: 72.45,
      count_180: 1,
      count_140_plus: 4,
      count_100_plus: 12,
      best_checkout: 96,
      checkout_rate: 33.33,
    },
    turns: [],
  };
}

function buildCricketPayload(clientMatchId: string): PersonalCricketMatchPayload {
  return {
    client_match_id: clientMatchId,
    game_mode: 'cricket',
    variant: 'standard',
    started_at: '2026-05-29T13:00:00.000Z',
    completed_at: '2026-05-29T13:20:00.000Z',
    duration_sec: 1200,
    opponent: { type: 'local', name: 'Bot' },
    result: 'win',
    player_score: 220,
    opponent_score: 140,
    stats: {
      cricket: {
        match_mpr: 2.45,
        total_marks: 49,
        count_9_marks: 1,
        count_8_marks: 0,
        count_7_marks: 2,
        count_6_plus_marks: 5,
        points_scored: 220,
        points_allowed: 140,
        bull_marks: 4,
        marks_20: 9,
        marks_19: 8,
        marks_18: 7,
        marks_17: 6,
        marks_16: 5,
        marks_15: 4,
        close_rate: 100,
        darts_thrown: 60,
        visits_count: 20,
      },
    },
    turns: [],
  };
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
