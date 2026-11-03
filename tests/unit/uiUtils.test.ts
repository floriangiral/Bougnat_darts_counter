// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { enterFullScreen, exitFullScreen } from '../../utils/uiUtils';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fullscreen utilities', () => {
  it.each([
    'requestFullscreen', 'webkitRequestFullScreen', 'mozRequestFullScreen', 'msRequestFullscreen',
  ])('supports the %s request API in isolation', (method) => {
    const request = vi.fn(function (this: object) {
      expect(this).toBe(element);
    });
    const element = { [method]: request };
    vi.stubGlobal('document', { documentElement: element, fullscreenEnabled: true });

    enterFullScreen();

    expect(request).toHaveBeenCalledOnce();
  });

  it.each([
    ['exitFullscreen', 'fullscreenElement'],
    ['webkitExitFullscreen', 'webkitFullscreenElement'],
    ['mozCancelFullScreen', 'mozFullScreenElement'],
    ['msExitFullscreen', 'msFullscreenElement'],
  ])('supports the %s exit API in isolation', (method, activeElement) => {
    const exit = vi.fn(function (this: object) {
      expect(this).toBe(fullscreenDocument);
    });
    const fullscreenDocument = { [method]: exit, [activeElement]: {} };
    vi.stubGlobal('document', fullscreenDocument);

    exitFullScreen();

    expect(exit).toHaveBeenCalledOnce();
  });

  it('does not request fullscreen when the browser explicitly disables it', () => {
    const request = vi.fn();
    vi.stubGlobal('document', {
      fullscreenEnabled: false, documentElement: { requestFullscreen: request },
    });
    enterFullScreen();
    expect(request).not.toHaveBeenCalled();
  });

  it('does not invoke an exit method outside fullscreen and tolerates missing APIs', () => {
    const exit = vi.fn();
    vi.stubGlobal('document', { documentElement: {}, exitFullscreen: exit });
    enterFullScreen();
    exitFullScreen();
    expect(exit).not.toHaveBeenCalled();

    vi.stubGlobal('document', { documentElement: {}, msFullscreenElement: {} });
    expect(() => exitFullScreen()).not.toThrow();
  });

  it('requests fullscreen through the standard browser API with its element receiver', () => {
    const requestFullscreen = vi.fn(function (this: HTMLElement) {
      expect(this).toBe(document.documentElement);
    });
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });

    enterFullScreen();

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it('requests fullscreen through a prefixed browser API with its element receiver', () => {
    const requestFullscreen = vi.fn(function (this: HTMLElement) {
      expect(this).toBe(document.documentElement);
    });
    Object.defineProperty(document.documentElement, 'webkitRequestFullScreen', {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: undefined,
    });

    enterFullScreen();

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it('exits fullscreen through a prefixed browser API with its document receiver', () => {
    const exitFullscreen = vi.fn(function (this: Document) {
      expect(this).toBe(document);
    });
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

  it('exits fullscreen through the standard browser API with its document receiver', () => {
    const exitFullscreen = vi.fn(function (this: Document) {
      expect(this).toBe(document);
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: document.documentElement,
    });

    exitFullScreen();

    expect(exitFullscreen).toHaveBeenCalledOnce();
  });

  it('does nothing when no fullscreen API is available or no document is active', () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: undefined });
    Object.defineProperty(document, 'webkitExitFullscreen', { configurable: true, value: undefined });
    Object.defineProperty(document, 'webkitFullscreenElement', { configurable: true, value: null });

    expect(() => enterFullScreen()).not.toThrow();
    expect(() => exitFullScreen()).not.toThrow();
  });

  it('swallows fullscreen API failures', () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: () => { throw new Error('request failed'); },
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: () => { throw new Error('exit failed'); },
    });
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement });

    expect(() => enterFullScreen()).not.toThrow();
    expect(() => exitFullScreen()).not.toThrow();
  });

  it('warns when fullscreen APIs reject asynchronously', async () => {
    const requestError = new Error('request rejected');
    const exitError = new Error('exit rejected');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: vi.fn().mockRejectedValue(requestError),
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: vi.fn().mockRejectedValue(exitError),
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: document.documentElement,
    });

    enterFullScreen();
    exitFullScreen();
    await Promise.resolve();

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenNthCalledWith(1, 'Full screen request failed', requestError);
    expect(warn).toHaveBeenNthCalledWith(2, 'Exit full screen failed', exitError);
  });
});
