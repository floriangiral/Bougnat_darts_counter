
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './src/styles/tailwind.css';
import { App } from './App';
import { env } from './src/lib/env';
import {
  applyLegacyCssCapabilityClasses,
  detectLegacyCssCapabilities,
} from './src/infrastructure/web/legacySupport';
import { isLiveUpdateBlocked, setLiveUpdatePending } from './utils/appPersistence';

const logRuntimeInfo = (...args: unknown[]) => {
  if (env.VITE_LOG_LEVEL === 'debug') {
    console.info(...args);
  }
};

if (typeof document !== 'undefined') {
  // Spec ref: specs/018-counter-ios12-compatibility/spec.md (E2, invariants 1/3).
  const capabilities = detectLegacyCssCapabilities(document);
  applyLegacyCssCapabilityClasses(document, capabilities);
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    let hasReloadedForUpdate = false;
    const serviceWorkerUrl = `/sw.js?appVersion=${encodeURIComponent(env.VITE_APP_VERSION)}`;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasReloadedForUpdate) return;
      if (isLiveUpdateBlocked()) {
        setLiveUpdatePending(true);
        return;
      }
      hasReloadedForUpdate = true;
      window.location.reload();
    });

    navigator.serviceWorker.register(serviceWorkerUrl, { updateViaCache: 'none' })
      .then(registration => {
        logRuntimeInfo('SW registered');
        registration.update().catch((updateError) => {
          logRuntimeInfo('SW update check failed', updateError);
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch((updateError) => {
              logRuntimeInfo('SW refresh check failed', updateError);
            });
          }
        });
      })
      .catch(registrationError => {
        logRuntimeInfo('SW registration failed', registrationError);
      });
  });
}

if ('serviceWorker' in navigator && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch((error) => {
        logRuntimeInfo('SW cleanup failed', error);
      });
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
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
