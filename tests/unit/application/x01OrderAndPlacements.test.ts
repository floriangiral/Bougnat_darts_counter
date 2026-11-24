import { describe, expect, it } from 'vitest';

import {
  canPlayForNextPlace,
  createMatch,
  getBullOffTeamIds,
  isLegVisitLimitReached,
  isPlacementRoundActive,
  requiresThrowOrder,
  resolveLegByBullOff,
  resolveMatchOrder,
  startPlacementRound,
  submitBustTurn,
  submitTurn,
} from '../../../src/application/scoring/matchLifecycle';
import { calculateDetailedStatsForTeam } from '../../../src/application/scoring/matchStats';
import { rankX01Competitors } from '../../../src/application/scoring/x01Ranking';
import { getPlacementPrompt } from '../../../src/features/x01/scoring/matchPlacement';
import { isMatchState } from '../../../src/features/x01/session/x01RuntimeValidation';
import { presentX01Ranking } from '../../../src/presentation/stats/x01RankingPresenter.fr';
import { buildX01ShareContent } from '../../../src/presentation/stats/x01ShareText.fr';
import type { GameConfig, MatchState, Player } from '../../../types';

// Spec ref: specs/132-counter-x01-order-and-placements
const group: Player[] = ['Alice', 'Bob', 'Carol', 'Dave'].map((name, index) => ({
  id: `p${index + 1}`, name, teamId: `p${index + 1}`,
}));
const config: GameConfig = {
  startingScore: 101, checkIn: 'Open', checkOut: 'Open', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
};

const play = (match: MatchState, scores: number[]) => scores.reduce((current, score) => submitTurn(current, score, 3), match);
const thrower = (match: MatchState) => match.players[match.currentPlayerIndex].id;

/** Ordre Carol, Alice, Dave, Bob ; Carol gagne le match d'entrée. */
const wonByCarol = () => play(resolveMatchOrder(createMatch(group, config), ['p3', 'p1', 'p4', 'p2']), [101]);

describe('X01 throw order (spec 132, RM-01 to RM-03)', () => {
  it('requires an order only for 3 or 4 sides in singles', () => {
    expect(requiresThrowOrder(createMatch(group.slice(0, 2), config))).toBe(false);
    expect(requiresThrowOrder(createMatch(group.slice(0, 3), config))).toBe(true);
    const doubles = group.map((player, index) => ({ ...player, teamId: index < 2 ? 'team1' : 'team2' }));
    expect(requiresThrowOrder(createMatch(doubles, { ...config, isDoubles: true }))).toBe(false);
  });

  it('reorders the players so that #1 starts, and only with an exact permutation before any throw', () => {
    const match = resolveMatchOrder(createMatch(group, config), ['p3', 'p1', 'p4', 'p2']);
    expect(match.players.map((player) => player.id)).toEqual(['p3', 'p1', 'p4', 'p2']);
    expect(thrower(match)).toBe('p3');
    expect(resolveMatchOrder(createMatch(group, config), ['p3', 'p1', 'p1', 'p2']).players[0].id).toBe('p1');
    expect(resolveMatchOrder(createMatch(group, config), ['p3', 'p1']).players[0].id).toBe('p1');
    const started = play(createMatch(group, config), [20]);
    expect(resolveMatchOrder(started, ['p3', 'p1', 'p4', 'p2'])).toBe(started);
  });

  it('keeps the continuous order across sets: the leg after #2 is opened by #3', () => {
    const three = group.slice(0, 3);
    let match = createMatch(three, { ...config, matchMode: 'SETS', setsToWin: 2, legsToWin: 2 });
    match = play(match, [101]);
    expect(thrower(match)).toBe('p2');
    match = play(match, [0, 0, 101]);
    expect(match.setsWon.p1).toBe(1);
    expect(thrower(match)).toBe('p3');
  });
});

describe('X01 played places (spec 132, RM-04 to RM-08)', () => {
  it('plays the next places in the current leg, skips placed sides and places the last one automatically', () => {
    const won = wonByCarol();
    expect(won).toMatchObject({ status: 'finished', matchWinnerId: 'p3' });
    expect(canPlayForNextPlace(won)).toBe(true);
    expect(getPlacementPrompt(won)).toEqual({ title: 'Carol gagne le match !', playLabel: 'Jouer la 2e place', nextRank: 2 });

    let match = startPlacementRound(won);
    expect(isPlacementRoundActive(match)).toBe(true);
    expect(thrower(match)).toBe('p1');
    match = play(match, [0, 101]);
    expect(match).toMatchObject({ status: 'finished', matchWinnerId: 'p3', placement: { finishedTeamIds: ['p3', 'p4'] } });
    expect(match.legsWon).toEqual(won.legsWon);
    expect(getPlacementPrompt(match)?.title).toBe('Dave termine 2e');

    match = startPlacementRound(match);
    expect(thrower(match)).toBe('p2');
    match = submitBustTurn(match);
    match = play(match, [101]);
    expect(match).toMatchObject({ status: 'finished', placement: { finishedTeamIds: ['p3', 'p4', 'p1', 'p2'] } });
    expect(canPlayForNextPlace(match)).toBe(false);
    expect(getPlacementPrompt(match)).toBeNull();
    expect(isMatchState(JSON.parse(JSON.stringify(match)))).toBe(true);

    expect(rankX01Competitors(match).map((entry) => [entry.competitorId, entry.rank, entry.isPlayedPlace]))
      .toEqual([['p3', 1, true], ['p4', 2, true], ['p1', 3, true], ['p2', 4, true]]);
  });

  it('counts placement visits in the stats without crediting a leg', () => {
    const match = play(startPlacementRound(wonByCarol()), [0, 101]);
    const dave = calculateDetailedStatsForTeam(match, 'p4');
    expect(dave.highestCheckout).toBe(101);
    expect(calculateDetailedStatsForTeam(match, 'p3').highestCheckout).toBe(101);
    expect(calculateDetailedStatsForTeam(match, 'p1').threeDartAverage).toBe(0);
    expect(match.legsWon.p4 ?? 0).toBe(0);
  });

  it('ranks the remaining sides after the played places and labels them in French', () => {
    const match = play(startPlacementRound(wonByCarol()), [20, 101]);
    expect(match.placement?.finishedTeamIds).toEqual(['p3', 'p4']);
    const presented = presentX01Ranking(match);
    expect(presented.map((entry) => [entry.name, entry.rankLabel])).toEqual([
      ['Carol', '1er'], ['Dave', '2e'], ['Alice', '3e'], ['Bob', '4e'],
    ]);
    expect(presented[1].detail).toMatch(/^place jouée · /);
    expect(presented[2].detail).toMatch(/^calculé · /);
    expect(buildX01ShareContent(match, 'p3').text).toContain('Classement : 1er Carol, 2e Dave, 3e Alice, 4e Bob');
  });

  it('rejects an inconsistent placement in a restored session', () => {
    const match = play(startPlacementRound(wonByCarol()), [0, 101]);
    expect(isMatchState({ ...match, placement: { finishedTeamIds: ['p4', 'p3'] } })).toBe(false);
    expect(isMatchState({ ...match, placement: { finishedTeamIds: ['p3', 'p3'] } })).toBe(false);
    expect(isMatchState({ ...match, placement: { finishedTeamIds: ['p3', 'zz'] } })).toBe(false);
    expect(isMatchState({ ...match, placement: { finishedTeamIds: [] } })).toBe(false);
  });

  it('applies the visit limit to a place: bull-off between unplaced sides only, the chosen one takes the place', () => {
    const limited = { ...config, maxVisitsPerLeg: 2 };
    const won = play(resolveMatchOrder(createMatch(group, limited), ['p3', 'p1', 'p4', 'p2']), [20, 20, 20, 20, 81]);
    expect(won).toMatchObject({ status: 'finished', matchWinnerId: 'p3' });

    let match = startPlacementRound(won);
    match = play(match, [10, 10]);
    expect(isLegVisitLimitReached(match)).toBe(false);
    match = play(match, [10]);
    expect(isLegVisitLimitReached(match)).toBe(true);
    expect(getBullOffTeamIds(match)).toEqual(['p1', 'p4', 'p2']);
    expect(submitTurn(match, 81, 3)).toBe(match);
    expect(resolveLegByBullOff(match, 'p3')).toBe(match);

    const placed = resolveLegByBullOff(match, 'p2');
    expect(placed).toMatchObject({ status: 'finished', placement: { finishedTeamIds: ['p3', 'p2'] } });
    expect(placed.legsWon).toEqual(won.legsWon);

    const third = startPlacementRound(placed);
    expect(isLegVisitLimitReached(third)).toBe(true);
    expect(getBullOffTeamIds(third)).toEqual(['p1', 'p4']);
    expect(resolveLegByBullOff(third, 'p4').placement?.finishedTeamIds).toEqual(['p3', 'p2', 'p4', 'p1']);
  });
});
