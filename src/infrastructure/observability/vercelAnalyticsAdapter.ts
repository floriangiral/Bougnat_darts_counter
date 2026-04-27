import { track } from '@vercel/analytics';
import { AnalyticsPort } from '../../application/observability/analyticsPort';
import { AnalyticsPayload, FeatureFlags } from '../../domain/observability/analyticsDomain';

const DATA_FLAGS_SELECTOR = 'script[data-flag-values]';

const setFeatureFlagsInDOM = (flags: FeatureFlags) => {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector(DATA_FLAGS_SELECTOR);
  const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script');
  script.type = 'application/json';
  script.setAttribute('data-flag-values', '');
  script.textContent = JSON.stringify(flags);
  if (!existing) {
    document.head.appendChild(script);
  }
};

const trackEvent = (eventName: string, payload: AnalyticsPayload, options?: { flags?: string[] }) => {
  track(eventName, payload, options);
};

export const createVercelAnalyticsPort = (): AnalyticsPort => ({
  setFeatureFlagsInDOM,
  trackEvent,
});
