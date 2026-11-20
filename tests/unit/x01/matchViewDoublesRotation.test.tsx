// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { buildSetupConfig, buildSetupPlayers } from '../../../src/features/game-setup/setupModel';
import type { MatchState } from '../../../types';
import { MatchView } from '../../../views/MatchView';

type Snapshot = { match: MatchState; hasGameStarted: boolean; elapsedSeconds: number };

const players = buildSetupPlayers({ isDoubles: true, playerNames: [], team1Names: ['J1', 'J2'], team2Names: ['J3', 'J4'] });
const { config } = buildSetupConfig({
  startingScore: 101, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 3, setsToWin: 1,
  cricketRounds: 20, isDoubles: true, startingPlayerIndex: 0, teamStarterIds: { team1: 't1p1', team2: 't2p1' },
});

const currentName = (match: MatchState) => match.players[match.currentPlayerIndex].name;

const renderMatch = (restoredState: Snapshot | null = null) => {
  const onStateChange = vi.fn<(snapshot: Snapshot) => void>();
  const initialMatch = restoredState?.match ?? createMatch(players, config);
  const view = render(
    <MatchView initialMatch={initialMatch} restoredState={restoredState} onStateChange={onStateChange} onFinish={vi.fn()} onExit={vi.fn()} />,
  );
  const latest = () => onStateChange.mock.lastCall![0];
  return { ...view, latest };
};

const pointer = (element: HTMLElement, type: 'pointerdown' | 'pointerup') => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'isPrimary', { value: true });
  act(() => {
    element.dispatchEvent(event);
  });
};

const enterScore = (score: number) => {
  String(score).split('').forEach((digit) => {
    const key = screen.getByTestId(`x01-keypad-${digit}`);
    pointer(key, 'pointerdown');
    pointer(key, 'pointerup');
  });
  fireEvent.click(screen.getByTestId('x01-keypad-ok'));
};

const checkout = (score: number, darts: 1 | 2 | 3) => {
  enterScore(score);
  fireEvent.click(screen.getByTestId(`checkout-darts-${darts}`));
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('MatchView — rotation X01 doublettes de bout en bout', () => {
  it('enchaîne les manches, annule une fin de manche et reprend après rafraîchissement', () => {
    vi.useFakeTimers();
    const { latest, unmount } = renderMatch();

    fireEvent.click(screen.getByTestId('starter-option-team1'));
    expect(currentName(latest().match)).toBe('J1');

    const legOneOrder: string[] = [];
    [60, 0, 0, 0].forEach((score) => {
      legOneOrder.push(currentName(latest().match));
      enterScore(score);
    });
    expect(legOneOrder).toEqual(['J1', 'J3', 'J2', 'J4']);
    expect(currentName(latest().match)).toBe('J1');

    // Annulation d'une volée : J4 reprend la main, puis la rotation continue normalement.
    fireEvent.click(screen.getByRole('button', { name: /Retour/ }));
    expect(currentName(latest().match)).toBe('J4');
    expect(latest().match.currentLeg.history).toHaveLength(3);
    enterScore(0);
    expect(currentName(latest().match)).toBe('J1');

    checkout(41, 2);
    expect(latest().match.legsWon).toEqual({ team1: 1, team2: 0 });
    expect(currentName(latest().match)).toBe('J3');

    // Annulation de la fin de manche : retour à J1 sur 41, aucune manche comptée.
    fireEvent.click(screen.getByRole('button', { name: /Retour/ }));
    expect(latest().match.completedLegs).toHaveLength(0);
    expect(latest().match.legsWon).toEqual({ team1: 0, team2: 0 });
    expect(currentName(latest().match)).toBe('J1');

    checkout(41, 2);
    expect(latest().match.legsWon).toEqual({ team1: 1, team2: 0 });
    expect(currentName(latest().match)).toBe('J3');
    enterScore(0);
    expect(currentName(latest().match)).toBe('J1');

    // Rafraîchissement : la vue est recréée depuis l'instantané persisté.
    const persisted = JSON.parse(JSON.stringify(latest())) as Snapshot;
    unmount();
    act(() => {
      vi.runOnlyPendingTimers();
    });
    const restored = renderMatch(persisted);
    expect(screen.queryByTestId('starting-player-overlay')).toBeNull();
    expect(currentName(restored.latest().match)).toBe('J1');

    const legTwoOrder: string[] = [];
    [0, 0, 0].forEach((score) => {
      legTwoOrder.push(currentName(restored.latest().match));
      enterScore(score);
    });
    expect(legTwoOrder).toEqual(['J1', 'J4', 'J2']);
    expect(currentName(restored.latest().match)).toBe('J3');
  });
});
