import { describe, expect, it } from 'vitest';

import { capitalGameReducer, createInitialCapitalGameState, isCapitalGameOver, sortCapitalResults } from '../../src/features/capital/capitalGameModel';
import type { Player } from '../../types';

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
});