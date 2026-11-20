// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { PlayerScore } from '../../../components/game/PlayerScore';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// jsdom ne fait pas de mise en page : largeur du texte = nombre de caractères × 0,6 em de la case.
const mockTextWidth = () =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const fontPx = Number.parseFloat(this.parentElement?.style.fontSize ?? '') || 16;
    return { width: (this.textContent ?? '').length * 0.6 * fontPx } as DOMRect;
  });

const nameBox = (text: HTMLElement) => text.parentElement as HTMLElement;

describe('PlayerScore', () => {
  it('fits the measured name (▶ marker included) and removes the fallback listener when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    mockTextWidth();
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const view = render(<PlayerScore name="Player One" score={501} isActive legsWon={0} />);
    const box = nameBox(view.getByText('Player One'));
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 202 });

    act(() => fireEvent(window, new Event('resize')));
    // « ▶Player One » : 11 caractères × 0,6 em ; (202 − 1) / 6,6 = 30,45 → 30 px, sur une ligne.
    expect(box.style.fontSize).toBe('30px');
    expect(box.dataset.fit).toBe('fit');
    expect(box.style.whiteSpace).toBe('nowrap');
    expect(box.getAttribute('title')).toBe('Player One');

    const listener = addListener.mock.calls.find(([event]) => event === 'resize')?.[1];
    expect(listener).toBeTypeOf('function');
    view.unmount();
    expect(removeListener).toHaveBeenCalledWith('resize', listener);
  });

  it('observes the name box, wraps a long name instead of truncating it, and disconnects on unmount', () => {
    mockTextWidth();
    const observe = vi.fn();
    const disconnect = vi.fn();
    let notifyResize: (() => void) | undefined;
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) {
        notifyResize = callback;
      }
      observe = observe;
      disconnect = disconnect;
    });
    const longName = 'Alexandre / Jean-Baptiste';
    const view = render(<PlayerScore name={longName} score={501} isActive legsWon={0} showMatchStarterBadge />);
    const box = nameBox(view.getByText(longName));
    expect(observe).toHaveBeenCalledWith(box);
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 120 });
    act(() => notifyResize?.());
    expect(box.dataset.fit).toBe('wrap');
    expect(box.style.fontSize).toBe('14px');
    expect(box.style.whiteSpace).toBe('normal');
    expect(box.style.overflowWrap).toBe('anywhere');
    expect(box.textContent).toBe(`▶${longName}`);
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('caps the name to the CSS row height when it scales with the screen (tablette portrait)', () => {
    mockTextWidth();
    let notifyResize: (() => void) | undefined;
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) {
        notifyResize = callback;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    });
    const view = render(<PlayerScore name="Alice" score={501} isActive legsWon={0} nameMaxFontPx={112} fitNameToRow />);
    const box = nameBox(view.getByText('Alice'));
    const row = box.parentElement?.parentElement as HTMLElement;
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 2000 });

    row.style.minHeight = '68px';
    act(() => notifyResize?.());
    expect(box.style.fontSize).toBe('68px');

    row.style.minHeight = '106px';
    act(() => fireEvent(window, new Event('resize')));
    expect(box.style.fontSize).toBe('106px');
  });

  it('marks the active player with three cues and exposes active and inactive states', () => {
    const view = render(<PlayerScore name="Alice" score={501} isActive legsWon={2} setsWon={1} />);
    const card = view.getByTestId('x01-player-card');
    expect(card.dataset.state).toBe('active');
    expect(card.getAttribute('aria-current')).toBe('true');
    expect(view.getByTestId('x01-active-bar')).toBeTruthy();
    expect(view.getByTestId('x01-active-marker').textContent).toBe('▶');
    expect(view.queryByTestId('x01-player-counters')).toBeNull();
    view.rerender(<PlayerScore name="Alice" score={501} isActive={false} legsWon={2} setsWon={1} showMatchCounters isSetsMode reserveStatusPillSpace={false} />);
    expect(card.dataset.state).toBe('inactive');
    expect(card.getAttribute('aria-current')).toBeNull();
    expect(view.queryByTestId('x01-active-bar')).toBeNull();
    expect(view.queryByTestId('x01-active-marker')).toBeNull();
    expect(view.getByTestId('x01-player-counters').textContent).toBe('Sets 1 · Manches 2');
  });
});
