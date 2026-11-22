// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

import { getVisibleViewportHeight, useVisualViewport } from '../../../src/features/smartphone/useVisualViewport';

type FakeVisualViewport = EventTarget & { height: number; scale: number };

const root = document.documentElement;
const viewportVar = () => root.style.getPropertyValue('--app-viewport-height');

let visual: FakeVisualViewport;

beforeEach(() => {
  vi.useFakeTimers();
  visual = Object.assign(new EventTarget(), { height: 640, scale: 1 });
  vi.stubGlobal('visualViewport', visual);
  vi.stubGlobal('innerHeight', 700);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('getVisibleViewportHeight', () => {
  it('uses the visual viewport height when the page is not zoomed', () => {
    expect(getVisibleViewportHeight()).toBe(640);
  });

  it('falls back to the window height while pinch-zoomed or without visualViewport', () => {
    visual.scale = 2;
    expect(getVisibleViewportHeight()).toBe(700);
    vi.stubGlobal('visualViewport', undefined);
    expect(getVisibleViewportHeight()).toBe(700);
  });
});

describe('useVisualViewport', () => {
  it('publishes the visible height and flags an open keyboard', () => {
    renderHook(useVisualViewport);
    expect(viewportVar()).toBe('640px');
    expect(root.dataset.keyboardOpen).toBe('false');

    visual.height = 400;
    visual.dispatchEvent(new Event('resize'));
    expect(viewportVar()).toBe('400px');
    expect(root.dataset.keyboardOpen).toBe('true');
  });

  it('measures again on fullscreen changes, immediately and once Android has settled', () => {
    renderHook(useVisualViewport);
    visual.height = 800;
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(viewportVar()).toBe('800px');

    visual.height = 780;
    vi.advanceTimersByTime(300);
    expect(viewportVar()).toBe('780px');
  });

  it('removes its listeners, pending measure and root state on unmount', () => {
    const { unmount } = renderHook(useVisualViewport);
    document.dispatchEvent(new Event('fullscreenchange'));
    unmount();
    expect(viewportVar()).toBe('');
    expect(root.dataset.keyboardOpen).toBeUndefined();

    visual.height = 500;
    vi.advanceTimersByTime(300);
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(viewportVar()).toBe('');
  });
});
