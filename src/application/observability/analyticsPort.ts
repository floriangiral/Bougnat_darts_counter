import {
  AnalyticsPageView,
  AnalyticsPayload,
  FeatureFlags,
} from '../../domain/observability/analyticsDomain';

export interface AnalyticsPort {
  setFeatureFlagsInDOM: (flags: FeatureFlags) => void;
  trackEvent: (eventName: string, payload: AnalyticsPayload, options?: { flags?: string[] }) => void;
  trackPageView: (pageView: AnalyticsPageView) => void;
}
