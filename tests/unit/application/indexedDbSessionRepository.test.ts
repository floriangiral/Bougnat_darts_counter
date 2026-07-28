import { describe, expect, it, vi } from 'vitest';

import type { MatchState } from '../../../types';
import type { PersistedAppSession } from '../../../src/shared';
import { IndexedDBSessionRepository } from '../../../src/infrastructure';

const createStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
};

const match: MatchState = {
  id: 'match-1',
  config: {
    startingScore: 101,
    checkIn: 'Open',
    checkOut: 'Double',
    matchMode: 'LEGS',
    setsToWin: 0,
    legsToWin: 1,
    isDoubles: false,
    initialStartingPlayerIndex: 0,
  },
  players: [
    { id: 'p1', name: 'Joueur 1', teamId: 'team1' },
    { id: 'p2', name: 'Joueur 2', teamId: 'team2' },
  ],
  setsWon: { team1: 0, team2: 0 },
  legsWon: { team1: 1, team2: 0 },
  completedLegs: [],
  currentLeg: {
    scores: { team1: 0, team2: 32 },
    history: [],
    winnerId: 'team1',
    startingPlayerIndex: 0,
  },
  status: 'finished',
  matchWinnerId: 'team1',
  currentPlayerIndex: 0,
  duration: 87,
};

const session: PersistedAppSession = {
  screen: 'MATCH',
  selectedGameType: 'X01',
  currentMatch: match,
  matchWinner: 'team1',
  arenaPrefillPlayers: [],
  arenaPrefillConfig: undefined,
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: {
    match,
    hasGameStarted: true,
    elapsedSeconds: 87,
  },
};

describe('IndexedDBSessionRepository fallback storage', () => {
  it('persists and restores the app session without IndexedDB', async () => {
    const repository = new IndexedDBSessionRepository({
      storage: createStorage(),
    });

    await repository.saveAppSession(session);

    await expect(repository.loadAppSession()).resolves.toEqual(session);
  });

  it('persists current matches and local game history in fallback storage', async () => {
    const repository = new IndexedDBSessionRepository({
      storage: createStorage(),
    });

    await repository.saveCurrentMatch(match);
    await repository.saveMatchHistory(match);

    await expect(repository.getCurrentMatch(match.id)).resolves.toEqual(match);
    await expect(repository.listLocalGameHistory()).resolves.toMatchObject([
      {
        id: match.id,
        gameType: 'X01',
        winnerId: 'team1',
      },
    ]);
  });

  // Spec ref: spec:counter/inp-phase1-quick-wins
  // Ensures saveAppSession writes exactly once to the fallback storage so that
  // the synchronous boot-time restore (getRestoredAppSession) reads a consistent
  // value without a double setItem call blocking the interaction thread.
  it('writes the app session to fallback storage exactly once per save call', async () => {
    const storage = createStorage();
    const setItemSpy = vi.fn<(key: string, value: string) => void>(storage.setItem.bind(storage));
    // Cast satisfies StorageLike: the spy preserves the (key, value) => void signature at runtime.
    const spiedStorage = { ...storage, setItem: setItemSpy } as typeof storage;

    const repository = new IndexedDBSessionRepository({ storage: spiedStorage });
    await repository.saveAppSession(session);

    const sessionWrites = setItemSpy.mock.calls.filter(([key]) => key === 'bougnat-app-session-v1');
    expect(sessionWrites).toHaveLength(1);

    // The single write contains the full session.
    const written = JSON.parse(sessionWrites[0][1] as string) as typeof session;
    expect(written.screen).toBe(session.screen);
  });
});
