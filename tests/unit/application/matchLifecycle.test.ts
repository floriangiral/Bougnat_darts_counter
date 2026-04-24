import { describe, expect, it } from 'vitest';

import type { GameConfig, Player } from '../../../types';
import {
  buildDoublesRotation,
  createMatch,
  formatDuration,
  resolveMatchStart,
  submitTurn,
  switchStartPlayer,
  undoTurn,
} from '../../../src/application/scoring/matchLifecycle';

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

describe('match lifecycle', () => {
  it('formats durations consistently', () => {
    expect(formatDuration(125)).toBe('02:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('builds the doubles rotation from the selected starters', () => {
    const doublesPlayers: Player[] = [
      { id: 't1p1', name: 'Joueur 1', teamId: 'team1' },
      { id: 't1p2', name: 'Joueur 2', teamId: 'team1' },
      { id: 't2p1', name: 'Joueur 3', teamId: 'team2' },
      { id: 't2p2', name: 'Joueur 4', teamId: 'team2' },
    ];

    expect(buildDoublesRotation(doublesPlayers, { team1: 't1p2', team2: 't2p1' }, 'team2').map((player) => player.id))
      .toEqual(['t2p1', 't1p2', 't2p2', 't1p1']);
  });

  it('keeps turn flow helpers consistent across turns and undo', () => {
    const match = createMatch(players, baseConfig);
    const switched = switchStartPlayer(match);
    const nextMatch = submitTurn(switched, 60, 3);
    const undone = undoTurn(nextMatch);

    expect(switched.currentPlayerIndex).toBe(1);
    expect(nextMatch.currentPlayerIndex).toBe(0);
    expect(undone.currentLeg.history).toHaveLength(0);
  });

  it('resolves the chosen starter before the first dart', () => {
    const match = createMatch(players, baseConfig);
    const resolved = resolveMatchStart(match, '1');

    expect(resolved.currentPlayerIndex).toBe(1);
    expect(resolved.currentLeg.startingPlayerIndex).toBe(1);
  });
});
