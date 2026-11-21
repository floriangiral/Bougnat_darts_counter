// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (Révision V2).
// BUILD_ID and PRECACHE_URLS are injected into dist/sw.js by scripts/generate-sw-precache.mjs.
const BUILD_ID = '__BOUGNAT_BUILD_ID__';
const PRECACHE_URLS = ['/']; // __BOUGNAT_PRECACHE_URLS__
const CACHE_PREFIX = 'bougnat-darts-';
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const SHELL_URL = '/';
const PRECACHE_PATHS = new Set(PRECACHE_URLS);

self.addEventListener('install', (event) => {
  // No skipWaiting here: the page activates an update only outside protected screens.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'no-cache' })))),
  );
});

self.addEventListener('message', (event) => {
  if (event.origin === self.location.origin && event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

const putInCache = (key, response) => caches.open(CACHE_NAME).then((cache) => cache.put(key, response));

const handleNavigation = (event) => fetch(event.request)
  .then((response) => {
    if (response.ok && !response.redirected) {
      event.waitUntil(putInCache(SHELL_URL, response.clone()));
    }
    return response;
  })
  .catch(() => caches.open(CACHE_NAME)
    .then((cache) => cache.match(SHELL_URL))
    .then((cached) => cached || Response.error()));

const handleAsset = (event, url) => caches.open(CACHE_NAME).then((cache) => {
  if (PRECACHE_PATHS.has(url.pathname)) {
    return cache.match(url.pathname).then((cached) => cached || fetch(event.request));
  }

  return cache.match(event.request).then((cached) => {
    const network = fetch(event.request).then((response) => {
      if (response.status === 200 && response.type === 'basic') {
        event.waitUntil(cache.put(event.request, response.clone()));
      }
      return response;
    });

    if (cached) {
      event.waitUntil(network.catch(() => undefined));
      return cached;
    }
    return network;
  });
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  event.respondWith(handleAsset(event, url));
});
