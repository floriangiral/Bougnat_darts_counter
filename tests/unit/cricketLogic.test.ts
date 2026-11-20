import { describe, expect, it } from 'vitest';

import {
  checkCricketWin,
  haveAllPlayersReachedCricketRoundLimit,
  initCricketState,
  isNumberClosedGlobally,
  processCricketHit,
  resolveCricketWinnerOnRounds,
} from '../../utils/cricketLogic';

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

  it('detects when every player reached the round limit', () => {
    const initial = initCricketState(players);
    initial[0].dartsThrown = 30;
    initial[1].dartsThrown = 30;

    expect(haveAllPlayersReachedCricketRoundLimit(initial, 10)).toBe(true);
  });

  it('resolves the winner on round limit using score then closures', () => {
    const initial = initCricketState(players);
    initial[0].score = 45;
    initial[1].score = 45;
    initial[0].marks[20] = 3;
    initial[0].marks[19] = 3;
    initial[1].marks[20] = 3;

    expect(resolveCricketWinnerOnRounds(initial)).toBe('p1');
  });

  it('declares a tie on round limit when score, closures and marks are equal, whatever the names', () => {
    const tied = initCricketState([
      { id: 'zoe', name: 'Zoé', teamId: 'zoe' },
      { id: 'anne', name: 'Anne', teamId: 'anne' },
    ]);
    for (const state of tied) {
      state.score = 40;
      state.marks[20] = 5;
      state.marks[19] = 2;
    }

    expect(resolveCricketWinnerOnRounds(tied)).toBeNull();
    expect(resolveCricketWinnerOnRounds([...tied].reverse())).toBeNull();
  });

  it('breaks a round-limit tie on capped marks before declaring a tie', () => {
    const initial = initCricketState(players);
    initial[0].marks[20] = 3;
    initial[0].marks[19] = 1;
    initial[1].marks[20] = 3;
    initial[1].marks[18] = 2;

    expect(resolveCricketWinnerOnRounds(initial)).toBe('p2');
  });

  it('keeps a winner on round limit when only the trailing players are tied', () => {
    const three = initCricketState([
      { id: 'zoe', name: 'Zoé', teamId: 'zoe' },
      { id: 'anne', name: 'Anne', teamId: 'anne' },
      { id: 'bea', name: 'Béa', teamId: 'bea' },
    ]);
    three[0].score = 60;
    three[1].score = 20;
    three[2].score = 20;

    expect(resolveCricketWinnerOnRounds(three)).toBe('zoe');
  });

  it('declares a tie on round limit when the two leaders of three players are equal', () => {
    const three = initCricketState([
      { id: 'zoe', name: 'Zoé', teamId: 'zoe' },
      { id: 'anne', name: 'Anne', teamId: 'anne' },
      { id: 'bea', name: 'Béa', teamId: 'bea' },
    ]);
    three[0].score = 60;
    three[1].score = 60;
    three[2].score = 20;

    expect(resolveCricketWinnerOnRounds(three)).toBeNull();
  });
});
