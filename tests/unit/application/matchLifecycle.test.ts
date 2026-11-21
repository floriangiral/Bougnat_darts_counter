import { describe, expect, it } from 'vitest';

import type { GameConfig, MatchState, Player } from '../../../types';
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

  it.each<[GameConfig['checkOut'], number, number, boolean]>([
    ['Double', 4, 3, true],
    ['Master', 4, 3, true],
    ['Open', 4, 3, false],
    ['Double', 180, 180, true],
    ['Double', 159, 159, true],
    ['Double', 170, 170, false],
    ['Master', 180, 180, false],
    ['Open', 1, 1, false],
  ])('applies the %s checkout rule from %s with a visit of %s (bust=%s)', (checkOut, startingScore, score, isBust) => {
    const result = submitTurn(createMatch(players, { ...baseConfig, checkOut, startingScore }), score, 3);
    const remaining = startingScore - score;

    expect(result.currentLeg.history[0]).toMatchObject({ isBust, score: isBust ? 0 : score });
    expect(result.status).toBe(!isBust && remaining === 0 ? 'finished' : 'active');
    expect(result.currentLeg.scores.team1).toBe(isBust ? startingScore : remaining);
  });

  // Spec 052 (AC-02) : ordre des visites et rotation du premier lanceur à 3 et 4 joueurs.
  it.each([3, 4])('keeps the visit order and rotates the leg opener with %i singles players over two legs', (count) => {
    const group: Player[] = Array.from({ length: count }, (_, index) => ({ id: `p${index + 1}`, name: `J${index + 1}`, teamId: `p${index + 1}` }));
    const config: GameConfig = { ...baseConfig, checkOut: 'Open', legsToWin: 2, initialStartingPlayerIndex: count - 1 };
    const playLegWonByOpener = (start: MatchState) => {
      let match = start;
      for (let visit = 0; visit < count; visit += 1) match = submitTurn(match, 60, 3);
      return submitTurn(match, 41, 3);
    };

    const first = createMatch(group, config);
    expect(first.currentPlayerIndex).toBe(count - 1);
    const afterFirstLeg = playLegWonByOpener(first);
    const firstLeg = afterFirstLeg.completedLegs[0];
    const expectedFirstOrder = Array.from({ length: count + 1 }, (_, visit) => `p${((count - 1 + visit) % count) + 1}`);
    expect(firstLeg.history.map((turn) => turn.playerId)).toEqual(expectedFirstOrder);
    expect(firstLeg.winnerId).toBe(`p${count}`);
    expect(afterFirstLeg.currentLeg.startingPlayerIndex).toBe(0);
    expect(afterFirstLeg.currentPlayerIndex).toBe(0);

    const afterSecondLeg = playLegWonByOpener(afterFirstLeg);
    expect(afterSecondLeg.status).toBe('active');
    expect(afterSecondLeg.completedLegs[1].history.map((turn) => turn.playerId))
      .toEqual(Array.from({ length: count + 1 }, (_, visit) => `p${(visit % count) + 1}`));
    expect(afterSecondLeg.legsWon).toMatchObject({ p1: 1, [`p${count}`]: 1 });
    expect(afterSecondLeg.currentLeg.startingPlayerIndex).toBe(1);
  });
});
