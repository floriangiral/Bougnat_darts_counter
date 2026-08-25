import { describe, expect, it } from 'vitest';

import { capitalGameReducer, createInitialCapitalGameState, isCapitalGameOver, sortCapitalResults } from '../../src/features/capital/capitalGameModel';
import type { CapitalDart, Player } from '../../types';

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
];

describe('capitalGameModel', () => {
  it('captures a snapshot before adding a dart and resolves the round', () => {
    let state = createInitialCapitalGameState(players, 0);

    state = capitalGameReducer(state, { type: 'add_dart', dart: { value: 20, multiplier: 1 } });

    expect(state.history).toHaveLength(1);
    expect(state.pendingResolution?.playerId).toBe('p1');

    state = capitalGameReducer(state, { type: 'resolve_round' });

    expect(state.states[0].score).toBe(20);
    expect(state.states[0].targetIndex).toBe(1);
    expect(state.currentPlayerIdx).toBe(1);
  });

  it('sorts results and detects game completion', () => {
    const finished = [
      { id: 'p1', name: 'Alice', score: 140, targetIndex: 17, history: [] },
      { id: 'p2', name: 'Bob', score: 120, targetIndex: 17, history: [] },
    ];

    expect(isCapitalGameOver(finished)).toBe(true);
    expect(sortCapitalResults(finished).map((entry) => entry.id)).toEqual(['p1', 'p2']);
  });

  it('guards resolved rounds, full turns, missing players, rotation, and undo', () => {
    let state = createInitialCapitalGameState(players, 0);
    state = {
      ...state,
      states: state.states.map((player) => ({ ...player, targetIndex: 1 })),
    };
    expect(capitalGameReducer(state, { type: 'resolve_round' })).toEqual(state);

    state = capitalGameReducer(state, { type: 'add_dart', dart: { value: 20, multiplier: 1 } });
    state = capitalGameReducer(state, { type: 'add_dart', dart: { value: 19, multiplier: 1 } });
    state = capitalGameReducer(state, { type: 'add_dart', dart: { value: 18, multiplier: 1 } });
    const resolved = capitalGameReducer(state, { type: 'resolve_round' });
    expect(resolved.pendingResolution).toBeNull();

    const fullTurn = capitalGameReducer(state, { type: 'add_dart', dart: { value: 20, multiplier: 1 } });
    expect(fullTurn).toEqual(state);

    const rotated = capitalGameReducer(state, { type: 'sync_rotation', orderedPlayers: [...players].reverse(), currentPlayerIdx: 1 });
    expect(rotated.orderedPlayers[0].id).toBe('p2');
    expect(capitalGameReducer(rotated, { type: 'set_starter', currentPlayerIdx: 0 }).currentPlayerIdx).toBe(0);

    const missingPlayerState = {
      ...state,
      pendingResolution: { playerId: 'missing', darts: [{ value: 20, multiplier: 1 } as CapitalDart], target: '20' as const },
    };
    expect(capitalGameReducer(missingPlayerState, { type: 'resolve_round' })).toMatchObject({
      currentDarts: [],
      pendingResolution: null,
    });
    expect(capitalGameReducer(createInitialCapitalGameState([], 0), { type: 'add_dart', dart: { value: 20, multiplier: 1 } })).toEqual(
      createInitialCapitalGameState([], 0)
    );
    expect(capitalGameReducer(state, { type: 'undo' }).currentDarts).toEqual([{ value: 20, multiplier: 1 }, { value: 19, multiplier: 1 }]);
  });
});