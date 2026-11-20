// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { GameConfig, InOutRule, MatchState, Player } from '../../../types';
import { MatchView } from '../../../views/MatchView';

type Snapshot = { match: MatchState; hasGameStarted: boolean; elapsedSeconds: number };

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'team1' },
  { id: 'p2', name: 'Bruno', teamId: 'team2' },
];

const buildConfig = (checkOut: InOutRule, startingScore: number): GameConfig => ({
  startingScore, checkIn: 'Open', checkOut, matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
});

const renderMatch = (checkOut: InOutRule, startingScore: number) => {
  const onStateChange = vi.fn<(snapshot: Snapshot) => void>();
  render(
    <MatchView
      initialMatch={createMatch(players, buildConfig(checkOut, startingScore))}
      skipStartingPlayerPrompt
      onStateChange={onStateChange}
      onFinish={vi.fn()}
      onExit={vi.fn()}
    />,
  );
  return () => onStateChange.mock.lastCall![0].match;
};

const pointer = (element: HTMLElement, type: 'pointerdown' | 'pointerup') => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'isPrimary', { value: true });
  act(() => {
    element.dispatchEvent(event);
  });
};

const typeDigits = (value: number) => {
  String(value).split('').forEach((digit) => {
    const key = screen.getByTestId(`x01-keypad-${digit}`);
    pointer(key, 'pointerdown');
    pointer(key, 'pointerup');
  });
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('MatchView — règles de sortie X01', () => {
  it('enregistre une sortie impossible en Double-Out comme un trop, annulable', () => {
    vi.useFakeTimers();
    const latest = renderMatch('Double', 180);

    typeDigits(180);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));

    expect(screen.queryByTestId('checkout-confirm-modal')).toBeNull();
    expect(screen.getByText('SORTIE IMPOSSIBLE')).toBeTruthy();
    expect(latest().currentLeg.scores.team1).toBe(180);
    expect(latest().currentLeg.history).toEqual([expect.objectContaining({ isBust: true, score: 0 })]);

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(latest().currentLeg.history).toHaveLength(0);
    expect(latest().currentPlayerIndex).toBe(0);
  });

  it('propose uniquement 3 fléchettes pour la sortie maximale de 170', () => {
    renderMatch('Double', 170);

    typeDigits(170);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));

    expect(screen.getByTestId('checkout-confirm-modal')).toBeTruthy();
    expect(screen.queryByTestId('checkout-darts-1')).toBeNull();
    expect(screen.queryByTestId('checkout-darts-2')).toBeNull();
    expect(screen.getByTestId('checkout-darts-3')).toBeTruthy();
  });

  it('refuse un reste visé de 1 en Master-Out', () => {
    const latest = renderMatch('Master', 4);

    typeDigits(1);
    fireEvent.click(screen.getByTestId('x01-keypad-remaining'));

    expect(screen.getByText('SCORE RESTANT IMPOSSIBLE')).toBeTruthy();
    expect(latest().currentLeg.history).toHaveLength(0);
  });
});
