// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMatchShortcuts } from '../../../src/features/x01/hooks/useMatchShortcuts';
import { useMatchTimer } from '../../../src/features/x01/hooks/useMatchTimer';
import type { MatchState } from '../../../types';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('match shortcuts', () => {
  it('tracks responsive mode and removes its resize subscription on unmount', () => {
    vi.stubGlobal('innerWidth', 767);
    const remove = vi.spyOn(window, 'removeEventListener');
    const { result, unmount } = renderHook(useMatchShortcuts);
    expect(result.current.canCustomizeSideShortcuts).toBe(false);
    act(() => {
      vi.stubGlobal('innerWidth', 768);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.canCustomizeSideShortcuts).toBe(true);
    unmount();
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    vi.unstubAllGlobals();
  });

  it.each(['left', 'right'] as const)('validates, sanitizes and resets %s drafts', (side) => {
    const { result } = renderHook(useMatchShortcuts);
    const getValues = () => side === 'left' ? result.current.shortcutsLeft : result.current.shortcutsRight;
    const getDrafts = () => side === 'left' ? result.current.leftShortcutDrafts : result.current.rightShortcutDrafts;
    act(() => result.current.handleShortcutDraftChange(side, 0, 'a1809'));
    expect(getValues()[0]).toBe(180);
    expect(getDrafts()[0]).toBe('180');
    for (const invalid of ['', '999', '179']) {
      act(() => result.current.handleShortcutDraftChange(side, 0, invalid));
      expect(getValues()[0]).toBe(180);
      expect(getDrafts()[0]).toBe(invalid);
    }
    act(() => result.current.resetShortcutDraft(side, 0));
    expect(getDrafts()[0]).toBe('180');
    act(() => result.current.handleShortcutDraftChange(side, 1, '0'));
    expect(getValues()[1]).toBe(0);
    expect(getDrafts()[1]).toBe('0');
    expect(getValues()).toHaveLength(4);
  });
});

describe('match timer', () => {
  it('counts only a started active match, preserves elapsed state and cleans up intervals', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T12:00:00Z'));
    const { result, rerender, unmount } = renderHook(
      (props: { matchStatus: MatchState['status']; hasGameStarted: boolean }) =>
        useMatchTimer({ ...props, initialElapsedSeconds: 12 }),
      { initialProps: { matchStatus: 'active' as MatchState['status'], hasGameStarted: false } },
    );
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.elapsedSeconds).toBe(12);
    expect(result.current.currentTime).toBe(new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    }));
    rerender({ matchStatus: 'active', hasGameStarted: true });
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.elapsedSeconds).toBe(15);
    rerender({ matchStatus: 'finished', hasGameStarted: true });
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.elapsedSeconds).toBe(15);
    act(() => result.current.setElapsedSeconds(42));
    expect(result.current.elapsedSeconds).toBe(42);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts elapsed time at zero by default', () => {
    const { result } = renderHook(() => useMatchTimer({ matchStatus: 'active', hasGameStarted: false }));
    expect(result.current.elapsedSeconds).toBe(0);
  });
});
