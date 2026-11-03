import { describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../src/application/scoring/matchLifecycle';
import { createTriathlonScorecard } from '../../src/domain/triathlon';
import {
  buildScoresFromScorecards, buildTriathlonCompetitors, createInitialTriathlonFlowState,
  finalizeTriathlonResults, getAttemptValue, INITIAL_STARTER_DRAW_MESSAGE,
  rebuildScorecards, triathlonFlowReducer,
} from '../../src/features/triathlon/triathlonFlow';
import type { BullAttempt, CricketMatchSummary, GameConfig, Player } from '../../types';

const players: Player[] = [
  { id: 'alice', name: 'Alice', teamId: 'team1' },
  { id: 'bob', name: 'Bob', teamId: 'team2' },
  { id: 'carol', name: 'Carol', teamId: 'team1' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double',
  matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};
const cricket: CricketMatchSummary = {
  competitors: [], legsWon: {}, setsWon: {}, currentSetLegsWon: {},
  winnerId: 'alice', config, isDoubles: false, memberNamesByCompetitor: {},
};

describe('triathlon flow', () => {
  it('builds independent individual competitors and deduplicated teams in encounter order', () => {
    const individuals = buildTriathlonCompetitors(players, false);
    expect(individuals).toEqual(players.map((player) => ({ ...player, teamId: player.id })));
    expect(individuals[0]).not.toBe(players[0]);
    expect(buildTriathlonCompetitors(players, true)).toEqual([
      { id: 'team1', name: 'Equipe 1', teamId: 'team1' },
      { id: 'team2', name: 'Equipe 2', teamId: 'team2' },
    ]);
    expect(buildTriathlonCompetitors([], true)).toEqual([]);
    expect(players[0].teamId).toBe('team1');
  });

  it.each<[BullAttempt | undefined, number]>([
    ['DOUBLE_BULL', 50], ['BULL', 25], ['MISS', 0], [undefined, 0],
  ] as const)('values the starter attempt %s at %s', (attempt, expected) => {
    expect(getAttemptValue(attempt)).toBe(expected);
  });

  it('advances all events without losing prior results or mutating earlier snapshots', () => {
    const initial = createInitialTriathlonFlowState();
    expect(initial).toMatchObject({
      phase: 'STARTING_DRAW', starterDrawAttempts: {}, results: {},
      startingCompetitorId: null, starterDrawMessage: INITIAL_STARTER_DRAW_MESSAGE,
    });
    const competitors = buildTriathlonCompetitors(players, false);
    const attempts = { alice: 'BULL' as const };
    let state = triathlonFlowReducer(initial, { type: 'starter_attempts_updated', attempts });
    expect(state.starterDrawMessage).toBe(INITIAL_STARTER_DRAW_MESSAGE);
    state = triathlonFlowReducer(state, { type: 'starter_attempts_updated', attempts, message: 'Egalite' });
    expect(state.starterDrawMessage).toBe('Egalite');
    state = triathlonFlowReducer(state, { type: 'starter_resolved', starterId: 'alice', attempts, triathlonCompetitors: competitors });
    expect(state.phase).toBe('CAPITAL');
    expect(state.startingCompetitorId).toBe('alice');
    expect(state.results.startingBull).toEqual({ attempts, starterId: 'alice', triathlonCompetitors: competitors });
    const scorecards = [createTriathlonScorecard('alice', 'Alice')];
    state = triathlonFlowReducer(state, { type: 'set_scorecards', scorecards });
    expect(state.scorecards).toBe(scorecards);
    state = triathlonFlowReducer(state, { type: 'capital_finished', capital: [], triathlonCompetitors: competitors, scorecards });
    expect(state.phase).toBe('TRANSITION_CRICKET');
    expect(state.results.capital).toEqual([]);
    state = triathlonFlowReducer(state, { type: 'advance_phase', phase: 'CRICKET' });
    expect(state.phase).toBe('CRICKET');
    state = triathlonFlowReducer(state, { type: 'cricket_finished', cricket, triathlonCompetitors: competitors, scorecards });
    expect(state.phase).toBe('TRANSITION_X01');
    expect(state.results.cricket).toBe(cricket);
    state = triathlonFlowReducer(state, { type: 'advance_phase', phase: 'X01' });
    const x01 = createMatch(players, config);
    state = triathlonFlowReducer(state, { type: 'x01_finished', x01, triathlonCompetitors: competitors, scorecards, requiresTieBreak: false });
    expect(state.phase).toBe('X01');
    const beforeTieBreak = state;
    state = triathlonFlowReducer(state, { type: 'x01_finished', x01, triathlonCompetitors: competitors, scorecards, requiresTieBreak: true });
    expect(state.phase).toBe('TIE_BREAK_X01');
    state = triathlonFlowReducer(state, { type: 'tiebreak_finished', tieBreakMatch: x01, tieBreakWinnerId: 'bob', triathlonCompetitors: competitors });
    expect(state.results).toMatchObject({
      capital: [], cricket, x01, tieBreakMatch: x01, tieBreakWinnerId: 'bob',
    });
    expect(initial.results).toEqual({});
    expect(beforeTieBreak.results.tieBreakWinnerId).toBeUndefined();
  });

  it('waits for a tie-break then emits complete final results with the chosen winner', () => {
    const scorecards = [
      { ...createTriathlonScorecard('alice', 'Alice'), totalScore: 80 },
      { ...createTriathlonScorecard('bob', 'Bob'), totalScore: 80 },
    ];
    const finish = vi.fn();
    expect(finalizeTriathlonResults({}, scorecards, players, finish)).toBe(false);
    expect(finish).not.toHaveBeenCalled();
    expect(finalizeTriathlonResults({ tieBreakWinnerId: 'bob' }, scorecards, players, finish)).toBe(true);
    expect(finish).toHaveBeenCalledExactlyOnceWith({ alice: 80, bob: 80 }, {
      tieBreakWinnerId: 'bob', finalWinnerId: 'bob', scorecards, triathlonCompetitors: players,
    });
    expect(buildScoresFromScorecards(scorecards)).toEqual({ alice: 80, bob: 80 });
  });

  it('finishes unequal or empty scorecards without a tie-break', () => {
    const finish = vi.fn();
    const scorecards = [
      { ...createTriathlonScorecard('alice', 'Alice'), totalScore: 20 },
      { ...createTriathlonScorecard('bob', 'Bob'), totalScore: 40 },
    ];
    expect(finalizeTriathlonResults({}, scorecards, players, finish)).toBe(true);
    expect(finish).toHaveBeenLastCalledWith({ alice: 20, bob: 40 }, expect.objectContaining({ finalWinnerId: 'bob' }));
    expect(finalizeTriathlonResults({}, [], [], finish)).toBe(true);
    expect(finish).toHaveBeenLastCalledWith({}, expect.objectContaining({ finalWinnerId: null }));
  });

  it('rebuilds scorecards from available events and leaves unplayed events empty', () => {
    const competitors = buildTriathlonCompetitors(players, false);
    const empty = rebuildScorecards(competitors, players, false, {});
    expect(empty.every((card) => card.totalScore === 0)).toBe(true);
    const cards = rebuildScorecards(competitors, players, false, { capital: [], cricket, x01: createMatch(players, config) });
    expect(cards).toHaveLength(3);
    expect(cards.every((card) => card.capital.basePoints === 20 && card.cricket.basePoints === 20)).toBe(true);
    expect(cards.every((card) => card.x01.basePoints === 14)).toBe(true);
    expect(empty.every((card) => card.totalScore === 0)).toBe(true);
  });
});
