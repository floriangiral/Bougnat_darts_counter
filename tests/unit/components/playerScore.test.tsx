// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { PlayerScore } from '../../../components/game/PlayerScore';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PlayerScore', () => {
  it('resizes the name and removes the same fallback listener when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const view = render(<PlayerScore name="Player One" score={501} isActive legsWon={0} />);
    const name = view.getByText('Player One');
    const wrapper = name.parentElement;
    expect(wrapper).not.toBeNull();
    Object.defineProperty(wrapper, 'clientWidth', { configurable: true, value: 202 });

    fireEvent(window, new Event('resize'));
    expect(name.style.fontSize).toBe('29px');

    const listener = addListener.mock.calls.find(([event]) => event === 'resize')?.[1];
    expect(listener).toBeTypeOf('function');
    view.unmount();
    expect(removeListener).toHaveBeenCalledWith('resize', listener);
  });

  it('observes the name container and disconnects on unmount when ResizeObserver is supported', () => {
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
    const view = render(<PlayerScore name="Player One" score={501} isActive legsWon={0} />);
    const name = view.getByText('Player One');
    expect(observe).toHaveBeenCalledWith(name.parentElement);
    Object.defineProperty(name.parentElement, 'clientWidth', { configurable: true, value: 202 });
    expect(notifyResize).toBeTypeOf('function');
    act(() => notifyResize?.());
    expect(name.style.fontSize).toBe('29px');
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
