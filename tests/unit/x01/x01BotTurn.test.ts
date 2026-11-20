import { describe, expect, it } from 'vitest';

import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import { buildX01BotTurnResult, generateX01BotTurn, getReachableCheckoutDarts } from '../../../src/application/x01Bot/x01BotTurn';
import { X01_BOT_LEVELS } from '../../../src/domain/x01Bot/x01Bot';
import type { GameConfig, Player } from '../../../types';
import { bruteForceMinDarts } from './checkoutBruteForce';

// Deterministic PRNG (mulberry32) so the simulation is reproducible.
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const players: Player[] = [
  { id: 'p1', name: 'Joueur 1', teamId: 'p1' },
  { id: 'p2', name: 'Robot', teamId: 'p2', isBot: true, botLevel: 'CLUB' },
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

describe('x01 bot turn', () => {
  it('generates a playable non-checkout score inside the remaining score constraints', () => {
    const turn = generateX01BotTurn({
      level: 'AMATEUR',
      remainingScore: 50,
      checkOut: 'Double',
      random: () => 0.99,
    });

    expect(turn.score).toBeGreaterThanOrEqual(0);
    expect(turn.score).toBeLessThanOrEqual(48);
    expect(turn.dartsThrown).toBe(3);
  });

  it('can take a deterministic checkout when the level probability allows it', () => {
    const turn = generateX01BotTurn({
      level: 'PRO',
      remainingScore: 40,
      checkOut: 'Double',
      random: () => 0,
    });

    expect(turn).toEqual({ score: 40, dartsThrown: 1 });
  });

  it('only allows robot checkouts that are reachable under the checkout rule', () => {
    expect(getReachableCheckoutDarts(40, 'Double')).toBe(1);
    expect(getReachableCheckoutDarts(99, 'Double')).toBe(3);
    expect(getReachableCheckoutDarts(169, 'Double')).toBeNull();
    expect(getReachableCheckoutDarts(171, 'Double')).toBeNull();
  });

  it('does not let the bot win from a double-out bogey score', () => {
    const turn = generateX01BotTurn({
      level: 'PRO',
      remainingScore: 169,
      checkOut: 'Double',
      random: () => 0,
    });

    expect(turn.score).toBeLessThan(169);
    expect(turn.dartsThrown).toBe(3);
  });

  it('applies the bot turn to the active bot player', () => {
    const humanTurn = submitTurn(createMatch(players, config), 60, 3);
    const result = buildX01BotTurnResult({
      match: humanTurn,
      level: 'PRO',
      elapsedSeconds: 12,
      random: () => 0.99,
    });

    expect(result.nextMatch.currentLeg.history).toHaveLength(2);
    expect(result.nextMatch.currentLeg.history[1].playerId).toBe('p2');
  });

  it('never finishes a Master-Out leg on the single bull', () => {
    expect(getReachableCheckoutDarts(25, 'Master')).toBe(2);
    expect(getReachableCheckoutDarts(50, 'Master')).toBe(1);
    expect(getReachableCheckoutDarts(60, 'Master')).toBe(1);
  });

  it.each(X01_BOT_LEVELS.map((definition) => definition.level))(
    'finishes every Master-Out leg at level %s without ever leaving 1 (10 000 seeded draws)',
    (level) => {
      const random = seededRandom(20261120);
      let remaining = 501;
      let turnsInLeg = 0;
      let legsFinished = 0;

      for (let draw = 0; draw < 10_000; draw += 1) {
        const turn = generateX01BotTurn({ level, remainingScore: remaining, checkOut: 'Master', random });
        turnsInLeg += 1;
        expect(turn.score).toBeLessThanOrEqual(remaining);

        if (turn.score === remaining) {
          expect(turn.dartsThrown).toBe(bruteForceMinDarts(remaining, 'Master'));
          legsFinished += 1;
          remaining = 501;
          turnsInLeg = 0;
          continue;
        }

        remaining -= turn.score;
        expect(remaining).not.toBe(1);
        expect(turnsInLeg).toBeLessThan(200);
      }

      expect(legsFinished).toBeGreaterThan(0);
    },
  );
});

