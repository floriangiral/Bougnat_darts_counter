
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { App } from './App';
import { env } from './src/lib/env';
import { isLiveUpdateBlocked, setLiveUpdatePending } from './utils/appPersistence';

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
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

    navigator.serviceWorker.register(serviceWorkerUrl)
      .then(registration => {
        console.log('SW registered: ', registration);
        registration.update().catch((updateError) => {
          console.log('SW update check failed: ', updateError);
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch((updateError) => {
              console.log('SW refresh check failed: ', updateError);
            });
          }
        });
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
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
