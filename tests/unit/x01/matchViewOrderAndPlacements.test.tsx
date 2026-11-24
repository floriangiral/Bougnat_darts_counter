// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { GameConfig, MatchState, Player } from '../../../types';
import { MatchView } from '../../../views/MatchView';

// Spec ref: specs/132-counter-x01-order-and-placements
type Snapshot = { match: MatchState; hasGameStarted: boolean; elapsedSeconds: number };

const players: Player[] = ['Alice', 'Bob', 'Carol'].map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));
const config: GameConfig = {
  startingScore: 101, checkIn: 'Open', checkOut: 'Open', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
};

const renderMatch = (matchConfig: GameConfig = config) => {
  const onStateChange = vi.fn<(snapshot: Snapshot) => void>();
  const onFinishWithState = vi.fn<(winnerId: string, match: MatchState) => void>();
  render(
    <MatchView
      initialMatch={createMatch(players, matchConfig)}
      onStateChange={onStateChange}
      onFinish={vi.fn()}
      onFinishWithState={onFinishWithState}
      onExit={vi.fn()}
      skipWinnerScreen
    />,
  );
  return { latest: () => onStateChange.mock.lastCall![0].match, onFinishWithState };
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
  const darts = screen.queryByTestId('checkout-darts-3');
  if (darts) fireEvent.click(darts);
};

const chooseOrder = (...ids: string[]) => {
  ids.forEach((id) => fireEvent.click(screen.getByTestId(`throw-order-option-${id}`)));
  fireEvent.click(screen.getByTestId('throw-order-confirm'));
};

afterEach(cleanup);

describe('MatchView — ordre de passage et places jouées (spec 132)', () => {
  it('impose l’ordre de passage puis affiche le numéro de chaque joueur', () => {
    const { latest } = renderMatch();
    expect(screen.queryByTestId('starter-option-p1')).toBeNull();
    expect(screen.getByTestId<HTMLButtonElement>('throw-order-confirm').disabled).toBe(true);

    fireEvent.click(screen.getByTestId('throw-order-option-p3'));
    fireEvent.click(screen.getByTestId('throw-order-option-p1'));
    expect(screen.getByTestId('throw-order-option-p2').getAttribute('data-order')).toBe('3');
    fireEvent.click(screen.getByTestId('throw-order-confirm'));

    expect(screen.queryByTestId('throw-order-overlay')).toBeNull();
    expect(latest().players.map((player) => player.id)).toEqual(['p3', 'p1', 'p2']);
    expect(screen.getAllByTestId('x01-player-badge').map((badge) => badge.getAttribute('title')))
      .toEqual(expect.arrayContaining(['Ordre de passage : n° 1', 'Ordre de passage : n° 2', 'Ordre de passage : n° 3']));
  });

  it('propose la 2e place après la victoire, la joue, puis termine avec le classement joué', () => {
    const { latest, onFinishWithState } = renderMatch();
    chooseOrder('p1', 'p2', 'p3');
    enterScore(101);

    expect(screen.getByTestId('placement-prompt').getAttribute('aria-label')).toBe('Alice gagne le match !');
    expect(onFinishWithState).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('placement-play'));

    expect(screen.queryByTestId('placement-prompt')).toBeNull();
    expect(latest().status).toBe('active');
    enterScore(0);
    enterScore(101);

    expect(onFinishWithState).toHaveBeenCalledTimes(1);
    const [winnerId, finished] = onFinishWithState.mock.lastCall!;
    expect(winnerId).toBe('p1');
    expect(finished.placement?.finishedTeamIds).toEqual(['p1', 'p3', 'p2']);
  });

  it('termine le match sans jouer les places', () => {
    const { onFinishWithState } = renderMatch();
    chooseOrder('p2', 'p1', 'p3');
    enterScore(101);
    fireEvent.click(screen.getByTestId('placement-finish'));

    expect(onFinishWithState).toHaveBeenCalledTimes(1);
    expect(onFinishWithState.mock.lastCall![1].placement).toBeUndefined();
  });

  it('départage une place au bull à la limite de volées, entre les seuls joueurs non classés', () => {
    const { onFinishWithState } = renderMatch({ ...config, maxVisitsPerLeg: 1 });
    chooseOrder('p1', 'p2', 'p3');
    enterScore(20);
    enterScore(20);
    enterScore(20);
    fireEvent.click(screen.getByTestId('bull-off-winner-p1'));
    fireEvent.click(screen.getByTestId('placement-play'));

    expect(screen.getByTestId('bull-off-modal').textContent).toContain('prend la 2e place');
    expect(screen.queryByTestId('bull-off-winner-p1')).toBeNull();
    fireEvent.click(screen.getByTestId('bull-off-winner-p3'));

    expect(onFinishWithState).toHaveBeenCalledTimes(1);
    expect(onFinishWithState.mock.lastCall![1].placement?.finishedTeamIds).toEqual(['p1', 'p3', 'p2']);
  });
});
