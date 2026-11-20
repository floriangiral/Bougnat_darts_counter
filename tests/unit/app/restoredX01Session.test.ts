// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersistedAppSession } from '../../../src/shared';
import type { InOutRule, MatchState } from '../../../types';
import { APP_SESSION_STORAGE_KEY } from '../../../utils/appPersistence';

const restorePersistedAppSessionAsync = vi.fn<() => Promise<PersistedAppSession | null>>();

vi.mock('../../../src/infrastructure', () => ({
  clearPersistedAppSessionAsync: vi.fn(),
  persistAppSessionAsync: vi.fn(),
  restorePersistedAppSessionAsync: () => restorePersistedAppSessionAsync(),
}));

const { getRestoredAppSession, getRestoredAppSessionAsync } = await import('../../../src/app/appShell');

// Session saved by a version that accepted a remaining score of 1 in Master-Out.
const buildStuckMatch = (checkOut: InOutRule): MatchState => ({
  id: 'match-1',
  config: { startingScore: 5, checkIn: 'Open', checkOut, matchMode: 'LEGS', setsToWin: 1, legsToWin: 1, isDoubles: false },
  players: [
    { id: 'p1', name: 'Alice', teamId: 'team1' },
    { id: 'p2', name: 'Robot', teamId: 'team2', isBot: true, botLevel: 'CLUB' },
  ],
  setsWon: { team1: 0, team2: 0 },
  legsWon: { team1: 0, team2: 0 },
  completedLegs: [],
  currentLeg: {
    scores: { team1: 5, team2: 1 },
    history: [
      { playerId: 'p1', score: 0, isBust: false, remainingAfter: 5, dartsThrown: 3 },
      { playerId: 'p2', score: 4, isBust: false, remainingAfter: 1, dartsThrown: 3 },
      { playerId: 'p1', score: 0, isBust: false, remainingAfter: 5, dartsThrown: 3 },
      { playerId: 'p2', score: 0, isBust: false, remainingAfter: 1, dartsThrown: 3 },
    ],
    winnerId: null,
    startingPlayerIndex: 0,
  },
  status: 'active',
  matchWinnerId: null,
  currentPlayerIndex: 0,
  duration: 0,
});

const buildSession = (match: MatchState): PersistedAppSession => ({
  screen: 'MATCH',
  selectedGameType: 'X01',
  currentMatch: match,
  matchWinner: '',
  arenaPrefillPlayers: [],
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: { match, hasGameStarted: true, elapsedSeconds: 42 },
});

const expectUnstuck = (match: MatchState | null | undefined) => {
  expect(match?.currentLeg.scores).toEqual({ team1: 5, team2: 5 });
  expect(match?.currentLeg.history[1]).toEqual({ playerId: 'p2', score: 0, isBust: true, remainingAfter: 5, dartsThrown: 3 });
  expect(match?.currentLeg.history[3]).toMatchObject({ score: 0, remainingAfter: 5 });
  expect(match?.currentPlayerIndex).toBe(0);
};

beforeEach(() => {
  window.localStorage.clear();
  restorePersistedAppSessionAsync.mockReset();
});

describe('restauration d’une partie X01 bloquée à 1 en Master-Out', () => {
  it('convertit en trop la visite qui a laissé 1 (stockage local)', () => {
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(buildSession(buildStuckMatch('Master'))));

    const session = getRestoredAppSession();

    expectUnstuck(session?.currentMatch);
    expectUnstuck(session?.matchRuntime?.match);
    expect(session?.matchRuntime?.elapsedSeconds).toBe(42);
  });

  it('convertit aussi la session restaurée depuis IndexedDB', async () => {
    restorePersistedAppSessionAsync.mockResolvedValue(buildSession(buildStuckMatch('Master')));

    const session = await getRestoredAppSessionAsync();

    expectUnstuck(session?.currentMatch);
    expectUnstuck(session?.matchRuntime?.match);
  });

  it('laisse intactes les autres règles de sortie et les sessions sans match', async () => {
    const openSession = buildSession(buildStuckMatch('Open'));
    restorePersistedAppSessionAsync.mockResolvedValue(openSession);
    expect(await getRestoredAppSessionAsync()).toEqual(openSession);

    const noMatchSession = { ...openSession, currentMatch: null, matchRuntime: null };
    restorePersistedAppSessionAsync.mockResolvedValue(noMatchSession);
    expect(await getRestoredAppSessionAsync()).toEqual(noMatchSession);

    const finished = { ...buildStuckMatch('Master'), status: 'finished' as const };
    restorePersistedAppSessionAsync.mockResolvedValue(buildSession(finished));
    expect((await getRestoredAppSessionAsync())?.currentMatch).toEqual(finished);

    const stuckWithoutScoringVisit = buildStuckMatch('Master');
    stuckWithoutScoringVisit.currentLeg.history = [];
    restorePersistedAppSessionAsync.mockResolvedValue(buildSession(stuckWithoutScoringVisit));
    expect((await getRestoredAppSessionAsync())?.currentMatch).toEqual(stuckWithoutScoringVisit);

    restorePersistedAppSessionAsync.mockResolvedValue(null);
    expect(await getRestoredAppSessionAsync()).toBeNull();
    expect(getRestoredAppSession()).toBeNull();
  });
});
