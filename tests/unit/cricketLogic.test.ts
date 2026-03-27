import { describe, expect, it } from 'vitest';

import { checkCricketWin, initCricketState, isNumberClosedGlobally, processCricketHit } from '../../utils/cricketLogic';

const players = [
  { id: 'p1', name: 'Joueur 1', teamId: 'p1' },
  { id: 'p2', name: 'Joueur 2', teamId: 'p2' },
];

describe('cricketLogic', () => {
  it('closes a target and scores surplus marks while opponents are still open', () => {
    const initial = initCricketState(players);
    initial[0].marks[20] = 2;

    const { newStates, pointsScored, isClosedByHit } = processCricketHit(initial, 'p1', 20, 3);

    expect(isClosedByHit).toBe(true);
    expect(newStates[0].marks[20]).toBe(3);
    expect(pointsScored).toBe(40);
    expect(newStates[0].score).toBe(40);
  });

  it('does not score once a number is globally closed', () => {
    const initial = initCricketState(players);
    initial[0].marks[19] = 3;
    initial[1].marks[19] = 3;

    const { newStates, pointsScored } = processCricketHit(initial, 'p1', 19, 3);

    expect(isNumberClosedGlobally(newStates, 19)).toBe(true);
    expect(pointsScored).toBe(0);
    expect(newStates[0].score).toBe(0);
  });

  it('declares a winner only when all numbers are closed and the score leads', () => {
    const initial = initCricketState(players);
    for (const target of [20, 19, 18, 17, 16, 15, 25] as const) {
      initial[0].marks[target] = 3;
      initial[1].marks[target] = target === 25 ? 0 : 3;
    }
    initial[0].score = 40;
    initial[1].score = 20;

    expect(checkCricketWin(initial)).toBe('p1');
  });
});
