// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

import { useInstallPrompt } from '../../../src/features/app-install/useInstallPrompt';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useInstallPrompt display-mode subscription', () => {
  const mockDisplayMode = () => vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));

  it('opens and closes manual installation guidance when no native prompt is available', async () => {
    mockDisplayMode();
    const { result } = renderHook(useInstallPrompt);
    expect(result.current.canPromptDirectly).toBe(false);
    await act(() => result.current.openInstallFlow());
    expect(result.current.isGuideOpen).toBe(true);
    expect(result.current.guideSteps.length).toBeGreaterThan(0);
    act(() => result.current.closeGuide());
    expect(result.current.isGuideOpen).toBe(false);
  });

  it.each(['accepted', 'dismissed'] as const)('handles a native installation prompt that is %s', async (outcome) => {
    mockDisplayMode();
    const { result, unmount } = renderHook(useInstallPrompt);
    await act(() => result.current.openInstallFlow());
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt, userChoice: Promise.resolve({ outcome, platform: 'web' }),
    });
    act(() => { window.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.canPromptDirectly).toBe(true);
    await act(() => result.current.openInstallFlow());
    expect(prompt).toHaveBeenCalledOnce();
    expect(result.current.canPromptDirectly).toBe(false);
    expect(result.current.isGuideOpen).toBe(outcome === 'dismissed');
    unmount();
    const afterUnmount = new Event('beforeinstallprompt', { cancelable: true });
    window.dispatchEvent(afterUnmount);
    expect(afterUnmount.defaultPrevented).toBe(false);
  });

  it('propagates a native prompt failure instead of reporting installation success', async () => {
    mockDisplayMode();
    const { result } = renderHook(useInstallPrompt);
    const failure = new Error('Prompt failed');
    act(() => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), {
        prompt: vi.fn().mockRejectedValue(failure), userChoice: Promise.resolve({ outcome: 'accepted' }),
      }));
    });
    await act(async () => { await expect(result.current.openInstallFlow()).rejects.toThrow(failure); });
    expect(result.current.canPromptDirectly).toBe(true);
    expect(result.current.isGuideOpen).toBe(false);
  });

  it('updates installation visibility and removes the modern change listener', async () => {
    type DisplayModeChange = (event: { matches: boolean }) => void;
    const addEventListener = vi.fn<(type: 'change', listener: DisplayModeChange) => void>();
    const removeEventListener = vi.fn<(type: 'change', listener: DisplayModeChange) => void>();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener,
      removeEventListener,
    })));
    const { result, unmount } = renderHook(() => useInstallPrompt());
    expect(result.current.shouldShowInstallButton).toBe(true);
    const [eventName, listener] = addEventListener.mock.calls[0];
    expect(eventName).toBe('change');
    await act(() => Promise.resolve().then(() => listener({ matches: true })));
    expect(result.current.shouldShowInstallButton).toBe(false);
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', listener);
  });

  it('uses onchange without deprecated methods on older browsers and restores its previous value', async () => {
    const previousOnChange = vi.fn();
    const mediaQuery = {
      matches: false,
      onchange: previousOnChange,
    };
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery));
    const { result, unmount } = renderHook(() => useInstallPrompt());
    expect(result.current.shouldShowInstallButton).toBe(true);
    expect(mediaQuery.onchange).not.toBe(previousOnChange);
    await act(() => Promise.resolve().then(() => {
      mediaQuery.onchange({ matches: true });
    }));
    expect(result.current.shouldShowInstallButton).toBe(false);
    unmount();
    expect(mediaQuery.onchange).toBe(previousOnChange);
  });
});
