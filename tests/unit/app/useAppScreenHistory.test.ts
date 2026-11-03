// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppScreen } from '../../../src/app/appShell';
import { useAppScreenHistory } from '../../../src/app/useAppScreenHistory';
import { enterFullScreen, exitFullScreen } from '../../../utils/uiUtils';

vi.mock('../../../utils/uiUtils', () => ({
  enterFullScreen: vi.fn(),
  exitFullScreen: vi.fn(),
}));

afterEach(cleanup);

describe('app screen history', () => {
  it('preserves existing history state and pushes only real navigation changes', () => {
    window.history.replaceState({ preserved: true }, '');
    const push = vi.spyOn(window.history, 'pushState');
    const setScreen = vi.fn();
    const { rerender } = renderHook(({ screen }: { screen: AppScreen }) =>
      useAppScreenHistory(screen, setScreen), { initialProps: { screen: 'HOME' } });

    expect(window.history.state).toEqual({ preserved: true, appScreen: 'HOME' });
    expect(push).not.toHaveBeenCalled();
    rerender({ screen: 'SETUP' });
    expect(push).toHaveBeenCalledExactlyOnceWith({ preserved: true, appScreen: 'SETUP' }, document.title);
    rerender({ screen: 'SETUP' });
    expect(push).toHaveBeenCalledOnce();
  });

  it('handles browser back/forward with fullscreen transitions without adding entries', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    const setScreen = vi.fn();
    const { rerender, unmount } = renderHook(({ screen }: { screen: AppScreen }) =>
      useAppScreenHistory(screen, setScreen), { initialProps: { screen: 'HOME' } });

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
});
