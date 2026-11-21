
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles/tailwind.css';
import { App } from './App';
import { env } from './src/lib/env';
import {
  applyLegacyCssCapabilityClasses,
  detectLegacyCssCapabilities,
} from './src/infrastructure/web/legacySupport';
import {
  startServiceWorkerUpdates,
  unregisterServiceWorkers,
} from './src/infrastructure/web/serviceWorkerUpdates';
import { isLiveUpdateBlocked, setLiveUpdatePending } from './utils/appPersistence';
import { isExternalMatchLinkAttempt } from './src/features/external-match/externalMatchLink';
import { startThemeSync } from './src/app/themeController';

const logRuntimeInfo = (...args: unknown[]) => {
  if (env.VITE_LOG_LEVEL === 'debug') {
    console.info(...args);
  }
};

const installWebAnalyticsBeacon = (token: string) => {
  if (typeof document === 'undefined' || !token.trim()) {
    return;
  }

  if (document.querySelector('script[data-cf-beacon]')) {
    return;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({ token: token.trim() }));
  document.head.appendChild(script);
};

if (typeof document !== 'undefined') {
  // Spec ref: specs/018-counter-ios12-compatibility/spec.md (E2, invariants 1/3).
  const capabilities = detectLegacyCssCapabilities(document);
  applyLegacyCssCapabilityClasses(document, capabilities);
  // Spec 069: the inline script of index.html already applied the theme; keep it in sync from now on.
  startThemeSync();
  // Spec 030 (Révision V2, Q4): a link load carries player names and the partner return URL.
  if (!isExternalMatchLinkAttempt(window.location.search)) {
    installWebAnalyticsBeacon(env.VITE_CF_WEB_ANALYTICS_TOKEN);
  }
}

// Service Worker Registration for PWA (spec 031)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  startServiceWorkerUpdates({
    serviceWorker: navigator.serviceWorker,
    document,
    reload: () => window.location.reload(),
    isLiveUpdateBlocked,
    setLiveUpdatePending,
    log: logRuntimeInfo,
  }, window);
}

if ('serviceWorker' in navigator && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    void unregisterServiceWorkers(navigator.serviceWorker, logRuntimeInfo);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
