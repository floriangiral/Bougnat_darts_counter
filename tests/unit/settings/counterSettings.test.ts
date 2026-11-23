// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getCounterSettings,
  resetCounterSettingsForTests,
  subscribeCounterSettings,
  updateCounterSettings,
} from '../../../src/app/counterSettingsController';
import {
  COUNTER_SETTINGS_STORAGE_KEY,
  DEFAULT_COUNTER_SETTINGS,
  DEFAULT_X01_SHORTCUTS,
  isValidShortcutScore,
  parseCounterSettings,
  parseShortcutDraft,
  sanitizeShortcutDraft,
  serializeCounterSettings,
  setX01Shortcut,
  updateX01Settings,
} from '../../../src/features/settings/counterSettings';
import { readCounterSettings, writeCounterSettings } from '../../../src/infrastructure/local/counterSettingsStore';

afterEach(() => {
  resetCounterSettingsForTests();
  localStorage.clear();
});

const stored = (x01: unknown, v: unknown = 1) => JSON.stringify({ v, x01 });

describe('counter settings (spec 129)', () => {
  it('defaults to voice off while keeping the other settings', () => {
    expect(DEFAULT_COUNTER_SETTINGS.x01).toEqual({
      checkoutHints: false,
      voiceAssist: false,
      mobileShortcutsBar: true,
      shortcuts: { left: [41, 45, 60, 100], right: [26, 81, 85, 140], mobile: [45, 60, 100, 81, 85, 140] },
    });
  });

  it('preserves an explicitly enabled voice preference', () => {
    expect(parseCounterSettings(stored({ voiceAssist: true })).x01.voiceAssist).toBe(true);
  });

  it('round-trips a versioned value', () => {
    const settings = setX01Shortcut(updateX01Settings(DEFAULT_COUNTER_SETTINGS, { checkoutHints: true, voiceAssist: false }), 'right', 3, 180);
    const raw = serializeCounterSettings(settings);
    expect(JSON.parse(raw)).toMatchObject({ v: 1, x01: { checkoutHints: true, voiceAssist: false } });
    expect(parseCounterSettings(raw)).toEqual(settings);
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['corrupted JSON', '{corrompu'],
    ['another version', stored({ checkoutHints: true }, 2)],
    ['a non-object', '"x01"'],
    ['an array', '[1,2]'],
  ])('falls back to defaults for a %s value', (_label, raw) => {
    expect(parseCounterSettings(raw)).toEqual(DEFAULT_COUNTER_SETTINGS);
  });

  it('validates field by field and resets an invalid shortcut group as a whole', () => {
    const parsed = parseCounterSettings(stored({
      checkoutHints: 'yes',
      voiceAssist: false,
      mobileShortcutsBar: 0,
      shortcuts: { left: [180, 0, 3, 60], right: [26, 81, 179, 140], mobile: [45, 60] },
    }));
    expect(parsed.x01).toEqual({
      checkoutHints: false,
      voiceAssist: false,
      mobileShortcutsBar: true,
      shortcuts: { left: [180, 0, 3, 60], right: DEFAULT_X01_SHORTCUTS.right, mobile: DEFAULT_X01_SHORTCUTS.mobile },
    });
    expect(parseCounterSettings(stored({ shortcuts: 'nope' })).x01.shortcuts).toEqual(DEFAULT_X01_SHORTCUTS);
    expect(parseCounterSettings(stored(null)).x01).toEqual(DEFAULT_COUNTER_SETTINGS.x01);
  });

  it('accepts only reachable three-dart totals as shortcuts', () => {
    expect([0, 3, 60, 170, 180].every(isValidShortcutScore)).toBe(true);
    expect([179, 181, -1, 1.5, '60', null].some(isValidShortcutScore)).toBe(false);
    expect(setX01Shortcut(DEFAULT_COUNTER_SETTINGS, 'left', 0, 179)).toBe(DEFAULT_COUNTER_SETTINGS);
    expect(setX01Shortcut(DEFAULT_COUNTER_SETTINGS, 'left', 4, 60)).toBe(DEFAULT_COUNTER_SETTINGS);
    expect(setX01Shortcut(DEFAULT_COUNTER_SETTINGS, 'left', -1, 60)).toBe(DEFAULT_COUNTER_SETTINGS);
    expect(setX01Shortcut(DEFAULT_COUNTER_SETTINGS, 'left', 0, 41)).toBe(DEFAULT_COUNTER_SETTINGS);
    expect(setX01Shortcut(DEFAULT_COUNTER_SETTINGS, 'mobile', 5, 57).x01.shortcuts.mobile).toEqual([45, 60, 100, 81, 85, 57]);
    expect(sanitizeShortcutDraft('a1809')).toBe('180');
    expect(parseShortcutDraft('')).toBeNull();
    expect(parseShortcutDraft('179')).toBeNull();
    expect(parseShortcutDraft('060')).toBe(60);
  });

  it('reads and writes the device preference without ever throwing', () => {
    expect(readCounterSettings()).toEqual(DEFAULT_COUNTER_SETTINGS);
    const settings = updateX01Settings(DEFAULT_COUNTER_SETTINGS, { checkoutHints: true });
    writeCounterSettings(settings);
    expect(localStorage.getItem(COUNTER_SETTINGS_STORAGE_KEY)).toBe(serializeCounterSettings(settings));
    expect(readCounterSettings()).toEqual(settings);

    const failing = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('quota'); },
    };
    expect(readCounterSettings(failing)).toEqual(DEFAULT_COUNTER_SETTINGS);
    expect(() => writeCounterSettings(settings, failing)).not.toThrow();
    expect(readCounterSettings(null)).toEqual(DEFAULT_COUNTER_SETTINGS);
  });

  it('shares one cached value, persists updates and notifies subscribers only on change', () => {
    localStorage.setItem(COUNTER_SETTINGS_STORAGE_KEY, stored({ voiceAssist: false }));
    expect(getCounterSettings().x01.voiceAssist).toBe(false);
    const listener = vi.fn();
    const unsubscribe = subscribeCounterSettings(listener);
    updateCounterSettings((current) => current);
    expect(listener).not.toHaveBeenCalled();
    updateCounterSettings((current) => updateX01Settings(current, { mobileShortcutsBar: false }));
    expect(listener).toHaveBeenCalledOnce();
    expect(parseCounterSettings(localStorage.getItem(COUNTER_SETTINGS_STORAGE_KEY)).x01).toMatchObject({ voiceAssist: false, mobileShortcutsBar: false });
    unsubscribe();
    updateCounterSettings((current) => updateX01Settings(current, { mobileShortcutsBar: true }));
    expect(listener).toHaveBeenCalledOnce();
  });
});
