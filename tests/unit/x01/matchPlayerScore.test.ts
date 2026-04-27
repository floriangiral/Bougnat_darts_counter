import { describe, expect, it } from 'vitest';

import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import { buildPlayerScoreViewModel } from '../../../src/features/x01/scoring/matchPlayerScore';
import type { GameConfig, Player } from '../../../types';

const players: Player[] = [
  { id: 'p1', name: 'Florian', teamId: 'team1' },
  { id: 'p2', name: 'Cyril', teamId: 'team2' },
];

const config: GameConfig = {
  startingScore: 501,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 0,
  legsToWin: 3,
  isDoubles: false,
  initialStartingPlayerIndex: 0,
};

describe('match player score view model', () => {
  it('builds the active player score column from match state', () => {
    const match = createMatch(players, config);
    const viewModel = buildPlayerScoreViewModel(match, 'team1', null);

    expect(viewModel).toMatchObject({
      name: 'Florian',
      showMatchStarterBadge: true,
      isActive: true,
      score: 501,
      legsWon: 0,
      stats: {
        matchAvg: '0.0',
        legAvg: '0.0',
        legDarts: 0,
        lastScore: null,
      },
    });
  });

  it('uses remaining preview score without mutating match state', () => {
    const match = createMatch(players, config);
    const viewModel = buildPlayerScoreViewModel(match, 'team1', { teamId: 'team1', score: 441 });

    expect(viewModel.score).toBe(441);
    expect(match.currentLeg.scores.team1).toBe(501);
  });

  it('computes leg and match stats from team history', () => {
    const afterFirstTurn = submitTurn(createMatch(players, config), 60, 3);
    const viewModel = buildPlayerScoreViewModel(afterFirstTurn, 'team1', null);

    expect(viewModel.stats).toMatchObject({
      matchAvg: '60.0',
      legAvg: '60.0',
      legDarts: 3,
      lastScore: 60,
    });
  });
});
