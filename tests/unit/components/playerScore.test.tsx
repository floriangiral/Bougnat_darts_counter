// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { PlayerScore } from '../../../components/game/PlayerScore';

const originalResizeObserver = globalThis.ResizeObserver;

afterEach(() => {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: originalResizeObserver,
  });
});

describe('PlayerScore', () => {
  it('uses and cleans up the window resize fallback when ResizeObserver is unavailable', () => {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: undefined,
    });
    const addResizeListener = vi.spyOn(window, 'addEventListener');
    const removeResizeListener = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <PlayerScore name="Player One" score={501} isActive legsWon={0} />,
    );

    expect(addResizeListener).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(removeResizeListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});