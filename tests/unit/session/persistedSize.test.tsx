// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-05) — revue : taille de la session
// persistée. Une longue partie doit rester sous 150 Ko et garder 20 étapes d'annulation après reprise.
import 'fake-indexeddb/auto';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { persistAppSessionNow, restoreAppSession } from '../../../src/app/appShell';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import {
  buildCheckoutConfirmResult,
  buildScoreSubmissionResult,
  cloneMatchState,
} from '../../../src/features/x01/scoring/matchSubmission';
import type { CricketRuntimeSnapshot, MatchRuntimeSnapshot, PersistedAppSession, X01UndoSnapshot } from '../../../src/shared';
import type { GameConfig, MatchState, Player } from '../../../types';
import { APP_SESSION_STORAGE_KEY } from '../../../utils/appPersistence';
import { CricketGameView } from '../../../views/CricketGameView';
import { MatchView } from '../../../views/MatchView';

const MAX_SESSION_BYTES = 150_000;
const RESTORED_UNDO_STEPS = 20;

const click = (element: HTMLElement) => {
  act(() => {
    fireEvent.click(element);
  });
};

const latest = <T,>(spy: { mock: { lastCall?: [T] } }): T => {
  const call = spy.mock.lastCall;
  if (!call) throw new Error('Aucun instantané publié par la vue.');
  return call[0];
};

const baseSession = (match: MatchState, selectedGameType: PersistedAppSession['selectedGameType'], screen: string): PersistedAppSession => ({
  screen,
  selectedGameType,
  currentMatch: match,
  matchWinner: '',
  arenaPrefillPlayers: [],
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: null,
});

// Same write path as the app (localStorage written synchronously, then IndexedDB); returns the stored size.
const persistAndMeasure = (session: PersistedAppSession) => {
  persistAppSessionNow(session);
  return new TextEncoder().encode(window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? '').length;
};

const restore = () => {
  const restored = restoreAppSession();
  expect(restored.discarded).toBe(false);
  if (!restored.session) throw new Error('Session non restaurée.');
  return restored.session;
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('taille de la session persistée — Cricket 4 joueurs, 30 tours', () => {
  const players: Player[] = ['Anne', 'Bruno', 'Chloé', 'David'].map((name, index) => ({ id: `p${index}`, name, teamId: `p${index}` }));
  const config: GameConfig = {
    startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1,
    isDoubles: false, cricketRounds: 30, initialStartingPlayerIndex: 0,
  };
  const withoutHistory = (snapshot: CricketRuntimeSnapshot) => ({ ...snapshot.state, history: [] });

  it('reste sous 150 Ko pour une partie complète et garde 20 étapes d’annulation', () => {
    const onStateChange = vi.fn<(snapshot: CricketRuntimeSnapshot) => void>();
    render(<CricketGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} skipStartingPlayerPrompt onStateChange={onStateChange} />);
    // Simples sur 20, 19 et 18 : personne ne ferme le tableau, la partie va au bout des 30 tours.
    const targets = ['20', '19', '18'] as const;
    const positions = [latest(onStateChange)];
    for (let dart = 0; !latest(onStateChange).state.isFinished; dart += 1) {
      click(screen.getAllByRole('button', { name: targets[dart % 3] })[0]);
      positions.push(latest(onStateChange));
    }
    expect(positions).toHaveLength(361);

    const size = persistAndMeasure({ ...baseSession(createMatch(players, config), 'CRICKET', 'CRICKET_GAME'), gameRuntime: positions.at(-1) });
    expect(size).toBeLessThan(MAX_SESSION_BYTES);
    cleanup();

    const restored = restore().gameRuntime as CricketRuntimeSnapshot;
    const afterReload = vi.fn<(snapshot: CricketRuntimeSnapshot) => void>();
    render(<CricketGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} skipStartingPlayerPrompt restoredState={restored} onStateChange={afterReload} />);
    click(screen.getByTestId('winner-view-undo'));
    for (let step = 1; step < RESTORED_UNDO_STEPS; step += 1) {
      click(screen.getByRole('button', { name: 'Annuler' }));
    }

    expect(withoutHistory(latest(afterReload))).toEqual(withoutHistory(positions[360 - RESTORED_UNDO_STEPS]));
    expect(screen.getByRole('button', { name: 'Annuler' }).hasAttribute('disabled')).toBe(true);
  });
});

describe('taille de la session persistée — X01 en sets, 25 manches', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Anne', teamId: 'team1' },
    { id: 'p2', name: 'Bruno', teamId: 'team2' },
  ];
  const config: GameConfig = {
    startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'SETS', legsToWin: 3, setsToWin: 7, isDoubles: false, initialStartingPlayerIndex: 0,
  };

  // Plays like MatchView: one undo step per validated visit. Legs alternate winners, so after
  // 25 legs (5 sets of 5) the match is still running.
  const playLongMatch = () => {
    let match = createMatch(players, config);
    const undoStack: X01UndoSnapshot[] = [];
    const positions: MatchState[] = [match];
    while (match.completedLegs.length < 25) {
      const legWinner = match.completedLegs.length % 2 === 0 ? 'team1' : 'team2';
      const player = match.players[match.currentPlayerIndex];
      const remaining = match.currentLeg.scores[player.teamId];
      const score = player.teamId === legWinner ? Math.min(180, remaining > 180 ? 180 : remaining) : 26;
      const submission = buildScoreSubmissionResult(match, score, positions.length);
      const result = submission.kind === 'checkout_confirm'
        ? buildCheckoutConfirmResult(match, score, 3, positions.length)
        : submission;
      if (result.kind !== 'applied') throw new Error(`Visite refusée : ${score}`);
      undoStack.push({ match: cloneMatchState(match), elapsedSeconds: positions.length, showWinnerScreen: false, hasGameStarted: true });
      match = result.nextMatch;
      positions.push(match);
    }
    expect(match.status).toBe('active');
    const runtime: MatchRuntimeSnapshot = { match, hasGameStarted: true, elapsedSeconds: positions.length, measuredAt: Date.now(), undoStack };
    return { runtime, positions };
  };

  it('reste sous 150 Ko et garde 20 étapes d’annulation, manches terminées comprises', () => {
    const { runtime, positions } = playLongMatch();
    const session = { ...baseSession(createMatch(players, config), 'X01', 'MATCH'), matchRuntime: runtime };
    expect(persistAndMeasure(session)).toBeLessThan(MAX_SESSION_BYTES);

    const restored = restore().matchRuntime;
    if (!restored) throw new Error('Partie X01 non restaurée.');
    const onStateChange = vi.fn<(snapshot: MatchRuntimeSnapshot) => void>();
    render(<MatchView initialMatch={restored.match} onFinish={vi.fn()} onExit={vi.fn()} skipStartingPlayerPrompt restoredState={restored} onStateChange={onStateChange} />);
    const undo = () => screen.getByRole('button', { name: 'Annuler' });
    for (let step = 0; step < RESTORED_UNDO_STEPS; step += 1) {
      click(undo());
    }

    expect(latest(onStateChange).match).toEqual(positions.at(-1 - RESTORED_UNDO_STEPS));
    expect(undo().hasAttribute('disabled')).toBe(true);
  });
});
