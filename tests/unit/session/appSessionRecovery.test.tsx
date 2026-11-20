// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (Révision V2 : V2-FR-04, V2-FR-05, V2-AC-04, V2-AC-05).
import 'fake-indexeddb/auto';

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../../../App';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { createGotchaState, recordGotchaTurn } from '../../../src/domain/gotcha/gotcha';
import type { PersistedAppSession } from '../../../src/shared';
import type { GameConfig, Player } from '../../../types';
import { APP_SESSION_STORAGE_KEY } from '../../../utils/appPersistence';

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};

const buildX01Session = (): PersistedAppSession => {
  const base = createMatch(players, config);
  const match = {
    ...base,
    currentPlayerIndex: 1,
    currentLeg: {
      ...base.currentLeg,
      scores: { team1: 441, team2: 501 },
      history: [{ playerId: 'anne', score: 60, isBust: false, remainingAfter: 441, dartsThrown: 3 }],
    },
  };
  return {
    screen: 'MATCH',
    selectedGameType: 'X01',
    currentMatch: match,
    matchWinner: '',
    arenaPrefillPlayers: [],
    cricketResults: null,
    triathlonData: null,
    capitalResults: [],
    matchRuntime: { match, hasGameStarted: true, elapsedSeconds: 42 },
  };
};

const renderApp = async () => {
  render(<App />);
  await act(async () => {
    await vi.dynamicImportSettled();
  });
};

beforeEach(() => {
  vi.stubGlobal('__APP_SEMVER__', '2.0.0');
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('App — reprise de session', () => {
  it('démarre à l’accueil avec un message non bloquant quand la session est corrompue', async () => {
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify({ ...buildX01Session(), screen: 'ARCADE' }));

    await renderApp();

    expect(screen.getByRole('status').textContent).toContain('La partie précédente n’a pas pu être reprise.');
    expect(window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? '').not.toContain('ARCADE');
    expect(screen.getByText('Lancer une partie')).toBeTruthy();
    act(() => {
      screen.getByRole('button', { name: 'OK' }).click();
    });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('reprend une partie X01 de l’ancien format, puis n’écrit plus rien pendant 60 s sans action (V2-AC-05)', async () => {
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(buildX01Session()));
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await renderApp();
    expect(screen.getByText('441')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(setItem.mock.calls.filter(([key]) => key === APP_SESSION_STORAGE_KEY)).toHaveLength(0);
    const persisted = JSON.parse(window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? 'null') as PersistedAppSession;
    expect(persisted.schemaVersion).toBe(2);
    expect(persisted.matchRuntime?.match.currentLeg.scores.team1).toBe(441);
  });

  it('écrit la session immédiatement quand la page passe en arrière-plan', async () => {
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(buildX01Session()));
    await renderApp();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(setItem.mock.calls.filter(([key]) => key === APP_SESSION_STORAGE_KEY)).toHaveLength(1);
  });

  it('conserve le contexte du lien partenaire d’un match X01 repris (spec 030)', async () => {
    const session = buildX01Session();
    const externalMatch = {
      returnUrl: 'https://badarts.fr/retour',
      playerNames: ['Anne', 'Zoé'],
      config: { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, isDoubles: false },
      createdAt: Date.now(),
    };
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify({ ...session, externalMatch }));

    await renderApp();
    expect(screen.getByText('441')).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    const persisted = JSON.parse(window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? 'null') as PersistedAppSession;
    expect(persisted.externalMatch).toEqual(externalMatch);
    expect(persisted.schemaVersion).toBe(2);
  });

  it('reprend une partie Gotcha en cours sur son écran, puis l’efface en quittant la partie', async () => {
    const initial = createGotchaState(players, 301, 0);
    const state = recordGotchaTurn(initial, 60);
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify({
      ...buildX01Session(),
      schemaVersion: 2,
      savedAt: Date.now(),
      screen: 'GOTCHA_GAME',
      selectedGameType: 'GOTCHA',
      matchRuntime: null,
      gameRuntime: { gameType: 'GOTCHA', state, history: [initial], timing: { elapsedSeconds: 65, measuredAt: Date.now(), running: true } },
    }));

    await renderApp();
    expect(screen.getByText('Tour 2')).toBeTruthy();
    expect(screen.getByText('01:05')).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /Quitter/ }).click();
    });
    await act(async () => {
      await vi.dynamicImportSettled();
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    const persisted = JSON.parse(window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? 'null') as PersistedAppSession;
    expect(persisted.screen).toBe('GAME_SELECTION');
    expect(persisted.gameRuntime).toBeNull();
  });
});
