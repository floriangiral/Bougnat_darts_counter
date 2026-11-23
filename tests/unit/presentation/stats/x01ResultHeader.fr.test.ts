import { describe, expect, it } from 'vitest';
import { createMatch } from '../../../../src/application/scoring/matchLifecycle';
import { presentX01ResultHeader } from '../../../../src/presentation/stats/x01ResultHeader.fr';
import type { GameConfig, Player } from '../../../../types';

const config: GameConfig = {
  startingScore: 501,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  legsToWin: 3,
  setsToWin: 1,
  isDoubles: false,
};

describe('presentX01ResultHeader', () => {
  it('presents both sides with legs won, the winner, rules and duration', () => {
    const players: Player[] = [
      { id: 'alice', name: 'Alice', teamId: 'team1' },
      { id: 'bob', name: 'Bob', teamId: 'team2' },
    ];
    const match = { ...createMatch(players, config), legsWon: { team1: 1, team2: 3 }, duration: 754 };

    expect(presentX01ResultHeader(match, 'team2')).toEqual({
      sides: [
        { id: 'team1', name: 'Alice', count: 1, isWinner: false },
        { id: 'team2', name: 'Bob', count: 3, isWinner: true },
      ],
      unitLabel: 'manches',
      formatLabel: '501 · Sortie double',
      durationLabel: '12:34',
    });
  });

  it('groups doubles by team, counts sets in sets mode and names a non-open check-in', () => {
    const players: Player[] = [
      { id: 'alice', name: 'Alice', teamId: 'team1' },
      { id: 'carol', name: 'Carol', teamId: 'team1' },
      { id: 'bob', name: 'Bob', teamId: 'team2' },
      { id: 'dan', name: 'Dan', teamId: 'team2' },
    ];
    const match = {
      ...createMatch(players, { ...config, isDoubles: true, matchMode: 'SETS', checkIn: 'Master', checkOut: 'Master' }),
      setsWon: { team1: 2, team2: 0 },
    };

    const header = presentX01ResultHeader(match, 'team1');

    expect(header.sides.map(({ name, count }) => [name, count])).toEqual([['Alice / Carol', 2], ['Bob / Dan', 0]]);
    expect(header.unitLabel).toBe('sets');
    expect(header.formatLabel).toBe('501 · Entrée master · Sortie master');
  });
});
