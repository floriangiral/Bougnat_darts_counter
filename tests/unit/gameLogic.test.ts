import { describe, expect, it } from 'vitest';

import { createMatch, formatDuration, getMinDartsForScore, submitTurn, switchStartPlayer } from '../../utils/gameLogic';
import type { GameConfig, Player } from '../../types';

const players: Player[] = [
  { id: 'p1', name: 'Joueur 1', teamId: 'team1' },
  { id: 'p2', name: 'Joueur 2', teamId: 'team2' },
];

const baseConfig: GameConfig = {
  startingScore: 101,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 0,
  legsToWin: 1,
  isDoubles: false,
  initialStartingPlayerIndex: 0,
};

describe('gameLogic', () => {
  it('formats durations in mm:ss and h:mm:ss', () => {
    expect(formatDuration(125)).toBe('02:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('calculates minimum darts according to the checkout rule', () => {
    expect(getMinDartsForScore(50, 'Double')).toBe(1);
    expect(getMinDartsForScore(99, 'Double')).toBe(3);
    expect(getMinDartsForScore(40, 'Open')).toBe(1);
  });

  it('marks a score leaving 1 in double out as bust', () => {
    const match = createMatch(players, { ...baseConfig, startingScore: 41 });
    const nextMatch = submitTurn(match, 40, 3);

    expect(nextMatch.currentLeg.history).toHaveLength(1);
    expect(nextMatch.currentLeg.history[0].isBust).toBe(true);
    expect(nextMatch.currentLeg.scores.team1).toBe(41);
    expect(nextMatch.currentPlayerIndex).toBe(1);
  });

  it('allows switching the starting player only before the first dart', () => {
    const match = createMatch(players, baseConfig);
    const switched = switchStartPlayer(match);

    expect(switched.currentPlayerIndex).toBe(1);
    expect(switched.currentLeg.startingPlayerIndex).toBe(1);

    const afterTurn = submitTurn(match, 60, 3);
    expect(switchStartPlayer(afterTurn)).toBe(afterTurn);
  });

  it('orders doubles from the selected starter in each duo once the starting side is known', () => {
    const doublesPlayers: Player[] = [
      { id: 't1p1', name: 'Joueur 1', teamId: 'team1' },
      { id: 't1p2', name: 'Joueur 2', teamId: 'team1' },
      { id: 't2p1', name: 'Joueur 3', teamId: 'team2' },
      { id: 't2p2', name: 'Joueur 4', teamId: 'team2' },
    ];

    const match = createMatch(doublesPlayers, {
      ...baseConfig,
      isDoubles: true,
      initialStartingTeamId: 'team2',
      teamStarterIds: {
        team1: 't1p2',
        team2: 't2p1',
      },
    });

    expect(match.players.map((player) => player.id)).toEqual(['t2p1', 't1p2', 't2p2', 't1p1']);
    expect(match.currentPlayerIndex).toBe(0);
  });
});
