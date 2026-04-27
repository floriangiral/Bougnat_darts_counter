import { describe, expect, it, vi } from 'vitest';

import { ANALYTICS_EVENT } from '../../../src/domain/observability/analyticsDomain';
import { AnalyticsPort } from '../../../src/application/observability/analyticsPort';
import { syncFeatureFlags, trackGameEvent } from '../../../src/application/observability/analyticsUseCases';

describe('analytics application use-cases', () => {
  it('delegates feature-flag sync to the analytics port', () => {
    const setFeatureFlagsInDOM = vi.fn();
    const trackEvent = vi.fn();
    const port: AnalyticsPort = { setFeatureFlagsInDOM, trackEvent };

    syncFeatureFlags(port, { 'game-x01': true, screen: 'SETUP' });

    expect(setFeatureFlagsInDOM).toHaveBeenCalledWith({ 'game-x01': true, screen: 'SETUP' });
  });

  it('tracks game event with computed game flag', () => {
    const setFeatureFlagsInDOM = vi.fn();
    const trackEvent = vi.fn();
    const port: AnalyticsPort = { setFeatureFlagsInDOM, trackEvent };

    trackGameEvent(port, ANALYTICS_EVENT.GameFinished, 'CRICKET', {
      game_type: 'CRICKET',
      winner_id: 'player-1',
    });

    expect(trackEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENT.GameFinished,
      { game_type: 'CRICKET', winner_id: 'player-1' },
      { flags: ['game-cricket'] },
    );
  });
});
