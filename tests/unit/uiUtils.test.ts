// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { enterFullScreen, exitFullScreen } from '../../utils/uiUtils';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fullscreen utilities', () => {
  it('requests fullscreen through the standard browser API', () => {
    const requestFullscreen = vi.fn();
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });

    enterFullScreen();

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it('exits fullscreen through a prefixed browser API when active', () => {
    const exitFullscreen = vi.fn();
    Object.defineProperty(document, 'webkitExitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });
    Object.defineProperty(document, 'webkitFullscreenElement', {
      configurable: true,
      value: document.documentElement,
    });

    exitFullScreen();

    expect(exitFullscreen).toHaveBeenCalledOnce();
  });
});
