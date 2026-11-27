// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { ViewportContext } from '../../../src/features/layout/useViewportClass';
import { resolveViewportClass, type ViewportClass } from '../../../src/features/layout/viewportClass';
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

describe('MatchView — places fixes à 3 ou 4 joueurs sur tous les écrans (spec 132, RM-11)', () => {
  const four: Player[] = ['Joueur 1', 'Joueur 2', 'Joueur 3', 'Joueur 4']
    .map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));

  const renderInViewport = (viewport: ViewportClass, roster: Player[], matchConfig: GameConfig) => {
    const onStateChange = vi.fn<(snapshot: Snapshot) => void>();
    render(
      <ViewportContext.Provider value={viewport}>
        <MatchView initialMatch={createMatch(roster, matchConfig)} onStateChange={onStateChange} onFinish={vi.fn()} onExit={vi.fn()} skipWinnerScreen />
      </ViewportContext.Provider>,
    );
    return { latest: () => onStateChange.mock.lastCall![0].match };
  };

  const seats = () => Array.from(screen.getByTestId('x01-players').children as HTMLCollectionOf<HTMLElement>).map((cell) => ({
    team: cell.dataset.teamId ?? 'vide',
    order: cell.style.order,
    active: cell.dataset.active ?? null,
    badge: cell.querySelector('[data-testid="x01-player-badge"]')?.textContent ?? null,
  }));

  const environments: [string, { width: number; height: number }, boolean][] = [
    ['iPhone portrait', { width: 390, height: 844 }, true],
    ['iPhone paysage', { width: 844, height: 390 }, true],
    ['tablette portrait', { width: 834, height: 1112 }, true],
    ['tablette paysage / arène', { width: 1194, height: 834 }, true],
    ['ordinateur', { width: 1280, height: 800 }, false],
  ] as const;

  it.each(environments)('%s : chaque joueur garde sa case, seul le cadre actif se déplace, y compris à la manche suivante', (_, size, isTouch) => {
    vi.useFakeTimers();
    const viewport = resolveViewportClass({ ...size, isTouch, accessMode: 'local' });
    const { latest } = renderInViewport(viewport, four, { ...config, startingScore: 301, legsToWin: 2 });
    chooseOrder('p1', 'p4', 'p2', 'p3');
    expect(screen.getByTestId('x01-players').dataset.seating).toBe('fixed');

    const expectSeats = (activeTeam: string) => expect(seats()).toEqual(['p1', 'p4', 'p2', 'p3'].map((team, index) => ({
      team, order: '', active: String(team === activeTeam), badge: String(index + 1),
    })));

    expectSeats('p1');
    enterScore(180);
    expectSeats('p4');
    enterScore(60);
    expectSeats('p2');
    enterScore(60);
    expectSeats('p3');
    enterScore(60);
    expectSeats('p1');

    enterScore(121);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(latest().completedLegs).toHaveLength(1);
    const nextStarter = latest().players[latest().currentPlayerIndex].teamId;
    expect(nextStarter).not.toBe('p1');
    expectSeats(nextStarter);
    vi.useRealTimers();
  });

  it.each(environments)('%s : laisse vide la case en bas à droite à 3 joueurs et garde les places pendant la place jouée', (_, size, isTouch) => {
    renderInViewport(resolveViewportClass({ ...size, isTouch, accessMode: 'local' }), players, config);
    chooseOrder('p3', 'p1', 'p2');
    enterScore(20);
    expect(seats()).toEqual([
      { team: 'p3', order: '', active: 'false', badge: '1' },
      { team: 'p1', order: '', active: 'true', badge: '2' },
      { team: 'p2', order: '', active: 'false', badge: '3' },
      { team: 'vide', order: '', active: null, badge: null },
    ]);

    enterScore(101);
    fireEvent.click(screen.getByTestId('placement-play'));
    expect(seats()).toEqual([
      { team: 'p3', order: '', active: 'false', badge: '1' },
      { team: 'p1', order: '', active: 'false', badge: '1er' },
      { team: 'p2', order: '', active: 'true', badge: '3' },
      { team: 'vide', order: '', active: null, badge: null },
    ]);
  });

});
