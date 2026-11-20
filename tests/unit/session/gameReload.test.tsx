// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (Révision V2 : V2-FR-01, V2-AC-01, V2-AC-02).
// Un rechargement est simulé par démontage puis remontage de la vue avec l'instantané publié,
// passé par JSON comme le ferait le stockage local.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type {
  CapitalRuntimeSnapshot,
  CricketRuntimeSnapshot,
  GotchaRuntimeSnapshot,
  KillerRuntimeSnapshot,
  MatchRuntimeSnapshot,
  TriathlonRuntimeSnapshot,
} from '../../../src/shared';
import type { GameConfig, Player } from '../../../types';
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

const reload = <T,>(snapshot: T): T => JSON.parse(JSON.stringify(snapshot)) as T;

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

    click(screen.getAllByRole('button', { name: /Retour/ })[0]);
    expect(latest(second).state.states.find((entry) => entry.id === 'zoe')?.score).toBe(0);
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
    expect(screen.getByText('Tour 2')).toBeTruthy();

    press(/Retour/);
    expect(latest(second).state.players[1].score).toBe(0);
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
    const snapshot = reload(latest(first));
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
