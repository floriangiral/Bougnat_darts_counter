import { GameType } from '../../../utils/arenaFlow';
import {
  AnalyticsPayload,
  FeatureFlags,
  flagNameForGameType,
} from '../../domain/observability/analyticsDomain';
import { AnalyticsPort } from './analyticsPort';

export const syncFeatureFlags = (analytics: AnalyticsPort, flags: FeatureFlags) => {
  analytics.setFeatureFlagsInDOM(flags);
};

export const trackGameEvent = (
  analytics: AnalyticsPort,
  eventName: string,
  gameType: GameType,
  payload: AnalyticsPayload,
) => {
  analytics.trackEvent(eventName, payload, { flags: [flagNameForGameType(gameType)] });
};
