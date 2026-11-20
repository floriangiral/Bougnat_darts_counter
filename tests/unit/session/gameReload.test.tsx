// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (Révision V2 : V2-FR-01, V2-AC-01, V2-AC-02).
// Un rechargement est simulé par démontage puis remontage de la vue avec l'instantané publié,
// passé par JSON comme le ferait le stockage local.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { restoreAppSession } from '../../../src/app/appShell';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { buildCricketMatchSummary } from '../../../src/features/cricket/cricketGameModel';
import { createInitialTriathlonFlowState } from '../../../src/features/triathlon/triathlonFlow';
import { initCricketState } from '../../../utils/cricketLogic';
import type {
  CapitalRuntimeSnapshot,
  CricketRuntimeSnapshot,
  GameRuntimeSnapshot,
  GotchaRuntimeSnapshot,
  KillerRuntimeSnapshot,
  MatchRuntimeSnapshot,
  PersistedAppSession,
  TriathlonRuntimeSnapshot,
} from '../../../src/shared';
import type { GameConfig, Player } from '../../../types';
import { APP_SESSION_STORAGE_KEY } from '../../../utils/appPersistence';
import { getScreenForGameType } from '../../../utils/arenaFlow';
import { CapitalGameView } from '../../../views/CapitalGameView';
import { CricketGameView } from '../../../views/CricketGameView';
import { GotchaGameView } from '../../../views/GotchaGameView';
import { KillerGameView } from '../../../views/KillerGameView';
import { MatchView } from '../../../views/MatchView';
import { TriathlonGameView } from '../../../views/TriathlonGameView';

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];

const config: GameConfig = {
  startingScore: 301,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  legsToWin: 1,
  setsToWin: 1,
  isDoubles: false,
  cricketRounds: 20,
  initialStartingPlayerIndex: 0,
};

// The snapshot goes through the real storage path: JSON in localStorage, then validation and
// clock resumption by restoreAppSession, exactly as on a page reload.
const storeAndRestore = (session: PersistedAppSession): PersistedAppSession => {
  window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify({ ...session, schemaVersion: 2, savedAt: Date.now() }));
  const restored = restoreAppSession();
  expect(restored.discarded).toBe(false);
  if (!restored.session) throw new Error('Session non restaurée.');
  return restored.session;
};

const baseSession = (gameType: PersistedAppSession['selectedGameType']): PersistedAppSession => ({
  screen: getScreenForGameType(gameType),
  selectedGameType: gameType,
  currentMatch: createMatch(players, config),
  matchWinner: '',
  arenaPrefillPlayers: [],
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: null,
});

const reload = <T extends GameRuntimeSnapshot>(snapshot: T): T =>
  storeAndRestore({ ...baseSession(snapshot.gameType), gameRuntime: snapshot }).gameRuntime as T;

const reloadX01 = (snapshot: MatchRuntimeSnapshot): MatchRuntimeSnapshot => {
  const restored = storeAndRestore({ ...baseSession('X01'), currentMatch: snapshot.match, matchRuntime: snapshot }).matchRuntime;
  if (!restored) throw new Error('Partie X01 non restaurée.');
  return restored;
};

const click = (element: HTMLElement) => {
  act(() => {
    fireEvent.click(element);
  });
};

const press = (name: string | RegExp) => click(screen.getByRole('button', { name }));

const latest = <T,>(spy: { mock: { lastCall?: [T] } }): T => {
  const call = spy.mock.lastCall;
  if (!call) throw new Error('Aucun instantané publié par la vue.');
  return call[0];
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
});

describe('Cricket — reprise après rechargement', () => {
  const renderCricket = (restoredState: CricketRuntimeSnapshot | null = null) => {
    const onStateChange = vi.fn<(snapshot: CricketRuntimeSnapshot) => void>();
    render(
      <CricketGameView
        players={players}
        config={config}
        onExit={vi.fn()}
        onFinish={vi.fn()}
        skipStartingPlayerPrompt
        restoredState={restoredState}
        onStateChange={onStateChange}
      />,
    );
    return onStateChange;
  };
  const triple = (target: 20 | 19 | 18) => click(screen.getAllByRole('button', { name: String(target) })[2]);

  it('reprend les marques, le lanceur, les fléchettes du tour et la pile d’annulation', () => {
    const first = renderCricket();
    triple(20);
    triple(19);
    const snapshot = reload(latest(first));
    cleanup();

    const second = renderCricket(snapshot);
    expect(latest(second).state).toEqual(snapshot.state);
    expect(screen.getByRole('button', { name: 'C' }).hasAttribute('disabled')).toBe(false);

    triple(18);
    expect(latest(second).state.currentThrowerIdx).toBe(1);
    expect(latest(second).state.turnDartsThrown).toBe(0);

    press('C');
    press('C');
    press('C');
    const restored = latest(second).state;
    expect(restored.states.find((entry) => entry.id === 'anne')?.marks[20]).toBe(0);
    expect(restored.history).toHaveLength(0);
  });

  it('reprend l’écran de fin, permet d’annuler la dernière fléchette ou de valider le résultat', () => {
    const tenRounds = { ...config, cricketRounds: 10 as const };
    const onStateChange = vi.fn<(snapshot: CricketRuntimeSnapshot) => void>();
    render(<CricketGameView players={players} config={tenRounds} onExit={vi.fn()} onFinish={vi.fn()} skipStartingPlayerPrompt onStateChange={onStateChange} />);
    triple(20);
    for (let visit = 0; visit < 20; visit += 1) {
      if (screen.queryByRole('button', { name: '3 MISS' })) press('3 MISS');
    }
    const snapshot = reload(latest(onStateChange));
    expect(snapshot.state.isFinished).toBe(true);
    expect(snapshot.timing.running).toBe(false);
    cleanup();

    const onFinish = vi.fn();
    render(<CricketGameView players={players} config={tenRounds} onExit={vi.fn()} onFinish={onFinish} skipStartingPlayerPrompt restoredState={snapshot} />);
    expect(screen.getByText('Anne')).toBeTruthy();
    click(screen.getByTestId('winner-view-stats'));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ winnerId: 'anne' }));
  });
});

describe('Capital — reprise après rechargement', () => {
  const renderCapital = (restoredState: CapitalRuntimeSnapshot | null = null) => {
    const onStateChange = vi.fn<(snapshot: CapitalRuntimeSnapshot) => void>();
    render(
      <CapitalGameView
        players={players}
        config={config}
        onExit={vi.fn()}
        onFinish={vi.fn()}
        skipStartingPlayerPrompt
        restoredState={restoredState}
        onStateChange={onStateChange}
      />,
    );
    return onStateChange;
  };
  const enterCapital = (digits: string) => {
    digits.split('').forEach((digit) => press(digit));
    press('OK');
    act(() => {
      vi.advanceTimersByTime(600);
    });
  };

  it('reprend les scores, le joueur courant, l’objectif et la pile d’annulation', () => {
    vi.useFakeTimers();
    const first = renderCapital();
    enterCapital('60');
    enterCapital('45');
    const snapshot = reload(latest(first));
    cleanup();

    const second = renderCapital(snapshot);
    expect(latest(second).state).toEqual(snapshot.state);
    expect(screen.getByText('60')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByText('Le 20')).toBeTruthy();

    click(screen.getAllByRole('button', { name: /Retour/i })[0]);
    expect(latest(second).state.states.find((entry) => entry.id === 'zoe')?.score).toBe(0);
  });

  it('ne persiste que les 50 dernières étapes d’annulation', () => {
    vi.useFakeTimers();
    const first = renderCapital();
    enterCapital('60');
    const snapshot = latest(first);
    cleanup();

    const longHistory = Array.from({ length: 60 }, (_, index) => ({ ...snapshot.state.history[0], currentDarts: index % 2 ? [] : snapshot.state.history[0].currentDarts }));
    const second = renderCapital({ ...snapshot, state: { ...snapshot.state, history: longHistory } });
    expect(latest(second).state.history).toHaveLength(50);
  });
});

describe('Killer — reprise après rechargement', () => {
  const renderKiller = (restoredState: KillerRuntimeSnapshot | null = null) => {
    const onStateChange = vi.fn<(snapshot: KillerRuntimeSnapshot) => void>();
    render(
      <KillerGameView
        players={players}
        config={config}
        onExit={vi.fn()}
        onFinish={vi.fn()}
        restoredState={restoredState}
        onStateChange={onStateChange}
      />,
    );
    return onStateChange;
  };

  it('reprend la phase, les numéros, le rang Killer et la pile d’annulation', () => {
    const first = renderKiller();
    press('20');
    press('19');
    click(screen.getByRole('button', { name: /Anne.*Double personnel/ }));
    const snapshot = reload(latest(first));
    expect(snapshot.state.players[0].isKiller).toBe(true);
    cleanup();

    const second = renderKiller(snapshot);
    expect(latest(second).state).toEqual(snapshot.state);
    expect(screen.getByText('Anne joue')).toBeTruthy();

    press(/Annuler/);
    expect(latest(second).state.players[0].isKiller).toBe(false);
  });

  it('reprend une partie terminée sur l’écran du dernier survivant sans renvoyer le résultat', () => {
    const onFinish = vi.fn();
    const onStateChange = vi.fn<(snapshot: KillerRuntimeSnapshot) => void>();
    render(<KillerGameView players={players} config={config} onExit={vi.fn()} onFinish={onFinish} onStateChange={onStateChange} />);
    press('20');
    press('19');
    const anneDouble = () => click(screen.getByRole('button', { name: /Anne.*Double personnel/ }));
    const zoeDouble = () => click(screen.getByRole('button', { name: /Zoé.*Double adverse/ }));
    anneDouble();
    zoeDouble();
    zoeDouble();
    press('Passer');
    zoeDouble();
    expect(onFinish).toHaveBeenCalledOnce();
    const snapshot = reload(latest(onStateChange));
    expect(snapshot.state.phase).toBe('FINISHED');
    cleanup();

    const onFinishAfterReload = vi.fn();
    render(<KillerGameView players={players} config={config} onExit={vi.fn()} onFinish={onFinishAfterReload} restoredState={snapshot} />);
    expect(screen.getByText('Dernier survivant')).toBeTruthy();
    expect(onFinishAfterReload).not.toHaveBeenCalled();
  });
});

describe('Gotcha — reprise après rechargement', () => {
  const renderGotcha = (restoredState: GotchaRuntimeSnapshot | null = null) => {
    const onStateChange = vi.fn<(snapshot: GotchaRuntimeSnapshot) => void>();
    render(
      <GotchaGameView
        players={players}
        config={config}
        onExit={vi.fn()}
        onFinish={vi.fn()}
        restoredState={restoredState}
        onStateChange={onStateChange}
      />,
    );
    return onStateChange;
  };
  const visit = (digits: string) => {
    digits.split('').forEach((digit) => press(digit));
    press('Valider');
  };

  it('reprend les scores, le tour, le joueur courant et la pile d’annulation', () => {
    const first = renderGotcha();
    visit('60');
    visit('45');
    const snapshot = reload(latest(first));
    cleanup();

    const second = renderGotcha(snapshot);
    expect(latest(second).state).toEqual(snapshot.state);
    expect(screen.getByText('Tour 3')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Anne');

    press(/Retour/);
    expect(latest(second).state.players[1].score).toBe(0);
  });

  it('reprend une partie terminée sur l’écran du vainqueur sans renvoyer le résultat', () => {
    const onFinish = vi.fn();
    const onStateChange = vi.fn<(snapshot: GotchaRuntimeSnapshot) => void>();
    render(<GotchaGameView players={players} config={{ ...config, startingScore: 60 }} onExit={vi.fn()} onFinish={onFinish} onStateChange={onStateChange} />);
    visit('60');
    expect(onFinish).toHaveBeenCalledOnce();
    const snapshot = reload(latest(onStateChange));
    expect(snapshot.timing.running).toBe(false);
    cleanup();

    const onFinishAfterReload = vi.fn();
    render(<GotchaGameView players={players} config={{ ...config, startingScore: 60 }} onExit={vi.fn()} onFinish={onFinishAfterReload} restoredState={snapshot} />);
    expect(screen.getByText('Score exact')).toBeTruthy();
    expect(onFinishAfterReload).not.toHaveBeenCalled();
  });
});

describe('Triathlon — reprise après rechargement', () => {
  const renderTriathlon = (restoredState: TriathlonRuntimeSnapshot | null = null) => {
    const onStateChange = vi.fn<(snapshot: TriathlonRuntimeSnapshot) => void>();
    render(
      <TriathlonGameView
        players={players}
        config={config}
        onExit={vi.fn()}
        onFinish={vi.fn()}
        restoredState={restoredState}
        onStateChange={onStateChange}
      />,
    );
    return onStateChange;
  };

  it('reprend l’épreuve Capital en cours sans redemander le premier lanceur', () => {
    vi.useFakeTimers();
    const first = renderTriathlon();
    click(screen.getByTestId('starter-option-anne'));
    press('6');
    press('0');
    press('OK');
    act(() => {
      vi.advanceTimersByTime(600);
    });
    const snapshot = reload(latest(first));
    expect(snapshot.flow.phase).toBe('CAPITAL');
    cleanup();

    renderTriathlon(snapshot);
    expect(screen.queryByTestId('starting-player-overlay')).toBeNull();
    expect(screen.getByText('60')).toBeTruthy();
  });

  // Triathlon arrivé à l'épreuve 501 : Capital et Cricket terminés, 501 en cours (V2-AC-02).
  const buildX01StageSnapshot = (): TriathlonRuntimeSnapshot => {
    const cricketStates = initCricketState(players).map((entry) => (entry.id === 'anne' ? { ...entry, score: 40 } : entry));
    const x01 = createMatch(players, { ...config, startingScore: 501, legsToWin: 1, setsToWin: 1 });
    const match = { ...x01, currentPlayerIndex: 1, currentLeg: { ...x01.currentLeg, scores: { team1: 441, team2: 501 }, history: [{ playerId: 'anne', score: 60, isBust: false, remainingAfter: 441, dartsThrown: 3 }] } };
    return {
      gameType: 'TRIATHLON',
      flow: {
        ...createInitialTriathlonFlowState(),
        phase: 'X01',
        startingCompetitorId: 'anne',
        results: {
          capital: [
            { id: 'anne', name: 'Anne', score: 300, targetIndex: 17, history: [] },
            { id: 'zoe', name: 'Zoé', score: 120, targetIndex: 17, history: [] },
          ],
          cricket: buildCricketMatchSummary(cricketStates, 'anne', config, { anne: ['Anne'], zoe: ['Zoé'] }, { anne: 1 }, {}, {}),
        },
        // Tableau falsifié : il doit être recalculé depuis les épreuves terminées.
        scorecards: [],
      },
      stage: { phase: 'X01', runtime: { match, hasGameStarted: true, elapsedSeconds: 30, measuredAt: Date.now(), undoStack: [{ match: x01, elapsedSeconds: 10, showWinnerScreen: false, hasGameStarted: true }] } },
      timing: { elapsedSeconds: 900, measuredAt: Date.now(), running: true },
    };
  };

  it('reprend l’épreuve 501 avec les résultats Capital et Cricket intacts et sa pile d’annulation', () => {
    const snapshot = reload(buildX01StageSnapshot());
    const spy = renderTriathlon(snapshot);

    expect(screen.getAllByText('441').length).toBeGreaterThan(0);
    const published = latest(spy);
    expect(published.flow.results.capital?.[0].score).toBe(300);
    expect(published.flow.results.cricket?.winnerId).toBe('anne');
    expect(published.flow.scorecards).toHaveLength(2);
    expect(published.stage?.phase).toBe('X01');

    click(screen.getByRole('button', { name: /Retour/ }));
    const afterUndo = latest(spy).stage;
    expect(afterUndo?.phase === 'X01' && afterUndo.runtime.match.currentLeg.scores.team1).toBe(501);
  });

  it('reprend le départage 501 avec son bandeau', () => {
    const base = buildX01StageSnapshot();
    const x01 = base.stage!.runtime as MatchRuntimeSnapshot;
    const snapshot = reload({
      ...base,
      flow: { ...base.flow, phase: 'TIE_BREAK_X01', results: { ...base.flow.results, x01: { ...x01.match, status: 'finished' } } },
      stage: { phase: 'TIE_BREAK_X01', runtime: x01 },
    });
    renderTriathlon(snapshot);
    expect(screen.getByText('501 supplémentaire')).toBeTruthy();
    expect(screen.getAllByText('441').length).toBeGreaterThan(0);
  });

  it('reprend l’épreuve Cricket en cours', () => {
    const base = buildX01StageSnapshot();
    const first = vi.fn<(snapshot: TriathlonRuntimeSnapshot) => void>();
    render(<TriathlonGameView players={players} config={config} onExit={vi.fn()} onFinish={vi.fn()} onStateChange={first} restoredState={reload({ ...base, flow: { ...base.flow, phase: 'CRICKET', results: { capital: base.flow.results.capital } }, stage: null })} />);
    click(screen.getAllByRole('button', { name: '20' })[2]);
    const snapshot = reload(latest(first));
    expect(snapshot.stage?.phase).toBe('CRICKET');
    cleanup();

    const second = renderTriathlon(snapshot);
    const stage = latest(second).stage;
    expect(stage?.phase === 'CRICKET' && stage.runtime.state.states.find((entry) => entry.id === 'anne')?.marks[20]).toBe(3);
    expect(screen.getByRole('button', { name: 'C' }).hasAttribute('disabled')).toBe(false);
  });
});

describe('X01 — reprise après rechargement', () => {
  const renderX01 = (restoredState: MatchRuntimeSnapshot | null = null) => {
    const onStateChange = vi.fn<(snapshot: MatchRuntimeSnapshot) => void>();
    const initialMatch = restoredState?.match ?? createMatch(players, config);
    render(
      <MatchView
        initialMatch={initialMatch}
        onFinish={vi.fn()}
        onExit={vi.fn()}
        skipStartingPlayerPrompt
        restoredState={restoredState}
        onStateChange={onStateChange}
      />,
    );
    return onStateChange;
  };
  const enterScore = (value: number) => {
    String(value).split('').forEach((digit) => {
      const key = screen.getByTestId(`x01-keypad-${digit}`);
      for (const type of ['pointerdown', 'pointerup'] as const) {
        const event = new Event(type, { bubbles: true });
        Object.defineProperty(event, 'isPrimary', { value: true });
        act(() => {
          key.dispatchEvent(event);
        });
      }
    });
    click(screen.getByTestId('x01-keypad-ok'));
  };

  it('reprend la pile d’annulation', () => {
    const first = renderX01();
    enterScore(60);
    const snapshot = reloadX01(latest(first));
    expect(snapshot.match.currentLeg.scores.team1).toBe(241);
    cleanup();

    const second = renderX01(snapshot);
    const undo = screen.getByRole('button', { name: /Retour/ });
    expect(undo.hasAttribute('disabled')).toBe(false);
    click(undo);
    expect(latest(second).match.currentLeg.scores.team1).toBe(301);
  });

  it('ne publie aucun instantané sur un simple tic du chrono', () => {
    vi.useFakeTimers();
    const spy = renderX01();
    enterScore(60);
    const callsAfterAction = spy.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(spy.mock.calls.length).toBe(callsAfterAction);
  });
});
