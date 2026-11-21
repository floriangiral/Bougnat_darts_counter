import { describe, expect, it } from 'vitest';

import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import { rankX01Competitors } from '../../../src/application/scoring/x01Ranking';
import { formatX01RankLabel, presentX01Ranking } from '../../../src/presentation/stats/x01RankingPresenter.fr';
import type { GameConfig, MatchState, Player } from '../../../types';

const group: Player[] = ['Alice', 'Bob', 'Carol', 'Dave'].map((name, index) => ({
  id: `p${index + 1}`, name, teamId: `p${index + 1}`,
}));
const config: GameConfig = {
  startingScore: 101, checkIn: 'Open', checkOut: 'Open', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 2, isDoubles: false, initialStartingPlayerIndex: 0,
};

const play = (match: MatchState, scores: number[]) => scores.reduce((current, score) => submitTurn(current, score, 3), match);
const order = (match: MatchState) => rankX01Competitors(match).map((entry) => [entry.competitorId, entry.rank]);

describe('X01 ranking (spec 052, RM-03)', () => {
  it('ranks the match winner first, then legs won, then the lowest remainder of the last leg', () => {
    // Manche 1 (Alice ouvre) : Carol ; manche 2 (Bob ouvre) : Alice ; manche 3 (Carol ouvre) : Alice, Bob n'a pas lancé.
    const match = play(createMatch(group, config), [20, 20, 101, 20, 20, 20, 101, 20, 40, 101]);
    expect(match).toMatchObject({ status: 'finished', matchWinnerId: 'p1' });
    expect(rankX01Competitors(match)).toEqual([
      { competitorId: 'p1', rank: 1, isTied: false, isMatchWinner: true, setsWon: 0, legsWon: 2, lastLegRemaining: 0 },
      { competitorId: 'p3', rank: 2, isTied: false, isMatchWinner: false, setsWon: 0, legsWon: 1, lastLegRemaining: 81 },
      { competitorId: 'p4', rank: 3, isTied: false, isMatchWinner: false, setsWon: 0, legsWon: 0, lastLegRemaining: 61 },
      { competitorId: 'p2', rank: 4, isTied: false, isMatchWinner: false, setsWon: 0, legsWon: 0, lastLegRemaining: 101 },
    ]);
  });

  it('shares a rank between competitors equal on every criterion and keeps the play order', () => {
    const match = play(createMatch(group, { ...config, legsToWin: 1 }), [50, 50, 50, 50, 51]);
    expect(match.matchWinnerId).toBe('p1');
    expect(order(match)).toEqual([['p1', 1], ['p2', 2], ['p3', 2], ['p4', 2]]);
    expect(rankX01Competitors(match).map((entry) => entry.isTied)).toEqual([false, true, true, true]);
  });

  it('counts sets before legs over the whole match in sets mode', () => {
    const three = group.slice(0, 3);
    const setsConfig: GameConfig = { ...config, matchMode: 'SETS', setsToWin: 2, legsToWin: 1 };
    // Set 1 : Bob gagne ; set 2 : Carol gagne ; set 3 : Bob gagne le match.
    let match = play(createMatch(three, setsConfig), [0, 101]);
    match = play(match, [0, 101]);
    expect(match.setsWon).toEqual({ p1: 0, p2: 1, p3: 1 });
    match = play(match, [0, 0, 101]);
    expect(match).toMatchObject({ status: 'finished', matchWinnerId: 'p2' });
    expect(rankX01Competitors(match).map(({ competitorId, setsWon, legsWon }) => [competitorId, setsWon, legsWon]))
      .toEqual([['p2', 2, 2], ['p3', 1, 1], ['p1', 0, 0]]);
  });

  it('ranks an unfinished match from its current leg and falls back to the starting score', () => {
    const match = play(createMatch(group.slice(0, 3), config), [30]);
    const scores = { p1: match.currentLeg.scores.p1, p2: match.currentLeg.scores.p2 };
    expect(order({ ...match, currentLeg: { ...match.currentLeg, scores } })).toEqual([['p1', 1], ['p2', 2], ['p3', 2]]);
  });

  it('presents ranks, names and details in French', () => {
    const match = play(createMatch(group.slice(0, 3), { ...config, legsToWin: 1 }), [50, 60, 60, 51]);
    expect(presentX01Ranking(match)).toEqual([
      { competitorId: 'p1', rank: 1, rankLabel: '1er', name: 'Alice', isMatchWinner: true, detail: '1 manche · reste 0' },
      { competitorId: 'p2', rank: 2, rankLabel: '2e ex aequo', name: 'Bob', isMatchWinner: false, detail: '0 manche · reste 41' },
      { competitorId: 'p3', rank: 2, rankLabel: '2e ex aequo', name: 'Carol', isMatchWinner: false, detail: '0 manche · reste 41' },
    ]);
    const sets = play(createMatch(group.slice(0, 3), { ...config, matchMode: 'SETS', setsToWin: 1, legsToWin: 2 }), [101, 0, 0, 101]);
    expect(presentX01Ranking(sets)[0].detail).toBe('1 set · 2 manches · reste 0');
    expect(formatX01RankLabel(4, false)).toBe('4e');
  });
});
