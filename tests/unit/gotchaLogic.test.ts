import { describe, expect, it } from 'vitest';

import {
  createGotchaState,
  recordGotchaTurn,
} from '../../src/domain/gotcha/gotcha';
import type { Player } from '../../types';

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
  { id: 'p3', name: 'Carla', teamId: 'p3' },
];

describe('gotcha domain', () => {
  it('rejects invalid player counts and target score', () => {
    expect(() => createGotchaState([players[0]])).toThrow('2 à 6');
    expect(() => createGotchaState([...players, ...players, players[0]])).toThrow('2 à 6');
    expect(() => createGotchaState(players, 0)).toThrow('positif');
  });

  it('adds valid visits to the current player score', () => {
    let state = createGotchaState(players, 301);
    state = recordGotchaTurn(state, 60);

    expect(state.players[0].score).toBe(60);
    expect(state.currentPlayerIndex).toBe(1);
  });

  it('keeps score unchanged on bust', () => {
    let state = createGotchaState(players, 100);
    state = recordGotchaTurn(state, 80);
    state = recordGotchaTurn(state, 0);
    state = recordGotchaTurn(state, 0);
    state = recordGotchaTurn(state, 25);

    expect(state.players[0].score).toBe(80);
    expect(state.players[0].history.at(-1)?.isBust).toBe(true);
  });

  it('resets opponents with the same score after a valid gotcha', () => {
    let state = createGotchaState(players, 301);
    state = recordGotchaTurn(state, 35);
    state = recordGotchaTurn(state, 35);

    expect(state.players[0].score).toBe(0);
    expect(state.players[1].score).toBe(35);
    expect(state.players[1].history.at(-1)?.gotchaVictimIds).toEqual(['p1']);
  });

  it('finishes on the exact target without requiring a double', () => {
    let state = createGotchaState(players, 100);
    state = recordGotchaTurn(state, 100);

    expect(state.winnerId).toBe('p1');
    expect(state.players[0].score).toBe(100);
  });

  // Spec ref: specs/054-counter-impossible-totals-validation (AC-01, AC-03).
  it.each([163, 166, 169, 172, 173, 175, 176, 178, 179])(
    'refuses the unreachable visit %i without changing scores or the current player',
    (points) => {
      const state = createGotchaState(players, 301);
      const next = recordGotchaTurn(state, points);

      expect(next.players).toEqual(state.players);
      expect(next.currentPlayerIndex).toBe(0);
      expect(next.turnNumber).toBe(1);
      expect(next.log[0]).toBe('Visite refusée : score impossible en 3 fléchettes.');
    },
  );

  it('refuses an unreachable visit even when it would hit the exact target', () => {
    const next = recordGotchaTurn(createGotchaState(players, 179), 179);

    expect(next.winnerId).toBeNull();
    expect(next.players[0].score).toBe(0);
  });

  it.each([0, 1, 174, 177, 180])('accepts the reachable visit %i', (points) => {
    const next = recordGotchaTurn(createGotchaState(players, 301), points);

    expect(next.players[0].score).toBe(points);
    expect(next.currentPlayerIndex).toBe(1);
  });
});
