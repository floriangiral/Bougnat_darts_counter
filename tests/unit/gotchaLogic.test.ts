import { describe, expect, it } from 'vitest';

import {
  createGotchaState,
  recordGotchaTurn,
  type GotchaState,
} from '../../src/domain/gotcha/gotcha';
import { isGameRuntimeSnapshot } from '../../src/features/game-session/gameRuntime';
import {
  confirmGotchaThrowOrder,
  continueGotchaForNextPlace,
  finishGotchaPlacements,
  getGotchaFinalRanking,
  getGotchaPlacedIds,
  isGotchaAwaitingPlacementChoice,
  isGotchaFinished,
  isGotchaOrderPending,
} from '../../src/features/gotcha/gotchaPlacement';
import type { Player } from '../../types';

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
  { id: 'p3', name: 'Carla', teamId: 'p3' },
];

// Spec 136 : au-delà de 2 joueurs, l'ordre de passage est validé avant la première visite.
const startInOrder = (list: Player[], target: number) =>
  confirmGotchaThrowOrder(createGotchaState(list, target), list.map((player) => player.id));

describe('gotcha domain', () => {
  it('rejects invalid player counts and target score', () => {
    expect(() => createGotchaState([players[0]])).toThrow('2 à 6');
    expect(() => createGotchaState([...players, ...players, players[0]])).toThrow('2 à 6');
    expect(() => createGotchaState(players, 0)).toThrow('positif');
  });

  it('adds valid visits to the current player score', () => {
    let state = startInOrder(players, 301);
    state = recordGotchaTurn(state, 60);

    expect(state.players[0].score).toBe(60);
    expect(state.currentPlayerIndex).toBe(1);
  });

  it('keeps score unchanged on bust', () => {
    let state = startInOrder(players, 100);
    state = recordGotchaTurn(state, 80);
    state = recordGotchaTurn(state, 0);
    state = recordGotchaTurn(state, 0);
    state = recordGotchaTurn(state, 25);

    expect(state.players[0].score).toBe(80);
    expect(state.players[0].history.at(-1)?.isBust).toBe(true);
  });

  it('resets opponents with the same score after a valid gotcha', () => {
    let state = startInOrder(players, 301);
    state = recordGotchaTurn(state, 35);
    state = recordGotchaTurn(state, 35);

    expect(state.players[0].score).toBe(0);
    expect(state.players[1].score).toBe(35);
    expect(state.players[1].history.at(-1)?.gotchaVictimIds).toEqual(['p1']);
  });

  it('finishes on the exact target without requiring a double', () => {
    let state = startInOrder(players, 100);
    state = recordGotchaTurn(state, 100);

    expect(state.winnerId).toBe('p1');
    expect(state.players[0].score).toBe(100);
  });

  // Spec ref: specs/054-counter-impossible-totals-validation (AC-01, AC-03).
  it.each([163, 166, 169, 172, 173, 175, 176, 178, 179])(
    'refuses the unreachable visit %i without changing scores or the current player',
    (points) => {
      const state = startInOrder(players, 301);
      const next = recordGotchaTurn(state, points);

      expect(next.players).toEqual(state.players);
      expect(next.currentPlayerIndex).toBe(0);
      expect(next.turnNumber).toBe(1);
      expect(next.log[0]).toBe('Visite refusée : score impossible en 3 fléchettes.');
    },
  );

  it('refuses an unreachable visit even when it would hit the exact target', () => {
    const next = recordGotchaTurn(startInOrder(players, 179), 179);

    expect(next.winnerId).toBeNull();
    expect(next.players[0].score).toBe(0);
  });

  it.each([0, 1, 174, 177, 180])('accepts the reachable visit %i', (points) => {
    const next = recordGotchaTurn(startInOrder(players, 301), points);

    expect(next.players[0].score).toBe(points);
    expect(next.currentPlayerIndex).toBe(1);
  });
});

// Spec 136 : places jouées en Gotcha.
const play = (state: GotchaState, ...visits: number[]) => visits.reduce(recordGotchaTurn, state);
const fourPlayers: Player[] = [...players, { id: 'p4', name: 'Dora', teamId: 'p4' }];
// Partie sauvegardée avant la spec 136 : sans places, statut ni ordre de passage.
const toLegacy = (state: GotchaState): GotchaState => {
  const legacy = { ...state };
  delete legacy.placedIds;
  delete legacy.status;
  delete legacy.orderConfirmed;
  return legacy;
};
const rankingOf = (state: GotchaState) =>
  getGotchaFinalRanking(state).map(({ item, rank, played }) => [item.id, rank, played]);

describe('gotcha — places jouées (spec 136)', () => {
  it('ouvre le choix après le vainqueur et ignore toute saisie tant qu’il est attendu', () => {
    const state = play(startInOrder(players, 100), 100);

    expect(state.winnerId).toBe('p1');
    expect(getGotchaPlacedIds(state)).toEqual(['p1']);
    expect(isGotchaAwaitingPlacementChoice(state)).toBe(true);
    expect(isGotchaFinished(state)).toBe(false);
    expect(recordGotchaTurn(state, 20)).toBe(state);
  });

  it('joue la 2e place en sautant le classé, sans le remettre à zéro, puis classe le dernier automatiquement', () => {
    let state = continueGotchaForNextPlace(play(startInOrder(players, 100), 100));
    expect(state.currentPlayerIndex).toBe(1);

    state = play(state, 50, 40);
    expect(state.currentPlayerIndex).toBe(1);
    state = play(state, 50);
    expect(state.players[0].score).toBe(100);
    expect(state.players.map((player) => player.score)).toEqual([100, 100, 40]);
    expect(state.winnerId).toBe('p1');
    expect(getGotchaPlacedIds(state)).toEqual(['p1', 'p2']);
    expect(isGotchaFinished(state)).toBe(true);
    expect(rankingOf(state)).toEqual([['p1', 1, true], ['p2', 2, true], ['p3', 3, false]]);
  });

  it('termine en classant les non classés au score, ex æquo à score égal', () => {
    let state = startInOrder(fourPlayers, 100);
    state = play(state, 40, 0, 0, 10, 60);
    expect(isGotchaAwaitingPlacementChoice(state)).toBe(true);
    state = finishGotchaPlacements(state);

    expect(isGotchaFinished(state)).toBe(true);
    expect(state.winnerId).toBe('p1');
    expect(rankingOf(state)).toEqual([['p1', 1, true], ['p4', 2, false], ['p2', 3, false], ['p3', 3, false]]);
    expect(continueGotchaForNextPlace(state)).toBe(state);
    expect(finishGotchaPlacements(state)).toBe(state);
  });

  it('garde le duel inchangé : fin immédiate au premier score exact', () => {
    const state = play(createGotchaState(players.slice(0, 2), 100), 100);

    expect(isGotchaFinished(state)).toBe(true);
    expect(isGotchaAwaitingPlacementChoice(state)).toBe(false);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it('considère terminée une partie sauvegardée avant la fonctionnalité', () => {
    const legacy = toLegacy(play(startInOrder(players, 100), 100));

    expect(isGotchaFinished(legacy)).toBe(true);
    expect(getGotchaPlacedIds(legacy)).toEqual(['p1']);
    expect(recordGotchaTurn(legacy, 20)).toBe(legacy);
    expect(isGotchaFinished({ ...legacy, winnerId: null })).toBe(false);
  });

  describe('validation de l’instantané', () => {
    const timing = { elapsedSeconds: 3, measuredAt: 0, running: true };
    const snapshot = (state: GotchaState) => ({ gameType: 'GOTCHA', state, history: [], timing });
    const choosing = play(startInOrder(players, 100), 100);

    it('accepte les places jouées et l’ancien format', () => {
      const legacy = toLegacy(choosing);
      const legacyPlaying = toLegacy(startInOrder(players, 100));
      expect(isGameRuntimeSnapshot(snapshot(choosing))).toBe(true);
      expect(isGameRuntimeSnapshot(snapshot(continueGotchaForNextPlace(choosing)))).toBe(true);
      expect(isGameRuntimeSnapshot(snapshot(legacyPlaying))).toBe(true);
      expect(isGameRuntimeSnapshot(snapshot(finishGotchaPlacements(choosing)))).toBe(true);
      expect(isGameRuntimeSnapshot(snapshot(legacy))).toBe(true);
    });

    it.each<[string, Partial<GotchaState> | Record<string, unknown>]>([
      ['place inconnue', { placedIds: ['p1', 'inconnu'] }],
      ['place en double', { placedIds: ['p1', 'p1'] }],
      ['classé sans la cible', { placedIds: ['p1', 'p2'] }],
      ['places non listées', { placedIds: 'p1' }],
      ['statut inconnu', { status: 'paused' }],
      ['choix sans vainqueur', { winnerId: null }],
      ['vainqueur sans place', { placedIds: [] }],
      ['vainqueur absent des places', { winnerId: 'p2', placedIds: ['p1'] }],
      ['en jeu avec un joueur courant classé', { status: 'playing' }],
    ])('refuse : %s', (_label, patch) => {
      expect(isGameRuntimeSnapshot(snapshot({ ...choosing, ...patch }))).toBe(false);
    });

    it('refuse un état incohérent une fois deux places jouées', () => {
      const twoPlaced = play(continueGotchaForNextPlace(choosing), 100);
      expect(getGotchaPlacedIds(twoPlaced)).toEqual(['p1', 'p2']);
      expect(isGameRuntimeSnapshot(snapshot(twoPlaced))).toBe(true);
      expect(isGameRuntimeSnapshot(snapshot({ ...twoPlaced, status: 'choosing' }))).toBe(false);
      expect(isGameRuntimeSnapshot(snapshot({ ...twoPlaced, winnerId: 'p2' }))).toBe(false);
    });
  });

  describe('ordre de passage (spec 136)', () => {
    it('bloque toute visite au-delà de 2 joueurs tant que l’ordre n’est pas validé', () => {
      const pending = createGotchaState(players, 301);

      expect(isGotchaOrderPending(pending)).toBe(true);
      expect(recordGotchaTurn(pending, 60)).toBe(pending);
      expect(isGotchaOrderPending(createGotchaState(players.slice(0, 2), 301))).toBe(false);
    });

    it('réordonne les joueurs selon l’ordre choisi et le conserve pendant les places', () => {
      let state = confirmGotchaThrowOrder(createGotchaState(players, 100, 2), ['p3', 'p1', 'p2']);

      expect(state.players.map((player) => player.id)).toEqual(['p3', 'p1', 'p2']);
      expect(state.currentPlayerIndex).toBe(0);
      expect(isGotchaOrderPending(state)).toBe(false);
      state = play(state, 100);
      state = continueGotchaForNextPlace(state);
      expect(state.players.map((player) => player.id)).toEqual(['p3', 'p1', 'p2']);
      expect(state.players[state.currentPlayerIndex].id).toBe('p1');
      expect(confirmGotchaThrowOrder(state, ['p1', 'p2', 'p3'])).toBe(state);
    });

    it('refuse un ordre incomplet ou inconnu', () => {
      const pending = createGotchaState(players, 301);
      expect(() => confirmGotchaThrowOrder(pending, ['p1', 'p2'])).toThrow('une seule fois');
      expect(() => confirmGotchaThrowOrder(pending, ['p1', 'p2', 'zz'])).toThrow('inconnu');
    });

    it('valide l’instantané : en attente seulement avant la première visite, absent = déjà validé', () => {
      const timing = { elapsedSeconds: 0, measuredAt: 0, running: false };
      const snapshot = (state: unknown) => ({ gameType: 'GOTCHA', state, history: [], timing });
      const pending = createGotchaState(players, 301);
      const started = play(startInOrder(players, 301), 60);

      expect(isGameRuntimeSnapshot(snapshot(pending))).toBe(true);
      expect(isGameRuntimeSnapshot(snapshot({ ...started, orderConfirmed: undefined }))).toBe(true);
      expect(isGameRuntimeSnapshot(snapshot({ ...started, orderConfirmed: false }))).toBe(false);
      expect(isGameRuntimeSnapshot(snapshot({ ...pending, orderConfirmed: 'non' }))).toBe(false);
      expect(isGameRuntimeSnapshot(snapshot({ ...createGotchaState(players.slice(0, 2), 301), orderConfirmed: false }))).toBe(false);
    });
  });
});
