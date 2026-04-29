import { pageview, track } from '@vercel/analytics';
import { AnalyticsPort } from '../../application/observability/analyticsPort';
import {
  AnalyticsPageView,
  AnalyticsPayload,
  FeatureFlags,
} from '../../domain/observability/analyticsDomain';

const DATA_FLAGS_SELECTOR = 'script[data-flag-values]';

const serializeFlagsForScriptTag = (flags: FeatureFlags) =>
  JSON.stringify(flags)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const setFeatureFlagsInDOM = (flags: FeatureFlags) => {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector(DATA_FLAGS_SELECTOR);
  const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script');
  script.type = 'application/json';
  script.setAttribute('data-flag-values', '');
  script.textContent = serializeFlagsForScriptTag(flags);
  if (!existing) {
    document.head.appendChild(script);
  }
};

const trackEvent = (eventName: string, payload: AnalyticsPayload, options?: { flags?: string[] }) => {
  track(eventName, payload, options);
};

const trackPageView = ({ route, path }: AnalyticsPageView) => {
  pageview({ route, path });
};

export const createVercelAnalyticsPort = (): AnalyticsPort => ({
  setFeatureFlagsInDOM,
  trackEvent,
  trackPageView,
});
