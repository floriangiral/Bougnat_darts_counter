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
  getCricketFinalRanking,
  getCricketPlacementPrompt,
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

// Spec 136 : places jouées en Cricket simple à 3 ou 4 joueurs.
describe('cricketGameReducer — places jouées (spec 136)', () => {
  const NAMES = ['Alice', 'Bruno', 'Chloé', 'Damien'];
  const ALL_CLOSED = { 20: 3, 19: 3, 18: 3, 17: 3, 16: 3, 15: 3, 25: 3 };
  const BULL_TO_CLOSE = { ...ALL_CLOSED, 25: 2 };

  type Board = Record<string, { marks?: Record<number, number>; score?: number }>;

  const placementsStart = (count: number, board: Board = {}, roundsLimit = 20, playPlacements = true): CricketGameState => {
    const solo: Player[] = NAMES.slice(0, count).map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));
    const state = createInitialCricketGameState({
      competitors: buildCricketCompetitors(solo, false),
      rotation: { orderedPlayers: solo, currentThrowerIdx: 0, startingCompetitorId: 'p1' },
      hasGameStarted: true,
      isDoubles: false,
      roundsLimit,
      playPlacements,
    });
    const applyBoard = (entries: CricketPlayerState[]) => entries.map((entry) => ({
      ...entry,
      score: board[entry.id]?.score ?? entry.score,
      marks: { ...entry.marks, ...board[entry.id]?.marks },
    }));
    return { ...state, states: applyBoard(state.states), aggregateStats: applyBoard(state.aggregateStats) };
  };
  const bull = (state: CricketGameState) => cricketGameReducer(state, { type: 'hit', target: 25, multiplier: 1 });
  const ranking = (state: CricketGameState) => getCricketFinalRanking(state).map(({ competitor, rank, played }) => [competitor.id, rank, played]);

  it('applique l’ordre de passage complet au départ, colonnes comprises, et refuse un ordre incomplet', () => {
    const waiting = { ...placementsStart(3), hasGameStarted: false };
    const chosen = ['p3', 'p1', 'p2'];
    const orderedPlayers = chosen.map((id) => waiting.orderedPlayers.find((player) => player.id === id) as Player);
    const started = cricketGameReducer(waiting, { type: 'start', orderedPlayers, currentThrowerIdx: 0, startingCompetitorId: 'p3', competitorOrder: chosen });
    expect(started.states.map((entry) => entry.id)).toEqual(chosen);
    expect(started.aggregateStats.map((entry) => entry.id)).toEqual(chosen);
    expect(getCricketCurrentCompetitorId(cricketGameReducer(started, { type: 'misses', count: 3 }))).toBe('p1');
    expect(() => cricketGameReducer(waiting, { type: 'start', orderedPlayers, currentThrowerIdx: 0, startingCompetitorId: 'p3', competitorOrder: ['p3', 'p1'] })).toThrow();
  });

  it('propose la 2e place à 3 joueurs, saute le classé puis termine automatiquement après la 2e place', () => {
    let state = bull(placementsStart(3, { p1: { marks: BULL_TO_CLOSE }, p3: { marks: BULL_TO_CLOSE } }));
    expect(state).toMatchObject({ awaitingPlacementChoice: true, placedIds: ['p1'], winnerId: 'p1', isFinished: false });
    expect(getCricketPlacementPrompt(state)).toEqual({ title: 'Alice gagne la partie !', playLabel: 'Jouer la 2e place' });
    expect(cricketGameReducer(state, { type: 'hit', target: 20, multiplier: 1 })).toBe(state);
    expect(cricketGameReducer(state, { type: 'misses', count: 1 })).toBe(state);

    state = cricketGameReducer(state, { type: 'play_next_place' });
    expect(state.awaitingPlacementChoice).toBe(false);
    expect(getCricketPlacementPrompt(state)).toBeNull();
    expect(getCricketCurrentCompetitorId(state)).toBe('p2');
    expect(state.turnDartsThrown).toBe(0);

    const throwers: string[] = [];
    for (let visit = 0; visit < 3; visit += 1) {
      throwers.push(getCricketCurrentCompetitorId(state));
      state = cricketGameReducer(state, { type: 'misses', count: 3 });
    }
    expect(throwers).toEqual(['p2', 'p3', 'p2']);

    state = bull(state);
    expect(state).toMatchObject({ isFinished: true, placedIds: ['p1', 'p3'], winnerId: 'p1', awaitingPlacementChoice: false });
    expect(ranking(state)).toEqual([['p1', 1, true], ['p3', 2, true], ['p2', 3, false]]);
  });

  it('classe les non classés avec ex æquo quand on termine la partie', () => {
    let state = bull(placementsStart(4, { p1: { marks: BULL_TO_CLOSE, score: 60 }, p2: { score: 40 }, p3: { score: 40 } }));
    state = cricketGameReducer(state, { type: 'finish_placements' });
    expect(state).toMatchObject({ isFinished: true, awaitingPlacementChoice: false, winnerId: 'p1' });
    expect(ranking(state)).toEqual([['p1', 1, true], ['p2', 2, false], ['p3', 2, false], ['p4', 4, false]]);
  });

  it('à 4 joueurs, propose la 3e place puis classe automatiquement le dernier', () => {
    let state = bull(placementsStart(4, { p1: { marks: BULL_TO_CLOSE }, p2: { marks: BULL_TO_CLOSE }, p3: { marks: BULL_TO_CLOSE } }));
    state = bull(cricketGameReducer(state, { type: 'play_next_place' }));
    expect(getCricketPlacementPrompt(state)).toEqual({ title: 'Bruno termine 2e', playLabel: 'Jouer la 3e place' });
    state = bull(cricketGameReducer(state, { type: 'play_next_place' }));
    expect(state).toMatchObject({ isFinished: true, placedIds: ['p1', 'p2', 'p3'], winnerId: 'p1' });
    expect(ranking(state).at(-1)).toEqual(['p4', 4, false]);
  });

  it('attribue aussitôt la place suivante à un joueur qui avait déjà tout fermé', () => {
    let state = bull(placementsStart(3, { p1: { marks: BULL_TO_CLOSE, score: 20 }, p2: { marks: ALL_CLOSED } }));
    expect(state.placedIds).toEqual(['p1']);
    state = cricketGameReducer(state, { type: 'play_next_place' });
    expect(state).toMatchObject({ isFinished: true, placedIds: ['p1', 'p2'] });
  });

  it('termine quand tous les non classés atteignent la limite de tours', () => {
    let state = bull(placementsStart(3, { p1: { marks: BULL_TO_CLOSE } }, 1));
    state = cricketGameReducer(state, { type: 'play_next_place' });
    state = cricketGameReducer(state, { type: 'misses', count: 3 });
    expect(state.isFinished).toBe(false);
    state = cricketGameReducer(state, { type: 'misses', count: 3 });
    expect(state).toMatchObject({ isFinished: true, winnerId: 'p1', placedIds: ['p1'] });
  });

  it('annule depuis la fenêtre de choix jusqu’avant la fléchette gagnante', () => {
    const before = placementsStart(3, { p1: { marks: BULL_TO_CLOSE } });
    const awaiting = bull(before);
    const undone = cricketGameReducer(awaiting, { type: 'undo' });
    expect(undone).toMatchObject({ awaitingPlacementChoice: false, placedIds: [], winnerId: null, isFinished: false });
    expect(undone.states[0].marks[25]).toBe(2);
    expect(getCricketCurrentCompetitorId(undone)).toBe('p1');

    const resumed = cricketGameReducer(awaiting, { type: 'play_next_place' });
    const afterMiss = cricketGameReducer(resumed, { type: 'misses', count: 1 });
    expect(cricketGameReducer(afterMiss, { type: 'undo' })).toMatchObject({ awaitingPlacementChoice: false, placedIds: ['p1'], winnerId: 'p1' });
  });

  it('laisse le duel inchangé et ignore les actions de places hors fenêtre', () => {
    const duel = bull(placementsStart(2, { p1: { marks: BULL_TO_CLOSE } }));
    expect(duel).toMatchObject({ isFinished: true, winnerId: 'p1' });
    expect(duel.playPlacements).toBeUndefined();
    expect(duel.placedIds).toBeUndefined();

    const trio = placementsStart(3);
    expect(cricketGameReducer(trio, { type: 'play_next_place' })).toBe(trio);
    expect(cricketGameReducer(trio, { type: 'finish_placements' })).toBe(trio);

    const withoutPlacements = bull(placementsStart(3, { p1: { marks: BULL_TO_CLOSE } }, 20, false));
    expect(withoutPlacements).toMatchObject({ isFinished: true, winnerId: 'p1' });
    expect(withoutPlacements.awaitingPlacementChoice).toBeUndefined();
  });
});
