import { describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { buildExternalReturnUrl } from '../../../src/features/external-match/externalMatchLink';
import type { GameConfig, MatchState, Player } from '../../../types';

// Spec ref: spec:counter/external-match-link (stats=1 never sends NaN or Infinity)
vi.mock('../../../src/application/scoring/matchStats', () => ({
  calculateDetailedStatsForTeam: (_match: MatchState, teamId: string) => ({
    threeDartAverage: teamId === 'p1' ? Number.NaN : Number.POSITIVE_INFINITY,
    scoreCounts: { c180: 0 },
    highestCheckout: 0,
  }),
}));

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false,
};

describe('buildExternalReturnUrl stats formatting', () => {
  it('reports 0.00 for a non finite average', () => {
    const match: MatchState = {
      ...createMatch(players, config),
      currentLeg: { scores: {}, history: [], winnerId: 'p1', startingPlayerIndex: 0 },
      status: 'finished',
      matchWinnerId: 'p1',
    };
    const context = {
      returnUrl: 'https://badarts.fr/m',
      createdAt: Date.now(),
      includeStats: true,
      playerNames: ['Alice', 'Bob'],
      config: { startingScore: 501, checkIn: 'Open' as const, checkOut: 'Double' as const, matchMode: 'LEGS' as const, legsToWin: 1, isDoubles: false },
    };
    const url = new URL(buildExternalReturnUrl(context, match, { origins: ['https://badarts.fr'], allowPrivateNetworkHttp: false }) ?? '');
    expect(url.searchParams.get('avg1')).toBe('0.00');
    expect(url.searchParams.get('avg2')).toBe('0.00');
  });
});
