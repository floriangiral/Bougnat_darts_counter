import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_FLAG,
  buildGameFeatureFlags,
  flagNameForGameType,
} from '../../../src/domain/observability/analyticsDomain';

describe('analytics domain', () => {
  it('maps each game type to a stable feature-flag name', () => {
    expect(flagNameForGameType('X01')).toBe(ANALYTICS_FLAG.GameX01);
    expect(flagNameForGameType('CRICKET')).toBe(ANALYTICS_FLAG.GameCricket);
    expect(flagNameForGameType('CAPITAL')).toBe(ANALYTICS_FLAG.GameCapital);
    expect(flagNameForGameType('GOTCHA')).toBe(ANALYTICS_FLAG.GameGotcha);
    expect(flagNameForGameType('KILLER')).toBe(ANALYTICS_FLAG.GameKiller);
    expect(flagNameForGameType('TRIATHLON')).toBe(ANALYTICS_FLAG.GameTriathlon);
  });

  it('builds feature-flags for the selected game and runtime context', () => {
    const flags = buildGameFeatureFlags({
      selectedGameType: 'CAPITAL',
      screen: 'CAPITAL_GAME',
      isDoubles: false,
      voiceScoringEnabled: true,
      appAccessMode: 'dedicated_tablet',
    });

    expect(flags[ANALYTICS_FLAG.GameCapital]).toBe(true);
    expect(flags[ANALYTICS_FLAG.GameX01]).toBe(false);
    expect(flags[ANALYTICS_FLAG.GameKiller]).toBe(false);
    expect(flags.screen).toBe('CAPITAL_GAME');
    expect(flags['mode-doubles']).toBe(false);
    expect(flags['voice-scoring-enabled']).toBe(true);
    expect(flags['app-access-mode']).toBe('dedicated_tablet');
  });
});
