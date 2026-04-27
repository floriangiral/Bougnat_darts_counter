import { describe, expect, it } from 'vitest';

import {
  assignKillerTarget,
  createKillerState,
  recordKillerDart,
} from '../../src/domain/killer/killer';
import type { Player } from '../../types';

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
  { id: 'p3', name: 'Carla', teamId: 'p3' },
];

const assignedState = () => {
  let state = createKillerState(players);
  state = assignKillerTarget(state, 'p1', 20);
  state = assignKillerTarget(state, 'p2', 18);
  return assignKillerTarget(state, 'p3', 16);
};

describe('killer domain', () => {
  it('rejects invalid player counts', () => {
    expect(() => createKillerState([players[0]])).toThrow('2 a 6');
    expect(() => createKillerState([...players, ...players, players[0]])).toThrow('2 a 6');
  });

  it('assigns unique targets before playing', () => {
    let state = createKillerState(players);
    state = assignKillerTarget(state, 'p1', 20);
    state = assignKillerTarget(state, 'p2', 20);

    expect(state.players[0].target).toBe(20);
    expect(state.players[1].target).toBeNull();
    expect(state.phase).toBe('ASSIGN_TARGETS');

    state = assignKillerTarget(state, 'p2', 18);
    state = assignKillerTarget(state, 'p3', 16);

    expect(state.phase).toBe('PLAYING');
  });

  it('requires killer status before damaging an opponent', () => {
    let state = assignedState();
    state = recordKillerDart(state, { type: 'DOUBLE_HIT', targetPlayerId: 'p2' });

    expect(state.players.find((player) => player.id === 'p2')?.lives).toBe(3);
  });

  it('turns a player into a killer on their own double', () => {
    let state = assignedState();
    state = recordKillerDart(state, { type: 'DOUBLE_HIT', targetPlayerId: 'p1' });

    expect(state.players.find((player) => player.id === 'p1')?.isKiller).toBe(true);
    expect(state.players.find((player) => player.id === 'p1')?.lives).toBe(3);
  });

  it('lets killers remove lives and finish when one survivor remains', () => {
    let state = {
      ...assignedState(),
      players: assignedState().players.map((player) => ({
        ...player,
        isKiller: player.id === 'p1',
        lives: player.id === 'p1' ? 3 : 1,
      })),
    };

    state = recordKillerDart(state, { type: 'DOUBLE_HIT', targetPlayerId: 'p2' });
    state = recordKillerDart(state, { type: 'DOUBLE_HIT', targetPlayerId: 'p3' });

    expect(state.phase).toBe('FINISHED');
    expect(state.winnerId).toBe('p1');
  });
});
