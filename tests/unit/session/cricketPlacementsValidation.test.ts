import { describe, expect, it } from 'vitest';

import {
  buildCricketCompetitors,
  createInitialCricketGameState,
  cricketGameReducer,
  type CricketGameState,
} from '../../../src/features/cricket/cricketGameModel';
import { isCricketGameState } from '../../../src/features/game-session/gameRuntime';
import type { Player } from '../../../types';

// Spec 136 (RM-C7) : la reprise de session restaure les places jouées et la fenêtre de choix.
describe('isCricketGameState — places jouées (spec 136)', () => {
  const solo: Player[] = ['Alice', 'Bruno', 'Chloé'].map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));

  const awaitingState = (): CricketGameState => {
    const initial = createInitialCricketGameState({
      competitors: buildCricketCompetitors(solo, false),
      rotation: { orderedPlayers: solo, currentThrowerIdx: 0, startingCompetitorId: 'p1' },
      hasGameStarted: true,
      isDoubles: false,
      roundsLimit: 20,
      playPlacements: true,
    });
    const closeAllButBull = (entry: CricketGameState['states'][number]) => ({ ...entry, marks: { 20: 3, 19: 3, 18: 3, 17: 3, 16: 3, 15: 3, 25: 2 } });
    const ready = { ...initial, states: initial.states.map((entry, index) => (index === 0 ? closeAllButBull(entry) : entry)) };
    return JSON.parse(JSON.stringify(cricketGameReducer(ready, { type: 'hit', target: 25, multiplier: 1 }))) as CricketGameState;
  };

  it('accepte un état en attente du choix de la place suivante', () => {
    const state = awaitingState();
    expect(state).toMatchObject({ playPlacements: true, placedIds: ['p1'], awaitingPlacementChoice: true });
    expect(isCricketGameState(state)).toBe(true);
  });

  it('refuse des places inconnues, en double ou mal typées, y compris dans l’historique', () => {
    const state = awaitingState();
    expect(isCricketGameState({ ...state, placedIds: ['inconnu'] })).toBe(false);
    expect(isCricketGameState({ ...state, placedIds: ['p1', 'p1'] })).toBe(false);
    expect(isCricketGameState({ ...state, placedIds: [], awaitingPlacementChoice: true })).toBe(false);
    expect(isCricketGameState({ ...state, awaitingPlacementChoice: 'oui' })).toBe(false);
    expect(isCricketGameState({ ...state, playPlacements: 1 })).toBe(false);
    expect(isCricketGameState({ ...state, history: [{ ...state.history[0], placedIds: ['inconnu'] }] })).toBe(false);
  });
});
