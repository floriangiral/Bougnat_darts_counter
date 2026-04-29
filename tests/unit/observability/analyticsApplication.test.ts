import { describe, expect, it, vi } from 'vitest';

import {
  ANALYTICS_EVENT,
  buildAnalyticsPageView,
} from '../../../src/domain/observability/analyticsDomain';
import { AnalyticsPort } from '../../../src/application/observability/analyticsPort';
import {
  syncFeatureFlags,
  trackAnalyticsEvent,
  trackGameEvent,
  trackPageView,
} from '../../../src/application/observability/analyticsUseCases';

describe('analytics application use-cases', () => {
  it('delegates feature-flag sync to the analytics port', () => {
    const setFeatureFlagsInDOM = vi.fn();
    const trackEvent = vi.fn();
    const trackPageView = vi.fn();
    const port: AnalyticsPort = { setFeatureFlagsInDOM, trackEvent, trackPageView };

    syncFeatureFlags(port, { 'game-x01': true, screen: 'SETUP' });

    expect(setFeatureFlagsInDOM).toHaveBeenCalledWith({ 'game-x01': true, screen: 'SETUP' });
  });

  it('tracks game event without overriding automatic flag attribution', () => {
    const setFeatureFlagsInDOM = vi.fn();
    const trackEvent = vi.fn();
    const trackPageView = vi.fn();
    const port: AnalyticsPort = { setFeatureFlagsInDOM, trackEvent, trackPageView };

    trackGameEvent(port, ANALYTICS_EVENT.GameFinished, 'CRICKET', {
      game_type: 'CRICKET',
      winner_id: 'player-1',
    });

    expect(trackEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENT.GameFinished,
      { game_type: 'CRICKET', winner_id: 'player-1' },
    );
  });

  it('tracks generic analytics events without overriding flag attribution', () => {
    const setFeatureFlagsInDOM = vi.fn();
    const trackEvent = vi.fn();
    const trackPageView = vi.fn();
    const port: AnalyticsPort = { setFeatureFlagsInDOM, trackEvent, trackPageView };

    trackAnalyticsEvent(port, ANALYTICS_EVENT.ScreenView, {
      screen: 'SETUP',
      previous_screen: 'GAME_SELECTION',
      game_type: 'GOTCHA',
    });

    expect(trackEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENT.ScreenView,
      { screen: 'SETUP', previous_screen: 'GAME_SELECTION', game_type: 'GOTCHA' },
    );
  });

  it('delegates SPA pageviews to the analytics port', () => {
    const setFeatureFlagsInDOM = vi.fn();
    const trackEvent = vi.fn();
    const trackPageViewPort = vi.fn();
    const port: AnalyticsPort = {
      setFeatureFlagsInDOM,
      trackEvent,
      trackPageView: trackPageViewPort,
    };

    const pageView = buildAnalyticsPageView('TRIATHLON_GAME', 'TRIATHLON');
    trackPageView(port, pageView);

    expect(trackPageViewPort).toHaveBeenCalledWith({
      route: '/app/triathlon/match',
      path: '/app/triathlon/match',
    });
  });

  it('builds setup pageviews from the selected game type', () => {
    expect(buildAnalyticsPageView('SETUP', 'GOTCHA')).toEqual({
      route: '/app/gotcha/setup',
      path: '/app/gotcha/setup',
    });
  });
});
