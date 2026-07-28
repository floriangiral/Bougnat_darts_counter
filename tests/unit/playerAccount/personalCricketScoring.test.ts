import { describe, expect, it } from 'vitest';

import { buildPersonalCricketMatchPayload } from '../../../src/application/scoring/personalCricketScoring';
import type { CricketMatchSummary } from '../../../types';

describe('personalCricketScoring', () => {
  it('construit un payload Cricket sans champs X01 et avec client_match_id stable', () => {
    const payload = buildPersonalCricketMatchPayload(buildSummary());

    expect(payload.client_match_id).toBe('stable-cricket-id');
    expect(payload.game_mode).toBe('cricket');
    expect(payload.variant).toBe('standard');
    expect(payload.stats.cricket.match_mpr).toBe(6);
    expect(payload.stats.cricket.total_marks).toBe(6);
    expect(payload.stats.cricket.darts_thrown).toBe(3);
    expect(payload.turns[0]).toMatchObject({
      participant: 'player',
      dart_count: 3,
      points_scored: 20,
      cricket: {
        marks_scored: 6,
        points_scored: 20,
        segment_hits: {
          '20': 3,
          '19': 1,
          bull: 2,
        },
      },
    });
    expect(payload).not.toHaveProperty('target');
    expect(payload.stats).not.toHaveProperty('checkout_rate');
    expect(payload.stats).not.toHaveProperty('best_checkout');
    expect(payload.stats).not.toHaveProperty('match_average');
  });
});

function buildSummary(): CricketMatchSummary {
  return {
    clientMatchId: 'stable-cricket-id',
    startedAt: '2026-05-29T13:00:00.000Z',
    completedAt: '2026-05-29T13:20:00.000Z',
    durationSec: 1200,
    winnerId: 'player-1',
    isDoubles: false,
    legsWon: { 'player-1': 1 },
    setsWon: {},
    currentSetLegsWon: {},
    memberNamesByCompetitor: {
      'player-1': ['Moi'],
      'player-2': ['Bot'],
    },
    config: {
      startingScore: 501,
      checkIn: 'Open',
      checkOut: 'Double',
      matchMode: 'LEGS',
      setsToWin: 1,
      legsToWin: 1,
      cricketRounds: 20,
      isDoubles: false,
    },
    competitors: [
      {
        id: 'player-1',
        name: 'Moi',
        score: 20,
        dartsThrown: 3,
        marks: { 20: 3, 19: 1, 18: 0, 17: 0, 16: 0, 15: 0, 25: 2 },
        history: [
          { target: 20, multiplier: 3, isMiss: false, pointsScored: 20 },
          { target: 19, multiplier: 1, isMiss: false, pointsScored: 0 },
          { target: 25, multiplier: 2, isMiss: false, pointsScored: 0 },
        ],
      },
      {
        id: 'player-2',
        name: 'Bot',
        score: 0,
        dartsThrown: 3,
        marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 },
        history: [
          { target: null, multiplier: 1, isMiss: true, pointsScored: 0 },
          { target: null, multiplier: 1, isMiss: true, pointsScored: 0 },
          { target: null, multiplier: 1, isMiss: true, pointsScored: 0 },
        ],
      },
    ],
  };
}
