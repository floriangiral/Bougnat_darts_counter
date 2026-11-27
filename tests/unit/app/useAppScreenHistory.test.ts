// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppScreen } from '../../../src/app/appShell';
import { appScreenPath } from '../../../src/app/appScreenPath';
import { useAppScreenHistory } from '../../../src/app/useAppScreenHistory';
import type { GameType } from '../../../utils/arenaFlow';
import { enterFullScreen, exitFullScreen } from '../../../utils/uiUtils';

vi.mock('../../../utils/uiUtils', () => ({
  enterFullScreen: vi.fn(),
  exitFullScreen: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

type HookProps = { screen: AppScreen; game?: GameType };

const renderScreenHistory = (initialProps: HookProps, setScreen = vi.fn()) =>
  renderHook(({ screen, game = 'X01' }: HookProps) =>
    useAppScreenHistory(screen, setScreen, game), { initialProps });

const goBack = () => act(() => new Promise<void>((resolve) => {
  window.addEventListener('popstate', () => resolve(), { once: true });
  window.history.back();
}));

describe('app screen history', () => {
  it('preserves existing history state and pushes only real navigation changes', () => {
    window.history.replaceState({ preserved: true }, '');
    const push = vi.spyOn(window.history, 'pushState');
    const setScreen = vi.fn();
    const { rerender } = renderScreenHistory({ screen: 'HOME' }, setScreen);

    expect(window.history.state).toEqual({ preserved: true, appScreen: 'HOME' });
    expect(push).not.toHaveBeenCalled();
    rerender({ screen: 'SETUP' });
    expect(push).toHaveBeenCalledExactlyOnceWith({ preserved: true, appScreen: 'SETUP' }, document.title, '/x01/preparation');
    rerender({ screen: 'SETUP' });
    expect(push).toHaveBeenCalledOnce();
  });

  it('handles browser back/forward with fullscreen transitions without adding entries', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    const setScreen = vi.fn();
    const { rerender, unmount } = renderScreenHistory({ screen: 'HOME' }, setScreen);

    await act(() => Promise.resolve().then(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { appScreen: 'MATCH' } }));
    }));
    expect(enterFullScreen).toHaveBeenCalledOnce();
    expect(setScreen).toHaveBeenLastCalledWith('MATCH');
    rerender({ screen: 'MATCH' });
    expect(push).not.toHaveBeenCalled();

    await act(() => Promise.resolve().then(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { appScreen: 'STATS' } }));
    }));
    expect(exitFullScreen).toHaveBeenCalledOnce();
    rerender({ screen: 'STATS' });
    expect(push).not.toHaveBeenCalled();

    setScreen.mockClear();
    for (const state of [null, true, 'MATCH', 42, { appScreen: 'INVALID' }, { appScreen: 'STATS' }]) {
      await act(() => Promise.resolve().then(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state }));
      }));
    }
    expect(setScreen).not.toHaveBeenCalled();
    unmount();
    window.dispatchEvent(new PopStateEvent('popstate', { state: { appScreen: 'HOME' } }));
    expect(setScreen).not.toHaveBeenCalled();
  });

  it('mirrors the game and the step in the path along the journey (spec 135)', () => {
    const { rerender } = renderScreenHistory({ screen: 'HOME', game: 'CRICKET' });
    const paths = [window.location.pathname];
    for (const screen of ['GAME_SELECTION', 'SETUP', 'CRICKET_GAME', 'CRICKET_STATS'] as const) {
      rerender({ screen, game: 'CRICKET' });
      paths.push(window.location.pathname);
    }

    expect(paths).toEqual(['/', '/jeux', '/cricket/preparation', '/cricket/partie', '/cricket/fin']);
    expect(window.history.state).toEqual({ appScreen: 'CRICKET_STATS' });
  });

  it('rewrites an unknown or stale path on load without adding an entry', () => {
    window.history.replaceState(null, '', '/x01/partie');
    const push = vi.spyOn(window.history, 'pushState');
    const { rerender } = renderScreenHistory({ screen: 'HOME' });

    expect(window.location.pathname).toBe('/');
    rerender({ screen: 'SETUP', game: 'X01' });
    rerender({ screen: 'SETUP', game: 'KILLER' });
    expect(window.location.pathname).toBe('/killer/preparation');
    expect(push).toHaveBeenCalledOnce();
  });

  it('keeps the query string and the fragment', () => {
    window.history.replaceState(null, '', '/?v=1&game=x01&p1=A#top');
    const { rerender } = renderScreenHistory({ screen: 'SETUP' });

    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`)
      .toBe('/x01/preparation?v=1&game=x01&p1=A#top');
    rerender({ screen: 'MATCH' });
    expect(window.location.search).toBe('?v=1&game=x01&p1=A');
  });

  it('keeps every history entry on the path of the screen it restores', async () => {
    const setScreen = vi.fn();
    const { rerender } = renderScreenHistory({ screen: 'HOME' }, setScreen);
    rerender({ screen: 'GAME_SELECTION' });
    rerender({ screen: 'SETUP' });

    let shown: AppScreen = 'SETUP';
    for (let step = 0; step < 2; step += 1) {
      await goBack();
      shown = (setScreen.mock.lastCall?.[0] as AppScreen | undefined) ?? shown;
      rerender({ screen: shown });
      expect(window.history.state).toEqual({ appScreen: shown });
      expect(window.location.pathname).toBe(appScreenPath(shown, 'X01'));
    }
    expect(shown).toBe('GAME_SELECTION');
  });
});
