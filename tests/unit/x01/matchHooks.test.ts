// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetCounterSettingsForTests } from '../../../src/app/counterSettingsController';
import { COUNTER_SETTINGS_STORAGE_KEY } from '../../../src/features/settings/counterSettings';
import { useMatchShortcuts } from '../../../src/features/x01/hooks/useMatchShortcuts';
import { useMatchTimer } from '../../../src/features/x01/hooks/useMatchTimer';
import type { MatchState } from '../../../types';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  resetCounterSettingsForTests();
  localStorage.clear();
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

  it.each([
    ['left', 4], ['right', 4], ['mobile', 6],
  ] as const)('sanitizes %s drafts while typing and saves only a valid score on commit', (side, size) => {
    const { result } = renderHook(useMatchShortcuts);
    const getValues = () => ({ left: result.current.shortcutsLeft, right: result.current.shortcutsRight, mobile: result.current.shortcutsMobile })[side];
    const getDrafts = () => ({ left: result.current.leftShortcutDrafts, right: result.current.rightShortcutDrafts, mobile: result.current.mobileShortcutDrafts })[side];
    const initial = getValues()[0];
    act(() => result.current.handleShortcutDraftChange(side, 0, 'a1809'));
    expect(getDrafts()[0]).toBe('180');
    expect(getValues()[0]).toBe(initial);
    act(() => result.current.commitShortcutDraft(side, 0));
    expect(getValues()[0]).toBe(180);
    expect(getDrafts()[0]).toBe('180');
    for (const invalid of ['', '999', '179']) {
      act(() => result.current.handleShortcutDraftChange(side, 0, invalid));
      expect(getDrafts()[0]).toBe(invalid);
      act(() => result.current.commitShortcutDraft(side, 0));
      expect(getValues()[0]).toBe(180);
      expect(getDrafts()[0]).toBe('180');
    }
    act(() => result.current.handleShortcutDraftChange(side, 1, '0'));
    act(() => result.current.commitShortcutDraft(side, 1));
    expect(getValues()[1]).toBe(0);
    expect(getDrafts()[1]).toBe('0');
    expect(getValues()).toHaveLength(size);
  });

  it('keeps the saved score when an invalid value is typed digit by digit (179, 666)', () => {
    const { result } = renderHook(useMatchShortcuts);
    const saved = result.current.shortcutsMobile[0];
    for (const typed of ['179', '666']) {
      for (let length = 1; length <= typed.length; length++) {
        act(() => result.current.handleShortcutDraftChange('mobile', 0, typed.slice(0, length)));
      }
      expect(result.current.shortcutsMobile[0]).toBe(saved);
      act(() => result.current.commitShortcutDraft('mobile', 0));
      expect(result.current.shortcutsMobile[0]).toBe(saved);
      expect(result.current.mobileShortcutDrafts[0]).toBe(String(saved));
    }
  });

  it('shows the phone shortcut bar by default and toggles it without touching its values', () => {
    const { result } = renderHook(useMatchShortcuts);
    expect(result.current.mobileShortcutsEnabled).toBe(true);
    expect(result.current.shortcutsMobile).toEqual([45, 60, 100, 81, 85, 140]);
    act(() => result.current.toggleMobileShortcuts());
    expect(result.current.mobileShortcutsEnabled).toBe(false);
    act(() => result.current.toggleMobileShortcuts());
    expect(result.current.mobileShortcutsEnabled).toBe(true);
    expect(result.current.shortcutsMobile).toEqual([45, 60, 100, 81, 85, 140]);
  });

  it('starts from the saved device preference and keeps edits for the next match (spec 129)', () => {
    localStorage.setItem(COUNTER_SETTINGS_STORAGE_KEY, JSON.stringify({ v: 1, x01: { mobileShortcutsBar: false, shortcuts: { left: [1, 2, 3, 4] } } }));
    const first = renderHook(useMatchShortcuts);
    expect(first.result.current.mobileShortcutsEnabled).toBe(false);
    expect(first.result.current.shortcutsLeft).toEqual([1, 2, 3, 4]);
    expect(first.result.current.leftShortcutDrafts).toEqual(['1', '2', '3', '4']);
    act(() => first.result.current.handleShortcutDraftChange('right', 0, '57'));
    act(() => first.result.current.commitShortcutDraft('right', 0));
    act(() => first.result.current.toggleMobileShortcuts());
    first.unmount();

    const next = renderHook(useMatchShortcuts);
    expect(next.result.current.shortcutsRight).toEqual([57, 81, 85, 140]);
    expect(next.result.current.rightShortcutDrafts[0]).toBe('57');
    expect(next.result.current.mobileShortcutsEnabled).toBe(true);
  });
});

describe('match timer', () => {
  it('counts only a started active match, preserves elapsed state and cleans up intervals', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T12:00:00Z'));
    const { result, rerender, unmount } = renderHook(
      (props: { matchStatus: MatchState['status']; hasGameStarted: boolean }) =>
        useMatchTimer({ ...props, initialElapsedSeconds: 12 }),
      { initialProps: { matchStatus: 'active', hasGameStarted: false } },
    );
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(2000); }));
    expect(result.current.elapsedSeconds).toBe(12);
    expect(result.current.currentTime).toBe(new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    }));
    rerender({ matchStatus: 'active', hasGameStarted: true });
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(3000); }));
    expect(result.current.elapsedSeconds).toBe(15);
    rerender({ matchStatus: 'finished', hasGameStarted: true });
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(2000); }));
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
