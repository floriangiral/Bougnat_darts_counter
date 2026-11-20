// BOUGNAT_SW_KILL_SWITCH — rollback service worker (spec 031).
// Shipped as dist/sw.js when the build runs with BOUGNAT_PWA_KILL_SWITCH=true: it takes over
// immediately, deletes the Bougnat Darts caches and unregisters itself. It never touches
// IndexedDB or localStorage, so persisted matches survive; open pages reload through their own
// controllerchange handler, which still defers the reload during a protected scoring screen.
const CACHE_PREFIX = 'bougnat-darts-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.registration.unregister()),
  );
});
