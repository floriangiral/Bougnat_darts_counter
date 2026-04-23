import { describe, expect, it } from 'vitest';

import {
  getAppAccessMode,
  isAppScreen,
  isFullscreenScreen,
  isScreenAllowedForAccessMode,
} from '../../../src/app/appShell';

// Spec ref: spec:counter/scoring-access-modes
describe('appShell', () => {
  it('accepts only declared screens', () => {
    expect(isAppScreen('MATCH')).toBe(true);
    expect(isAppScreen('GAME_SELECTION')).toBe(true);
    expect(isAppScreen('UNKNOWN')).toBe(false);
    expect(isAppScreen(null)).toBe(false);
  });

  it('marks only gameplay screens as fullscreen', () => {
    expect(isFullscreenScreen('MATCH')).toBe(true);
    expect(isFullscreenScreen('CRICKET_GAME')).toBe(true);
    expect(isFullscreenScreen('GAME_SELECTION')).toBe(false);
    expect(isFullscreenScreen('STATS')).toBe(false);
  });

  it('resolves access mode with query override before environment', () => {
    expect(getAppAccessMode({ search: '?mode=personal_phone', envMode: 'local' })).toBe('personal_phone');
    expect(getAppAccessMode({ search: '', envMode: 'dedicated_tablet' })).toBe('dedicated_tablet');
    expect(getAppAccessMode({ search: '?mode=unknown', envMode: 'local' })).toBe('local');
  });

  it('keeps only scoring screens accessible in every supported mode', () => {
    expect(isScreenAllowedForAccessMode('HOME', 'dedicated_tablet')).toBe(false);
    expect(isScreenAllowedForAccessMode('HOME', 'personal_phone')).toBe(false);
    expect(isScreenAllowedForAccessMode('MATCH', 'dedicated_tablet')).toBe(true);
    expect(isScreenAllowedForAccessMode('MATCH', 'personal_phone')).toBe(true);
    expect(isScreenAllowedForAccessMode('STATS', 'local')).toBe(true);
  });
});
