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

const renderMatch = (
  checkOut: InOutRule,
  startingScore: number,
  actions: {
    onRematch?: (match: MatchState) => void;
    onFinishWithState?: (winnerId: string, match: MatchState) => void;
    externalResultReturn?: { host: string; onSend: (match: MatchState) => void };
    skipWinnerScreen?: boolean;
  } = {},
) => {
  const onStateChange = vi.fn<(snapshot: Snapshot) => void>();
  render(
    <MatchView
      initialMatch={createMatch(players, buildConfig(checkOut, startingScore))}
      skipStartingPlayerPrompt
      onStateChange={onStateChange}
      onFinish={vi.fn()}
      onExit={vi.fn()}
      {...actions}
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
  it('skips the local winner screen and reports the finished match directly', () => {
    const onFinishWithState = vi.fn<(winnerId: string, match: MatchState) => void>();
    const latest = renderMatch('Double', 40, { skipWinnerScreen: true, onFinishWithState });

    typeDigits(40);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));
    fireEvent.click(screen.getByTestId('checkout-darts-1'));

    expect(screen.queryByTestId('winner-view-stats')).toBeNull();
    expect(screen.queryByTestId('winner-view-rematch')).toBeNull();
    expect(onFinishWithState).toHaveBeenCalledWith('team1', expect.objectContaining({ status: 'finished' }));
    expect(latest().status).toBe('finished');
  });

  it('shows only the partner return action on a linked match winner screen', () => {
    const onSend = vi.fn<(match: MatchState) => void>();
    const latest = renderMatch('Double', 40, {
      externalResultReturn: { host: 'badarts.fr', onSend },
    });

    typeDigits(40);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));
    fireEvent.click(screen.getByTestId('checkout-darts-1'));

    expect(screen.getByTestId('winner-view-external-return').getAttribute('aria-label')).toBe('Envoyer le résultat à badarts.fr');
    expect(screen.queryByTestId('winner-view-stats')).toBeNull();
    expect(screen.queryByTestId('winner-view-rematch')).toBeNull();
    fireEvent.click(screen.getByTestId('winner-view-external-return'));
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ status: 'finished', matchWinnerId: 'team1' }));
    expect(latest().status).toBe('finished');
  });

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

describe('MatchView — limite de volées par manche', () => {
  const renderLimitedMatch = () => {
    const onStateChange = vi.fn<(snapshot: Snapshot) => void>();
    render(
      <MatchView
        initialMatch={createMatch(players, { ...buildConfig('Double', 501), maxVisitsPerLeg: 1 })}
        skipStartingPlayerPrompt
        onStateChange={onStateChange}
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    return () => onStateChange.mock.lastCall![0].match;
  };

  const playVisit = (score: number) => {
    typeDigits(score);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));
  };

  it('demande le gagnant du bull à la limite, annulable, puis attribue la manche', () => {
    const latest = renderLimitedMatch();

    playVisit(60);
    expect(screen.queryByTestId('bull-off-modal')).toBeNull();
    playVisit(45);

    expect(screen.getByTestId('bull-off-modal')).toBeTruthy();
    playVisit(60);
    expect(latest().currentLeg.history).toHaveLength(2);

    fireEvent.click(screen.getByTestId('bull-off-undo'));
    expect(screen.queryByTestId('bull-off-modal')).toBeNull();
    expect(latest().currentLeg.history).toHaveLength(1);

    playVisit(45);
    fireEvent.click(screen.getByTestId('bull-off-winner-team2'));

    expect(latest()).toMatchObject({ status: 'finished', matchWinnerId: 'team2' });
    expect(latest().currentLeg.decidedByBullOff).toBe(true);
    expect(screen.queryByTestId('bull-off-modal')).toBeNull();
    expect(screen.getByTestId('winner-view-stats')).toBeTruthy();
  });
});
