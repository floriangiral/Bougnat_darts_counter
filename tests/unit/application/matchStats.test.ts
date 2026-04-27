import { describe, expect, it } from 'vitest';

import type { GameConfig, Player } from '../../../types';
import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import {
  calculateDetailedStats,
  calculateDetailedStatsForTeam,
  getMinDartsForScore,
} from '../../../src/application/scoring/matchStats';

const players: Player[] = [
  { id: 'p1', name: 'Joueur 1', teamId: 'team1' },
  { id: 'p2', name: 'Joueur 2', teamId: 'team2' },
];

const baseConfig: GameConfig = {
  startingScore: 60,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 0,
  legsToWin: 1,
  isDoubles: false,
  initialStartingPlayerIndex: 0,
};

describe('match stats', () => {
  it('estimates the minimum darts needed by checkout rule', () => {
    expect(getMinDartsForScore(50, 'Double')).toBe(1);
    expect(getMinDartsForScore(99, 'Double')).toBe(3);
    expect(getMinDartsForScore(40, 'Open')).toBe(1);
  });

  it('computes detailed stats for a completed leg', () => {
    const match = createMatch(players, baseConfig);
    const finishedMatch = submitTurn(match, 60, 3);

    expect(calculateDetailedStats(finishedMatch, 'p1')).toMatchObject({
      threeDartAverage: 60,
      firstNineAverage: 60,
      checkoutRate: 100,
      checkoutMade: 1,
      checkoutAttempts: 1,
      highestCheckout: 60,
      highestScore: 60,
    });
  });

  it('computes team stats from the same scoring history', () => {
    const match = createMatch(players, baseConfig);
    const finishedMatch = submitTurn(match, 60, 3);

    expect(calculateDetailedStatsForTeam(finishedMatch, 'team1')).toMatchObject({
      threeDartAverage: 60,
      firstNineAverage: 60,
      checkoutRate: 100,
      checkoutMade: 1,
      checkoutAttempts: 1,
      highestCheckout: 60,
      highestScore: 60,
    });
  });
});
