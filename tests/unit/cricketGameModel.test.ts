import { describe, expect, it } from 'vitest';

import {
  advanceCricketTurn,
  appendAggregateCricketHit,
  buildCricketCompetitors,
  buildCricketHistorySnapshot,
  buildCricketMatchSummary,
  createInitialCricketGameState,
  cricketGameReducer,
  type CricketGameState,
  getCricketCurrentCompetitorId,
  initAggregateCricketStats,
} from '../../src/features/cricket/cricketGameModel';
import type { CricketPlayerState, GameConfig, Player } from '../../types';

const players: Player[] = [
  { id: 'a1', name: 'Alice', teamId: 'team1' },
  { id: 'a2', name: 'Ava', teamId: 'team1' },
  { id: 'b1', name: 'Bob', teamId: 'team2' },
  { id: 'b2', name: 'Ben', teamId: 'team2' },
];

const config: GameConfig = {
  startingScore: 501,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 1,
  legsToWin: 1,
  cricketRounds: 20,
  isDoubles: true,
};

describe('cricketGameModel', () => {
  it('builds team competitors and aggregate stats for doubles', () => {
    const competitors = buildCricketCompetitors(players, true);
    expect(competitors).toEqual([
      { id: 'team1', name: 'Équipe 1', memberNames: ['Alice', 'Ava'] },
      { id: 'team2', name: 'Équipe 2', memberNames: ['Bob', 'Ben'] },
    ]);

    const aggregateStats = initAggregateCricketStats(competitors);
    expect(aggregateStats).toHaveLength(2);
    expect(aggregateStats[0].id).toBe('team1');
  });

  it('appends aggregate hits and snapshots without mutating the input states', () => {
    const [competitor] = buildCricketCompetitors(players, false);
    const baseState = initAggregateCricketStats([competitor]);
    const updated = appendAggregateCricketHit(baseState, competitor.id, 20, 3, 60, false);

    expect(baseState[0].score).toBe(0);
    expect(updated[0].score).toBe(60);
    expect(updated[0].marks[20]).toBe(3);

    const snapshot = buildCricketHistorySnapshot(updated, updated, 0, 1, players, null);
    updated[0].history[0].pointsScored = 0;
    expect(snapshot.states[0].history[0].pointsScored).toBe(60);
  });

  it('builds match summaries and advances turn state correctly', () => {
    const competitors: CricketPlayerState[] = initAggregateCricketStats(buildCricketCompetitors(players, true));
    const summary = buildCricketMatchSummary(
      competitors,
      'team1',
      config,
      { team1: ['Alice', 'Ava'], team2: ['Bob', 'Ben'] },
      { team1: 1 },
      {},
      {},
    );

    expect(summary.winnerId).toBe('team1');
    expect(summary.isDoubles).toBe(true);

    expect(advanceCricketTurn(1, 4, 1)).toEqual({
      nextTurnDartsThrown: 2,
      shouldAdvanceThrower: false,
      nextThrowerOffset: 0,
    });
    expect(advanceCricketTurn(2, 4, 1)).toEqual({
      nextTurnDartsThrown: 0,
      shouldAdvanceThrower: true,
      nextThrowerOffset: 1,
    });
  });
});
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-01) — état Cricket sérialisable.
describe('cricketGameReducer', () => {
  const deepFreeze = <T,>(value: T): T => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach((child: unknown) => {
        deepFreeze(child);
      });
      Object.freeze(value);
    }
    return value;
  };
  const doublesStart = (hasGameStarted = true): CricketGameState => createInitialCricketGameState({
    competitors: buildCricketCompetitors(players, true),
    rotation: { orderedPlayers: [players[0], players[2], players[1], players[3]], currentThrowerIdx: 0, startingCompetitorId: 'team1' },
    hasGameStarted,
    isDoubles: true,
    roundsLimit: 10,
  });

  it('enchaîne fléchettes, ratés et annulation sans modifier l’état reçu, et reste sérialisable', () => {
    let state = deepFreeze(doublesStart());
    state = deepFreeze(cricketGameReducer(state, { type: 'hit', target: 20, multiplier: 3 }));
    state = deepFreeze(cricketGameReducer(state, { type: 'misses', count: 5 }));

    expect(state.states.find((entry) => entry.id === 'team1')?.marks[20]).toBe(3);
    expect(state.states.find((entry) => entry.id === 'team1')?.dartsThrown).toBe(3);
    expect(state.currentThrowerIdx).toBe(1);
    expect(state.turnDartsThrown).toBe(0);
    expect(state.history).toHaveLength(2);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);

    const undone = cricketGameReducer(state, { type: 'undo' });
    expect(undone.currentThrowerIdx).toBe(0);
    expect(undone.turnDartsThrown).toBe(1);
    expect(undone.history).toHaveLength(1);
  });

  it('refuse toute fléchette avant le choix du premier lanceur, puis fige la rotation au départ', () => {
    const waiting = doublesStart(false);
    expect(cricketGameReducer(waiting, { type: 'hit', target: 20, multiplier: 1 })).toBe(waiting);
    expect(cricketGameReducer(waiting, { type: 'misses', count: 1 })).toBe(waiting);
    expect(cricketGameReducer(waiting, { type: 'undo' })).toBe(waiting);

    const rotation = { orderedPlayers: [players[2], players[0], players[3], players[1]], currentThrowerIdx: 0, startingCompetitorId: 'team2' };
    const synced = cricketGameReducer(waiting, { type: 'sync_rotation', ...rotation });
    expect(synced.startingCompetitorId).toBe('team2');
    const started = cricketGameReducer(synced, { type: 'start', ...rotation });
    expect(started.hasGameStarted).toBe(true);
    expect(cricketGameReducer(started, { type: 'sync_rotation', ...rotation, startingCompetitorId: 'team1' })).toBe(started);
  });

  it('fait jouer 4 joueurs en simple chacun leur tour et désigne le vainqueur parmi les 4', () => {
    const solo: Player[] = ['Alice', 'Bruno', 'Chloé', 'Damien'].map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));
    let state = createInitialCricketGameState({
      competitors: buildCricketCompetitors(solo, false),
      rotation: { orderedPlayers: solo, currentThrowerIdx: 2, startingCompetitorId: 'p3' },
      hasGameStarted: true,
      isDoubles: false,
      roundsLimit: 20,
    });
    expect(state.states).toHaveLength(4);

    const throwers: string[] = [];
    for (let visit = 0; visit < 5; visit += 1) {
      throwers.push(getCricketCurrentCompetitorId(state));
      state = cricketGameReducer(state, { type: 'misses', count: 3 });
    }
    expect(throwers).toEqual(['p3', 'p4', 'p1', 'p2', 'p3']);

    // p3 (au tir) ferme les 7 cibles pendant que les autres ratent : il gagne avec 0 point partout.
    for (const target of [20, 19, 18, 17, 16, 15, 25] as const) {
      while (getCricketCurrentCompetitorId(state) !== 'p3') {
        state = cricketGameReducer(state, { type: 'misses', count: 1 });
      }
      state = cricketGameReducer(state, { type: 'hit', target, multiplier: target === 25 ? 2 : 3 });
      if (target === 25 && !state.isFinished) {
        state = cricketGameReducer(state, { type: 'hit', target, multiplier: 1 });
      }
    }
    expect(state.isFinished).toBe(true);
    expect(state.winnerId).toBe('p3');
  });

  it('termine à la limite de tours, refuse ensuite toute fléchette et rouvre la partie par annulation', () => {
    let state = doublesStart();
    for (let visit = 0; visit < 20; visit += 1) {
      state = cricketGameReducer(state, { type: 'misses', count: 3 });
    }
    expect(state.isFinished).toBe(true);
    expect(state.winnerId).toBeNull();
    expect(cricketGameReducer(state, { type: 'hit', target: 20, multiplier: 1 })).toBe(state);

    const reopened = cricketGameReducer(state, { type: 'undo' });
    expect(reopened.isFinished).toBe(false);
  });
});
