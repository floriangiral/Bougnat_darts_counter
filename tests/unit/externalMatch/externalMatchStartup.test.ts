import { describe, expect, it } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { getExternalLinkConflict } from '../../../src/features/external-match/externalMatchStartup';
import type { ExternalMatchContext } from '../../../src/features/external-match/externalMatchLink';
import type { GameConfig, MatchState, Player } from '../../../types';

// Spec ref: spec:counter/external-match-link
const ALLOWED = { origins: ['https://badarts.fr'], allowPrivateNetworkHttp: false };

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false,
};
const NOW = Date.UTC(2026, 10, 19, 12);
const externalMatch: ExternalMatchContext = {
  returnUrl: 'https://badarts.fr/match/12',
  createdAt: NOW,
  playerNames: ['Alice', 'Bob'],
  config: { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, isDoubles: false },
};

const inProgress = createMatch(players, config);
const finishedMatch: MatchState = {
  ...inProgress,
  currentLeg: { ...inProgress.currentLeg, winnerId: 'p1' },
  status: 'finished',
  matchWinnerId: 'p1',
};

const session = (overrides: Partial<Parameters<typeof getExternalLinkConflict>[0]> = {}) => ({
  screen: 'HOME',
  currentMatch: null,
  matchRuntime: null,
  externalMatch: null,
  ...overrides,
});

describe('getExternalLinkConflict', () => {
  it('returns null without session or without match', () => {
    expect(getExternalLinkConflict(null, ALLOWED, NOW)).toBeNull();
    expect(getExternalLinkConflict(undefined, ALLOWED, NOW)).toBeNull();
    expect(getExternalLinkConflict(session({ screen: 'MATCH' }), ALLOWED, NOW)).toBeNull();
  });

  it.each(['MATCH', 'CRICKET_GAME', 'CAPITAL_GAME', 'KILLER_GAME', 'GOTCHA_GAME', 'TRIATHLON_GAME'])(
    'protects a match in progress on %s',
    (screen) => {
      expect(getExternalLinkConflict(session({ screen, currentMatch: inProgress }), ALLOWED, NOW)).toBe('match-in-progress');
    },
  );

  it('reads the match from the runtime snapshot when present', () => {
    const matchRuntime = { match: inProgress, hasGameStarted: true, elapsedSeconds: 12 };
    expect(getExternalLinkConflict(session({ screen: 'MATCH', matchRuntime }), ALLOWED, NOW)).toBe('match-in-progress');
  });

  it('protects the end screen of a linked match whose result can still be sent', () => {
    expect(getExternalLinkConflict(session({ screen: 'STATS', currentMatch: finishedMatch, externalMatch }), ALLOWED, NOW))
      .toBe('unsent-result');
  });

  it('does not protect an end screen without sendable linked result', () => {
    expect(getExternalLinkConflict(session({ screen: 'STATS', currentMatch: finishedMatch }), ALLOWED, NOW)).toBeNull();
    expect(getExternalLinkConflict(session({ screen: 'STATS', currentMatch: finishedMatch, externalMatch }), { ...ALLOWED, origins: [] }, NOW)).toBeNull();
    const formerShape = { returnUrl: externalMatch.returnUrl } as unknown as ExternalMatchContext;
    expect(getExternalLinkConflict(session({ screen: 'STATS', currentMatch: finishedMatch, externalMatch: formerShape }), ALLOWED, NOW))
      .toBeNull();
  });

  it('does not protect the end screen of an expired linked match', () => {
    const later = NOW + 13 * 60 * 60 * 1000;
    expect(getExternalLinkConflict(session({ screen: 'STATS', currentMatch: finishedMatch, externalMatch }), ALLOWED, later))
      .toBeNull();
  });

  it('defaults to the current time', () => {
    const fresh = { ...externalMatch, createdAt: Date.now() };
    expect(getExternalLinkConflict(session({ screen: 'STATS', currentMatch: finishedMatch, externalMatch: fresh }), ALLOWED))
      .toBe('unsent-result');
  });

  it('does not protect setup or menu screens', () => {
    expect(getExternalLinkConflict(session({ screen: 'SETUP', currentMatch: inProgress }), ALLOWED, NOW)).toBeNull();
    expect(getExternalLinkConflict(session({ screen: 'CRICKET_STATS', currentMatch: finishedMatch }), ALLOWED, NOW)).toBeNull();
  });
});
