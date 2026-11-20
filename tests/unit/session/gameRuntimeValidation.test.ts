// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-03, V2-AC-04).
import { describe, expect, it } from 'vitest';

import { createGotchaState, recordGotchaTurn } from '../../../src/domain/gotcha/gotcha';
import { isGameRuntimeSnapshot, resumeGameRuntime } from '../../../src/features/game-session/gameRuntime';
import type { GameRuntimeSnapshot } from '../../../src/shared';
import type { Player } from '../../../types';

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];
const timing = { elapsedSeconds: 12, measuredAt: 1_000, running: true };

const gotcha = () => {
  const initial = createGotchaState(players, 301, 0);
  const state = recordGotchaTurn(initial, 60);
  return { gameType: 'GOTCHA' as const, state, history: [initial], timing };
};

// Builds a corrupted copy: `mutate` receives a deep clone of a valid snapshot.
const corrupt = <T extends GameRuntimeSnapshot>(snapshot: T, mutate: (copy: T) => void): unknown => {
  const copy = JSON.parse(JSON.stringify(snapshot)) as T;
  mutate(copy);
  return copy;
};
type GotchaSnapshot = ReturnType<typeof gotcha>;

describe('instantané de partie — validation commune', () => {
  it('refuse un type de jeu inconnu, un chrono invalide ou une valeur qui n’est pas un objet', () => {
    expect(isGameRuntimeSnapshot(null)).toBe(false);
    expect(isGameRuntimeSnapshot(corrupt(gotcha(), (copy) => { (copy as { gameType: string }).gameType = 'BOWLING'; }))).toBe(false);
    expect(isGameRuntimeSnapshot(corrupt(gotcha(), (copy) => { copy.timing = { elapsedSeconds: -1, measuredAt: 0, running: true }; }))).toBe(false);
  });

  it('reprend le chrono jusqu’à la dernière écriture', () => {
    expect(resumeGameRuntime(gotcha(), 11_000).timing.elapsedSeconds).toBe(22);
  });
});

describe('Gotcha — validation de l’instantané', () => {
  it('accepte un instantané réel', () => {
    expect(isGameRuntimeSnapshot(gotcha())).toBe(true);
  });

  it.each<[string, (copy: GotchaSnapshot) => void]>([
    ['joueur courant hors bornes', (copy) => { copy.state.currentPlayerIndex = 2; }],
    ['vainqueur inconnu', (copy) => { copy.state.winnerId = 'max'; }],
    ['score au-delà de la cible', (copy) => { copy.state.players[0].score = 400; }],
    ['un seul joueur', (copy) => { copy.state.players = [copy.state.players[0]]; }],
    ['joueurs en double', (copy) => { copy.state.players[1].id = 'anne'; }],
    ['cible nulle', (copy) => { copy.state.targetScore = 0; }],
    ['visite invalide', (copy) => { copy.state.players[0].history[0].gotchaVictimIds = [1] as unknown as string[]; }],
    ['pile d’annulation invalide', (copy) => { copy.history = [{} as GotchaSnapshot['state']]; }],
  ])('refuse : %s', (_label, mutate) => {
    expect(isGameRuntimeSnapshot(corrupt(gotcha(), mutate))).toBe(false);
  });
});
