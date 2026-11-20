// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { ViewportContext } from '../../../src/features/layout/useViewportClass';
import { resolveViewportClass } from '../../../src/features/layout/viewportClass';
import type { GameConfig, Player } from '../../../types';
import { MatchView } from '../../../views/MatchView';

const arena = resolveViewportClass({ width: 1080, height: 810, isTouch: true, accessMode: 'local' });
const portrait = resolveViewportClass({ width: 810, height: 1080, isTouch: true, accessMode: 'local' });
const phone = resolveViewportClass({ width: 390, height: 844, isTouch: true, accessMode: 'local' });
const narrowTabletLandscape = resolveViewportClass({ width: 800, height: 600, isTouch: true, accessMode: 'local' });

const config: GameConfig = {
  startingScore: 40, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 2, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
};

const playersOf = (count: number): Player[] => ['Alice', 'Bruno', 'Chloé', 'David'].slice(0, count)
  .map((name, index) => ({ id: `p${index + 1}`, name, teamId: `team${index + 1}` }));

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

const zone = (name: string) => document.querySelector(`[data-zone="${name}"]`) as HTMLElement;

afterEach(cleanup);

describe('MatchView — zones et arène (spec 072)', () => {
  const initialMatch = createMatch(playersOf(2), config);
  const withViewport = (viewport: typeof arena): ReactElement => (
    <ViewportContext.Provider value={viewport}>
      <MatchView initialMatch={initialMatch} skipStartingPlayerPrompt onFinish={vi.fn()} onExit={vi.fn()} />
    </ViewportContext.Provider>
  );

  it('fills the game screen zones and puts the merged Annuler key in the classic phone keypad', () => {
    render(withViewport(phone));
    expect(screen.getByTestId('game-screen').dataset.game).toBe('x01');
    expect(within(zone('header')).getByRole('button', { name: 'Quitter' })).toBeTruthy();
    expect(within(zone('players')).getAllByTestId('x01-player-card')).toHaveLength(2);
    expect(zone('input').dataset.keypad).toBe('classic');
    const undo = within(zone('input')).getByTestId('x01-keypad-undo');
    expect(undo.closest('.x01-inputbar')).toBeNull();
    expect(undo.closest('[data-keypad-layout="classic"]')).not.toBeNull();
    expect(screen.getAllByTestId('x01-keypad-undo')).toHaveLength(1);
    expect(screen.queryByTestId('x01-keypad-clear')).toBeNull();
    expect(document.querySelector('[class*="tablet-x01"]')).toBeNull();
  });

  it('uses the tablet keypad in the arena and confirms the finish inside the input zone', () => {
    render(withViewport(arena));
    expect(zone('input').dataset.keypad).toBe('tablet');
    expect(screen.getAllByTestId('x01-keypad-undo')).toHaveLength(1);
    expect(screen.getByTestId('x01-keypad-undo').nextElementSibling).toBe(screen.getByTestId('x01-keypad-0'));
    expect(screen.getByTestId('x01-keypad-0').nextElementSibling).toBe(screen.getByTestId('x01-keypad-ok'));
    expect(screen.getByTestId('x01-keypad-remaining').closest('[data-keypad-layout="tablet"]')).not.toBeNull();

    typeDigits(40);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));

    const panel = screen.getByTestId('checkout-confirm-modal');
    expect(zone('input').contains(panel)).toBe(true);
    expect(within(zone('players')).getAllByTestId('x01-player-score')).toHaveLength(2);
    expect(within(panel).getByTestId('checkout-darts-1')).toBeTruthy();
    fireEvent.click(within(panel).getByTestId('checkout-cancel'));
    expect(screen.queryByTestId('checkout-confirm-modal')).toBeNull();
  });

  it('keeps the typed score and the match across a rotation', () => {
    const view = render(withViewport(arena));
    typeDigits(26);
    view.rerender(withViewport(portrait));
    expect(screen.getByTestId('x01-input-score').textContent).toBe('26');
    view.rerender(withViewport(phone));
    expect(screen.getByTestId('x01-input-score').textContent).toBe('26');
    expect(screen.getByTestId('x01-keypad-undo').closest('[data-keypad-layout="classic"]')).not.toBeNull();
    view.rerender(withViewport(arena));
    expect(screen.getByTestId('x01-input-score').textContent).toBe('26');
  });

  it('Annuler clears the pending input first, then undoes the last visit', () => {
    render(withViewport(portrait));
    const undo = () => screen.getByTestId<HTMLButtonElement>('x01-keypad-undo');
    const scores = () => screen.getAllByTestId('x01-player-score').map((score) => score.textContent?.trim());
    expect(undo().disabled).toBe(true);

    typeDigits(26);
    expect(undo().dataset.undoIntent).toBe('clear-input');
    expect(screen.getByTestId('x01-display-status').textContent).toBe('Reste 14');
    fireEvent.click(undo());
    expect(screen.getByTestId('x01-input-score').textContent).toBe('---');
    expect(undo().disabled).toBe(true);

    typeDigits(20);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));
    expect(scores()).toEqual(['20', '40']);
    expect(undo().dataset.undoIntent).toBe('undo-last');
    fireEvent.click(undo());
    expect(scores()).toEqual(['40', '40']);
    expect(undo().disabled).toBe(true);
  });
});

describe('MatchView — tablette portrait (décision PO du 2026-11-20)', () => {
  const renderIn = (viewport: typeof arena, count = 2) => render(
    <ViewportContext.Provider value={viewport}>
      <MatchView initialMatch={createMatch(playersOf(count), config)} skipStartingPlayerPrompt onFinish={vi.fn()} onExit={vi.fn()} />
    </ViewportContext.Provider>,
  );

  it.each([2, 4])('shows the display band, one shortcut row and the phone-style keypad with %i cards', (count) => {
    renderIn(portrait, count);
    expect(zone('input').dataset.keypad).toBe('tablet');
    const display = screen.getByTestId('x01-display');
    expect(within(display).getByTestId('x01-input-score')).toBeTruthy();
    expect(within(display).queryByRole('button')).toBeNull();
    const keypadGrid = screen.getByRole('group', { name: 'Pavé numérique' });
    expect(within(keypadGrid).getByTestId('x01-keypad-remaining')).toBeTruthy();
    expect(within(keypadGrid).getByRole('button', { name: /écoute vocale|Scoring vocal/ }).dataset.state).toBeTruthy();
    expect(within(display).getByTestId('x01-display-checkout').textContent).toBe('Sortie possible');
    expect(screen.getByTestId('x01-keypad-shortcuts').querySelectorAll('button')).toHaveLength(8);
    expect(screen.queryByTestId('x01-keypad-side')).toBeNull();
    expect(screen.queryByTestId('x01-keypad-mobile-shortcuts')).toBeNull();
    expect(screen.queryByTestId('x01-status-pill')).toBeNull();
    expect(within(zone('players')).getAllByTestId('x01-player-counters')).toHaveLength(count);
  });

  it('confirms the finish inside the input zone', () => {
    renderIn(portrait);
    typeDigits(40);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));
    expect(zone('input').contains(screen.getByTestId('checkout-confirm-modal'))).toBe(true);
    expect(within(zone('players')).getAllByTestId('x01-player-score')).toHaveLength(2);
  });

  it('keeps the historical stack on a tablet held in landscape too narrow for the arena', () => {
    renderIn(narrowTabletLandscape);
    expect(zone('input').dataset.keypad).toBe('classic');
    expect(screen.getAllByTestId('x01-keypad-side')).toHaveLength(2);
    expect(screen.getByTestId('x01-status-pill')).toBeTruthy();
  });
});

describe('MatchView — 3 et 4 joueurs', () => {
  it.each([3, 4])('shows the %i competitors and moves the active marker after a visit', (count) => {
    render(
      <MatchView initialMatch={createMatch(playersOf(count), { ...config, startingScore: 501 })} skipStartingPlayerPrompt onFinish={vi.fn()} onExit={vi.fn()} />,
    );
    const activeName = () => screen.getAllByTestId('x01-player-card')
      .find((card) => card.dataset.state === 'active')?.closest('[data-team-id]')?.getAttribute('data-team-id');
    expect(screen.getAllByTestId('x01-player-card')).toHaveLength(count);
    expect(activeName()).toBe('team1');
    typeDigits(60);
    fireEvent.click(screen.getByTestId('x01-keypad-ok'));
    expect(activeName()).toBe('team2');
    expect(screen.getAllByTestId('x01-player-score').map((score) => score.textContent?.trim())).toEqual(['441', ...Array.from({ length: count - 1 }, () => '501')]);
  });
});
