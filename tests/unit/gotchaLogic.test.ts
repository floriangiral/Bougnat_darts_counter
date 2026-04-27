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
    expect(() => createGotchaState([players[0]])).toThrow('2 a 6');
    expect(() => createGotchaState([...players, ...players, players[0]])).toThrow('2 a 6');
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
});
