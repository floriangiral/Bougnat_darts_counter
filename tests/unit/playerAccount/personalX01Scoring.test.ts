import { describe, expect, it } from 'vitest';

import type { GameConfig, Player } from '../../../types';
import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import { buildPersonalX01MatchPayload } from '../../../src/application/scoring/personalX01Scoring';

const players: Player[] = [
  { id: 'p1', name: 'Moi', teamId: 'team1' },
  { id: 'p2', name: 'Alice', teamId: 'team2' },
];

const config: GameConfig = {
  startingScore: 501,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 1,
  legsToWin: 1,
  isDoubles: false,
  initialStartingPlayerIndex: 0,
};

describe('personal X01 scoring payload', () => {
  it('calcule la moyenne 3 flechettes et les compteurs 180/140+/100+', () => {
    let match = createMatch(players, config);
    match = submitTurn(match, 180, 3);
    match = submitTurn(match, 26, 3);
    match = submitTurn(match, 140, 3);
    match = submitTurn(match, 45, 3);
    match = submitTurn(match, 100, 3);
    match = submitTurn(match, 41, 3);
    match = submitTurn(match, 81, 3);
    match = { ...match, duration: 300 };

    const payload = buildPersonalX01MatchPayload(match, { completedAt: '2026-05-29T10:00:00.000Z' });

    expect(payload.client_match_id).toBe(match.id);
    expect(payload.game_mode).toBe('x01');
    expect(payload.opponent.name).toBe('Alice');
    expect(payload.result).toBe('win');
    expect(payload.stats).toMatchObject({
      match_average: 125.25,
      count_180: 1,
      count_140_plus: 1,
      count_100_plus: 1,
      best_checkout: 81,
      checkout_rate: 100,
    });
    expect(payload.turns[0]).toMatchObject({
      visit_index: 1,
      participant: 'player',
      points_scored: 180,
      remaining_points: 321,
      dart_summary: 'T20 / T20 / T20',
    });
  });

  it('calcule le checkout_rate apres tentative ratee', () => {
    let match = createMatch(players, { ...config, startingScore: 40 });
    match = submitTurn(match, 41, 3);
    match = submitTurn(match, 40, 2);
    match = { ...match, duration: 40 };

    const payload = buildPersonalX01MatchPayload(match, { completedAt: '2026-05-29T10:00:00.000Z' });

    expect(payload.result).toBe('loss');
    expect(payload.stats.checkout_rate).toBe(0);
    expect(payload.turns[0]).toMatchObject({
      checkout_attempt: true,
      points_scored: 0,
      remaining_points: 40,
    });
  });

  it('declare le participant cible quand le joueur est lie a un compte backend', () => {
    const match = createMatch(players, config);

    const payload = buildPersonalX01MatchPayload(match, {
      completedAt: '2026-05-29T10:00:00.000Z',
      participantKey: 'p2',
      targetPlayerId: 'player_alice',
      playerTeamId: 'team2',
    });

    expect(payload).toMatchObject({
      client_match_id: match.id,
      participant_key: 'p2',
      target_player_id: 'player_alice',
      confirmation_policy: 'player_confirmation_required',
      game_mode: 'x01',
      opponent: { name: 'Moi' },
    });
  });
});
