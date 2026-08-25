// @vitest-environment jsdom

import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { IndexedDBSessionRepository } from '../../../src/infrastructure';
import type { MatchState } from '../../../types';

const match: MatchState = {
  id: 'indexed-match',
  config: {
    startingScore: 501,
    checkIn: 'Open',
    checkOut: 'Double',
    matchMode: 'LEGS',
    setsToWin: 0,
    legsToWin: 1,
    isDoubles: false,
    initialStartingPlayerIndex: 0,
  },
  players: [{ id: 'p1', name: 'Alice', teamId: 'p1' }],
  setsWon: { p1: 0 },
  legsWon: { p1: 0 },
  completedLegs: [],
  currentLeg: {
    scores: { p1: 501 },
    history: [],
    winnerId: null,
    startingPlayerIndex: 0,
  },
  status: 'active',
  matchWinnerId: null,
  currentPlayerIndex: 0,
  duration: 0,
};

describe('IndexedDBSessionRepository IndexedDB path', () => {
  it('initializes the database lazily and persists current matches', async () => {
    const repository = new IndexedDBSessionRepository({ storage: null });

    await repository.saveCurrentMatch(match);
    await expect(repository.getCurrentMatch(match.id)).resolves.toEqual(match);
  });

  it('persists and lists local match history through IndexedDB', async () => {
    const repository = new IndexedDBSessionRepository({ storage: null });

    await repository.saveMatchHistory(match);
    await expect(repository.listLocalGameHistory()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: match.id, gameType: 'X01', payload: { match } }),
      ])
    );
  });
});
