// @vitest-environment jsdom
// Spec ref: specs/030-counter-external-match-link + spec 010 — revue : un lien partenaire ne doit pas
// remplacer sans demander une partie X01 en cours connue seulement d'IndexedDB (copie localStorage absente).
import 'fake-indexeddb/auto';

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { IndexedDBSessionRepository } from '../../../src/infrastructure';
import type { PersistedAppSession } from '../../../src/shared';
import type { GameConfig, Player } from '../../../types';
import { APP_SESSION_STORAGE_KEY } from '../../../utils/appPersistence';

vi.mock('../../../src/lib/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/env')>();
  return { ...actual, env: { ...actual.env, VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'https://badarts.fr' } };
});

const { App } = await import('../../../App');
const { flushAppSessionPersistence } = await import('../../../src/app/appShell');

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};

const buildX01InProgress = (): PersistedAppSession => {
  const base = createMatch(players, config);
  const match = {
    ...base,
    currentPlayerIndex: 1,
    currentLeg: { ...base.currentLeg, scores: { team1: 441, team2: 501 }, history: [{ playerId: 'anne', score: 60, isBust: false, remainingAfter: 441, dartsThrown: 3 }] },
  };
  return {
    schemaVersion: 2, savedAt: Date.now(), screen: 'MATCH', selectedGameType: 'X01', currentMatch: match, matchWinner: '',
    arenaPrefillPlayers: [], cricketResults: null, triathlonData: null, capitalResults: [],
    matchRuntime: { match, hasGameStarted: true, elapsedSeconds: 42, measuredAt: Date.now() },
  };
};

beforeEach(() => {
  vi.stubGlobal('__APP_SEMVER__', '2.0.0');
  window.matchMedia = ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => undefined, removeEventListener: () => undefined,
    addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false,
  }));
  window.localStorage.clear();
});

// Writes still debounced by a previous test must land before the next one prepares its storage.
afterEach(async () => {
  cleanup();
  flushAppSessionPersistence();
  await new Promise((resolve) => setTimeout(resolve, 50));
});

describe('lien partenaire et partie connue seulement d’IndexedDB', () => {
  it('demande avant de remplacer la partie X01 en cours', async () => {
    await new IndexedDBSessionRepository().saveAppSession(buildX01InProgress());
    // The localStorage copy was lost (quota exceeded, cleared by the browser…).
    window.localStorage.clear();
    expect(window.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
    window.history.replaceState(null, '', '/?v=1&game=x01&p1=Paul&p2=Lou&return=https%3A%2F%2Fbadarts.fr%2Fretour');

    render(<App />);

    expect(await screen.findByTestId('external-conflict-dialog')).toBeTruthy();
    act(() => {
      screen.getByTestId('external-conflict-keep').click();
    });
    await act(async () => {
      await vi.dynamicImportSettled();
    });
    expect(screen.getAllByText('441').length).toBeGreaterThan(0);
  });

  it('applique directement le lien quand la session IndexedDB n’a rien à protéger', async () => {
    await new IndexedDBSessionRepository().saveAppSession({ ...buildX01InProgress(), screen: 'GAME_SELECTION' });
    window.localStorage.clear();
    window.history.replaceState(null, '', '/?v=1&game=x01&p1=Paul&p2=Lou&return=https%3A%2F%2Fbadarts.fr%2Fretour');

    render(<App />);
    await act(async () => {
      await vi.dynamicImportSettled();
    });
    await vi.waitFor(() => expect(window.localStorage.getItem(APP_SESSION_STORAGE_KEY)).not.toBeNull());

    expect(screen.queryByTestId('external-conflict-dialog')).toBeNull();
    const persisted = JSON.parse(window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? 'null') as PersistedAppSession;
    expect(persisted.screen).toBe('SETUP');
    expect(persisted.arenaPrefillPlayers).toEqual(['Paul', 'Lou']);
  });

  it('n’écrit rien avant d’avoir lu IndexedDB, puis reprend la partie sans lien', async () => {
    await new IndexedDBSessionRepository().saveAppSession(buildX01InProgress());
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');

    render(<App />);
    expect(window.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
    expect(await screen.findAllByText('441')).not.toHaveLength(0);
  });
});
