import { describe, expect, it } from 'vitest';

import {
  advanceCricketTurn,
  appendAggregateCricketHit,
  buildCricketCompetitors,
  buildCricketHistorySnapshot,
  buildCricketMatchSummary,
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
      { id: 'team1', name: 'Equipe 1', memberNames: ['Alice', 'Ava'] },
      { id: 'team2', name: 'Equipe 2', memberNames: ['Bob', 'Ben'] },
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