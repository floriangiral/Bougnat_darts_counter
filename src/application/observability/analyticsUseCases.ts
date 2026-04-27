import { GameType } from '../../../utils/arenaFlow';
import {
  AnalyticsPayload,
  FeatureFlags,
} from '../../domain/observability/analyticsDomain';
import { AnalyticsPort } from './analyticsPort';

export const syncFeatureFlags = (analytics: AnalyticsPort, flags: FeatureFlags) => {
  analytics.setFeatureFlagsInDOM(flags);
};

export const trackGameEvent = (
  analytics: AnalyticsPort,
  eventName: string,
  _gameType: GameType,
  payload: AnalyticsPayload,
) => {
  analytics.trackEvent(eventName, payload);
};

export const trackAnalyticsEvent = (
  analytics: AnalyticsPort,
  eventName: string,
  payload: AnalyticsPayload,
) => {
  analytics.trackEvent(eventName, payload);
};
