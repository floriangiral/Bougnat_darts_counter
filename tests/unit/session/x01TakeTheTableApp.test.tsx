// @vitest-environment jsdom
// Spec 137 « Je prends la gagne » de bout en bout dans l'App : lancement sans question de départ,
// file persistée, conservée par la Revanche et le rechargement, vidée en quittant (AC-03, AC-12, AC-14, AC-18).
import 'fake-indexeddb/auto';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../../../App';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { PersistedAppSession } from '../../../src/shared';
import type { GameConfig, MatchState, Player } from '../../../types';
import { APP_SESSION_STORAGE_KEY } from '../../../utils/appPersistence';

vi.mock('../../../src/presentation/stats/x01ResultImage.fr', () => ({
  createX01ResultImage: vi.fn(),
}));

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};

const finishedMatch = (): MatchState => {
  const match = createMatch(players, config);
  return {
    ...match,
    status: 'finished',
    matchWinnerId: 'team1',
    legsWon: { team1: 1, team2: 0 },
    currentLeg: { ...match.currentLeg, winnerId: 'team1', scores: { team1: 0, team2: 140 } },
  };
};

const storeStatsSession = (queue: string[]) => {
  const match = finishedMatch();
  const session: PersistedAppSession = {
    schemaVersion: 2,
    savedAt: Date.now(),
    screen: 'STATS',
    selectedGameType: 'X01',
    currentMatch: match,
    matchWinner: 'team1',
    arenaPrefillPlayers: [],
    cricketResults: null,
    triathlonData: null,
    capitalResults: [],
    matchRuntime: null,
    x01ChallengerQueue: queue,
  };
  window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
};

const settle = async () => {
  await act(async () => {
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
};

const renderApp = async () => {
  render(<App />);
  await settle();
};

const readPersisted = () => JSON.parse(window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? 'null') as PersistedAppSession;

beforeEach(() => {
  vi.stubGlobal('__APP_SEMVER__', '2.2.0');
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App — Je prends la gagne (spec 137)', () => {
  it('lance le challenger de la file sans question de départ, garde la file au rechargement et la vide en quittant', async () => {
    storeStatsSession(['Léa', 'Max']);
    await renderApp();

    fireEvent.click(screen.getByTestId('stats-take-the-table'));
    const field = screen.getByRole('textbox', { name: 'Challenger' });
    expect((field as HTMLInputElement).value).toBe('Léa');
    expect(screen.getByTestId('x01-challenger-next').textContent).toBe('Prochain : Max');
    fireEvent.keyDown(field, { key: 'Enter' });
    // Le chargement de l'écran de match puis son premier instantané : deux écritures différées.
    await settle();
    await settle();

    expect(screen.queryByTestId('starting-player-overlay')).toBeNull();
    expect(screen.queryByTestId('throw-order-overlay')).toBeNull();
    let persisted = readPersisted();
    expect(persisted.screen).toBe('MATCH');
    expect(persisted.x01ChallengerQueue).toEqual(['Max']);
    expect(persisted.matchRuntime?.hasGameStarted).toBe(true);
    expect(persisted.matchRuntime?.match.players.map((player) => player.name)).toEqual(['Léa', 'Anne']);
    expect(persisted.matchRuntime?.match.currentPlayerIndex).toBe(0);

    // Rechargement avant la première fléchette (AC-14).
    cleanup();
    await renderApp();
    expect(screen.queryByTestId('starting-player-overlay')).toBeNull();
    expect(readPersisted().x01ChallengerQueue).toEqual(['Max']);

    fireEvent.click(screen.getByRole('button', { name: /Quitter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }));
    await settle();
    persisted = readPersisted();
    expect(persisted.screen).toBe('GAME_SELECTION');
    expect(persisted.x01ChallengerQueue).toEqual([]);
  });

  it('conserve la file après une Revanche, qui repose la question de départ (AC-12, AC-18)', async () => {
    storeStatsSession(['Léa']);
    await renderApp();

    fireEvent.click(screen.getByTestId('stats-rematch'));
    await settle();

    expect(screen.getByTestId('starting-player-overlay')).toBeTruthy();
    expect(readPersisted().x01ChallengerQueue).toEqual(['Léa']);
  });

  it('vide la file par Sortie (P7)', async () => {
    storeStatsSession(['Léa']);
    await renderApp();

    fireEvent.click(screen.getByTestId('stats-home'));
    await settle();

    expect(readPersisted().x01ChallengerQueue).toEqual([]);
  });
});
