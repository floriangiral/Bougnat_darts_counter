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

const buildConfig = (overrides: Partial<GameConfig> = {}): GameConfig => ({
  ...baseConfig,
  ...overrides,
});

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

  it('does not count a placement turn from a checkout range as a checkout attempt', () => {
    const match = createMatch(players, buildConfig({ startingScore: 64 }));
    const ongoingMatch = submitTurn(match, 24, 3);

    expect(calculateDetailedStats(ongoingMatch, 'p1')).toMatchObject({
      checkoutRate: 0,
      checkoutMade: 0,
      checkoutAttempts: 0,
      checkoutByDarts: {
        one: { attempts: 0, made: 0 },
        two: { attempts: 0, made: 0 },
        three: { attempts: 0, made: 0 },
      },
    });
  });

  it('counts a bust from a checkout range as a failed checkout attempt', () => {
    const match = createMatch(players, buildConfig({ startingScore: 40 }));
    const ongoingMatch = submitTurn(match, 41, 3);

    expect(calculateDetailedStats(ongoingMatch, 'p1')).toMatchObject({
      checkoutRate: 0,
      checkoutMade: 0,
      checkoutAttempts: 1,
      checkoutByDarts: {
        one: { attempts: 0, made: 0 },
        two: { attempts: 0, made: 0 },
        three: { attempts: 1, made: 0 },
      },
    });
  });

  it('uses the actual darts thrown for checkout attempt buckets', () => {
    const match = createMatch(players, buildConfig({ startingScore: 50 }));
    const finishedMatch = submitTurn(match, 50, 2);

    expect(calculateDetailedStats(finishedMatch, 'p1')).toMatchObject({
      checkoutRate: 100,
      checkoutMade: 1,
      checkoutAttempts: 1,
      checkoutByDarts: {
        one: { attempts: 0, made: 0 },
        two: { attempts: 1, made: 1 },
        three: { attempts: 0, made: 0 },
      },
    });
  });
});
