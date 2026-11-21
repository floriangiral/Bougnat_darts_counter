// Spec ref: specs/130-counter-180-around-the-clock (FR-08) et specs/010-counter-offline-session-recovery-guarantees.
import { describe, expect, it } from 'vitest';

import { parsePersistedAppSession } from '../../../src/app/sessionRecovery';
import { createAtc180State, passAtc180Turn, recordAtc180Dart, type Atc180State } from '../../../src/domain/atc180/atc180';
import { isAtc180State, isGameRuntimeSnapshot, resumeGameRuntime } from '../../../src/features/game-session/gameRuntime';
import { decodeStoredSession, encodeSessionForStorage } from '../../../src/features/game-session/storedSessionCodec';
import { APP_SESSION_SCHEMA_VERSION, type Atc180RuntimeSnapshot, type PersistedAppSession } from '../../../src/shared';

const NOW = 1_800_000_000_000;
const timing = { elapsedSeconds: 30, measuredAt: NOW - 5_000, running: true };

const runtime = (): Atc180RuntimeSnapshot => {
  let state = createAtc180State([{ id: 'anne', name: 'Anne' }, { id: 'zoe', name: 'Zoé' }], 1);
  state = ['TRIPLE', 'SINGLE', 'MISS', 'DOUBLE'].reduce((current, hit) => recordAtc180Dart(current, hit as never), state);
  state = passAtc180Turn(state);
  state = recordAtc180Dart(state, 'TRIPLE');
  return { gameType: 'ATC180', state, hasGameStarted: true, timing };
};

const corrupt = (mutate: (copy: Atc180RuntimeSnapshot) => void): unknown => {
  const copy = JSON.parse(JSON.stringify(runtime())) as Atc180RuntimeSnapshot;
  mutate(copy);
  return copy;
};

const session = (gameRuntime: unknown, overrides: Partial<PersistedAppSession> = {}): Record<string, unknown> => ({
  schemaVersion: APP_SESSION_SCHEMA_VERSION,
  savedAt: NOW - 1_000,
  screen: 'ATC180_GAME',
  selectedGameType: 'ATC180',
  currentMatch: null,
  matchWinner: '',
  arenaPrefillPlayers: [],
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: null,
  gameRuntime,
  ...overrides,
});

describe('180 Around the Clock — instantané de partie', () => {
  it('accepte un instantané réel et reprend son chronomètre jusqu’à la dernière écriture', () => {
    expect(isGameRuntimeSnapshot(runtime())).toBe(true);
    expect(resumeGameRuntime(runtime(), NOW).timing.elapsedSeconds).toBe(35);
  });

  it.each<[string, (copy: Atc180RuntimeSnapshot) => void]>([
    ['début de partie absent', (copy) => { delete (copy as Partial<Atc180RuntimeSnapshot>).hasGameStarted; }],
    ['joueurs invalides', (copy) => { copy.state.players = [{ id: 1 }] as unknown as Atc180State['players']; }],
    ['fléchette inconnue', (copy) => { copy.state.currentDarts = ['BULL'] as unknown as Atc180State['currentDarts']; }],
    ['volée hors de son tour', (copy) => { copy.state.turns[0].round = 3; }],
    ['points falsifiés', (copy) => { copy.state.turns[1].points = 9; }],
    ['volée mal formée', (copy) => { copy.state.turns[0].darts = 'TRIPLE' as unknown as Atc180State['currentDarts']; }],
    ['premier lanceur absent', (copy) => { (copy.state as Partial<Atc180State>).startingPlayerIndex = undefined; }],
    ['cinq joueurs', (copy) => {
      copy.state.players = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id }));
      copy.state.turns = [];
    }],
  ])('refuse un instantané incohérent : %s', (_label, mutate) => {
    expect(isGameRuntimeSnapshot(corrupt(mutate))).toBe(false);
  });

  it('refuse une valeur qui n’est pas un état', () => {
    expect(isAtc180State(null)).toBe(false);
    expect(isAtc180State({ players: [] })).toBe(false);
  });

  it('se stocke tel quel : toutes les volées, donc toute l’annulation, survivent au rechargement', () => {
    const stored = JSON.parse(JSON.stringify(encodeSessionForStorage(session(runtime()) as PersistedAppSession))) as Record<string, unknown>;
    expect(decodeStoredSession(stored).gameRuntime).toEqual(runtime());
  });

  it('restaure une session sur l’écran de jeu, et l’écarte si l’état relu est incohérent', () => {
    const restored = parsePersistedAppSession(session(runtime()), NOW);
    expect(restored).toMatchObject({ status: 'restored', session: { screen: 'ATC180_GAME', gameRuntime: runtime() } });

    const tampered = parsePersistedAppSession(session(corrupt((copy) => { copy.state.turns[0].playerId = 'anne'; })), NOW);
    expect(tampered).toEqual({ status: 'discarded', reason: 'gameRuntime' });
  });

  it('ignore l’instantané d’un autre jeu que celui sélectionné', () => {
    const restored = parsePersistedAppSession(session(runtime(), { selectedGameType: 'X01', screen: 'HOME' }), NOW);
    expect(restored).toMatchObject({ status: 'restored', session: { gameRuntime: null } });
  });
});
