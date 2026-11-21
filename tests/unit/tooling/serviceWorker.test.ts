import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

import { injectServiceWorker } from '../../../scripts/lib/pwaBuild.mjs';

// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (V2-FR-04..06, V2-NFR-02, V2-AC-06)
const ROOT = path.resolve(__dirname, '../../..');
const ORIGIN = 'https://play.bougnatdarts.fr';
const BUILD_ID = 'a1b2c3d4e5f6';
const CACHE_NAME = `bougnat-darts-${BUILD_ID}`;
const PRECACHE_URLS = ['/', '/assets/index-abc.js', '/app-qr.svg', '/manifest.json'];

type FakeResponse = {
  body: string;
  status: number;
  ok: boolean;
  type: string;
  redirected: boolean;
  clone: () => FakeResponse;
};

const response = (body: string, init: Partial<Pick<FakeResponse, 'status' | 'type' | 'redirected'>> = {}): FakeResponse => {
  const status = init.status ?? 200;
  const value: FakeResponse = {
    body,
    status,
    ok: status >= 200 && status < 300,
    type: init.type ?? 'basic',
    redirected: init.redirected ?? false,
    clone: () => response(body, init),
  };
  return value;
};

class FakeRequest {
  url: string;
  cache?: string;
  method = 'GET';
  constructor(url: string, init: { cache?: string } = {}) {
    this.url = new URL(url, ORIGIN).href;
    this.cache = init.cache;
  }
}

type Listener = (event: unknown) => void;

const loadWorker = (source: string, existingCaches: string[] = []) => {
  const listeners = new Map<string, Listener>();
  const stores = new Map<string, Map<string, FakeResponse>>();
  existingCaches.forEach((name) => stores.set(name, new Map()));
  const keyOf = (request: string | { url: string }) => (typeof request === 'string' ? new URL(request, ORIGIN).href : request.url);
  const fetchMock = vi.fn<(request: unknown) => Promise<FakeResponse>>();
  const added: FakeRequest[] = [];

  const openStore = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      addAll: async (requests: FakeRequest[]) => {
        for (const request of requests) {
          added.push(request);
          const res = await fetchMock(request);
          if (!res.ok) throw new TypeError('addAll failed');
          store.set(request.url, res);
        }
      },
      put: (request: string | { url: string }, res: FakeResponse) => {
        store.set(keyOf(request), res);
        return Promise.resolve();
      },
      match: (request: string | { url: string }) => Promise.resolve(store.get(keyOf(request))),
    };
  };

  const self = {
    location: new URL(`${ORIGIN}/sw.js`),
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: vi.fn(() => Promise.resolve()),
    clients: { claim: vi.fn(() => Promise.resolve()) },
    registration: { unregister: vi.fn(() => Promise.resolve(true)) },
  };
  const caches = {
    open: (name: string) => Promise.resolve(openStore(name)),
    keys: () => Promise.resolve([...stores.keys()]),
    delete: (name: string) => Promise.resolve(stores.delete(name)),
  };
  const errorResponse = response('', { status: 0, type: 'error' });
  const context = vm.createContext({
    self,
    caches,
    fetch: fetchMock,
    Request: FakeRequest,
    Response: { error: () => errorResponse },
    URL,
  });
  // Source contrôlée du dépôt, injectée par le générateur PWA puis exécutée dans un contexte sans accès système.
  new vm.Script(source).runInContext(context); // lgtm[js/hardcoded-data-interpreted-as-code]

  const dispatch = async (type: string, event: Record<string, unknown> = {}) => {
    const pending: Promise<unknown>[] = [];
    let responded: Promise<FakeResponse> | undefined;
    const respondWith = vi.fn((value: Promise<FakeResponse>) => { responded = value; });
    listeners.get(type)?.({ ...event, waitUntil: (promise: Promise<unknown>) => pending.push(promise), respondWith });
    const result = responded ? await responded : undefined;
    for (let settled = 0; settled < pending.length; settled = pending.length) {
      await Promise.all(pending);
    }
    return { result, respondWith };
  };

  const fetchEvent = (url: string, init: { method?: string; mode?: string } = {}) =>
    dispatch('fetch', { request: { url: new URL(url, ORIGIN).href, method: init.method ?? 'GET', mode: init.mode ?? 'no-cors' } });

  return { self, stores, listeners, fetchMock, added, dispatch, fetchEvent, errorResponse, keyOf };
};

const workerSource = injectServiceWorker(readFileSync(path.join(ROOT, 'public', 'sw.js'), 'utf8'), {
  buildId: BUILD_ID,
  urls: PRECACHE_URLS,
});
const killSwitchSource = readFileSync(path.join(ROOT, 'scripts', 'pwa', 'sw-kill-switch.js'), 'utf8');

const withoutComments = (source: string) => source.replace(/\/\/.*$/gm, '');

const installedWorker = async (existingCaches: string[] = []) => {
  const worker = loadWorker(workerSource, existingCaches);
  worker.fetchMock.mockImplementation((request) => Promise.resolve(response(`precache:${(request as FakeRequest).url}`)));
  await worker.dispatch('install');
  worker.fetchMock.mockReset();
  return worker;
};

describe('public/sw.js', () => {
  it('precaches the generated list with revalidation and waits instead of skipping', async () => {
    const worker = await installedWorker();
    expect(worker.added.map((request) => [request.url, request.cache])).toEqual(
      PRECACHE_URLS.map((url) => [new URL(url, ORIGIN).href, 'no-cache']),
    );
    expect([...worker.stores.get(CACHE_NAME)!.keys()]).toHaveLength(PRECACHE_URLS.length);
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
  });

  it('activates only when the page posts SKIP_WAITING', async () => {
    const worker = loadWorker(workerSource);
    await worker.dispatch('message', { origin: ORIGIN, data: { type: 'OTHER' } });
    await worker.dispatch('message', { origin: ORIGIN, data: null });
    await worker.dispatch('message', { data: { type: 'SKIP_WAITING' } });
    await worker.dispatch('message', { origin: 'https://malicious.example', data: { type: 'SKIP_WAITING' } });
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
    await worker.dispatch('message', { origin: ORIGIN, data: { type: 'SKIP_WAITING' } });
    expect(worker.self.skipWaiting).toHaveBeenCalledTimes(1);
  });

  it('purges only obsolete Bougnat Darts caches on activation and claims clients', async () => {
    const worker = loadWorker(workerSource, ['bougnat-darts-dev', 'bougnat-darts-old', CACHE_NAME, 'third-party-cache']);
    await worker.dispatch('activate');
    expect([...worker.stores.keys()]).toEqual([CACHE_NAME, 'third-party-cache']);
    expect(worker.self.clients.claim).toHaveBeenCalledTimes(1);
  });

  it('serves navigations network-first and caches the shell only from ok, non-redirected responses', async () => {
    const worker = await installedWorker();
    const shellKey = worker.keyOf('/');

    worker.fetchMock.mockResolvedValueOnce(response('fresh shell'));
    expect((await worker.fetchEvent('/?source=pwa', { mode: 'navigate' })).result?.body).toBe('fresh shell');
    expect(worker.stores.get(CACHE_NAME)!.get(shellKey)?.body).toBe('fresh shell');

    worker.fetchMock.mockResolvedValueOnce(response('redirected', { redirected: true }));
    expect((await worker.fetchEvent('/index.html', { mode: 'navigate' })).result?.body).toBe('redirected');
    worker.fetchMock.mockResolvedValueOnce(response('server error', { status: 500 }));
    expect((await worker.fetchEvent('/', { mode: 'navigate' })).result?.body).toBe('server error');
    expect(worker.stores.get(CACHE_NAME)!.get(shellKey)?.body).toBe('fresh shell');
  });

  it('falls back to the cached shell offline, or to a network error without it', async () => {
    const worker = await installedWorker();
    worker.fetchMock.mockRejectedValue(new TypeError('offline'));
    expect((await worker.fetchEvent('/?v=1', { mode: 'navigate' })).result?.body).toBe(`precache:${ORIGIN}/`);

    const empty = loadWorker(workerSource);
    empty.fetchMock.mockRejectedValue(new TypeError('offline'));
    expect((await empty.fetchEvent('/', { mode: 'navigate' })).result).toBe(empty.errorResponse);
  });

  it.each([
    ['a non-GET request', `${ORIGIN}/assets/index-abc.js`, 'POST'],
    ['a cross-origin request', 'https://api.deepgram.com/v1/listen', 'GET'],
    ['the voice token API', `${ORIGIN}/api/deepgram/token`, 'GET'],
  ])('ignores %s', async (_label, url, method) => {
    const worker = await installedWorker();
    const { respondWith } = await worker.fetchEvent(url, { method });
    expect(respondWith).not.toHaveBeenCalled();
    expect(worker.fetchMock).not.toHaveBeenCalled();
  });

  it('serves precached assets cache-first, ignoring the query string', async () => {
    const worker = await installedWorker();
    expect((await worker.fetchEvent('/assets/index-abc.js')).result?.body).toBe(`precache:${ORIGIN}/assets/index-abc.js`);
    expect((await worker.fetchEvent('/app-qr.svg?appUrl=https%3A%2F%2Fplay.bougnatdarts.fr')).result?.body)
      .toBe(`precache:${ORIGIN}/app-qr.svg`);
    expect(worker.fetchMock).not.toHaveBeenCalled();

    worker.stores.get(CACHE_NAME)!.delete(worker.keyOf('/manifest.json'));
    worker.fetchMock.mockResolvedValueOnce(response('network manifest'));
    expect((await worker.fetchEvent('/manifest.json')).result?.body).toBe('network manifest');
  });

  it('caches other same-origin assets stale-while-revalidate, keeping only 200 basic responses', async () => {
    const worker = await installedWorker();
    const legacyKey = `${ORIGIN}/assets/views-legacy-abc.js`;

    worker.fetchMock.mockResolvedValueOnce(response('v1'));
    expect((await worker.fetchEvent(legacyKey)).result?.body).toBe('v1');
    expect(worker.stores.get(CACHE_NAME)!.get(legacyKey)?.body).toBe('v1');

    worker.fetchMock.mockResolvedValueOnce(response('v2'));
    expect((await worker.fetchEvent(legacyKey)).result?.body).toBe('v1');
    expect(worker.stores.get(CACHE_NAME)!.get(legacyKey)?.body).toBe('v2');

    worker.fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    expect((await worker.fetchEvent(legacyKey)).result?.body).toBe('v2');

    worker.fetchMock.mockResolvedValueOnce(response('missing', { status: 404 }));
    expect((await worker.fetchEvent('/pcmCaptureWorklet.js')).result?.status).toBe(404);
    worker.fetchMock.mockResolvedValueOnce(response('partial', { status: 206 }));
    await worker.fetchEvent('/preview.svg');
    expect(worker.stores.get(CACHE_NAME)!.has(`${ORIGIN}/pcmCaptureWorklet.js`)).toBe(false);
    expect(worker.stores.get(CACHE_NAME)!.has(`${ORIGIN}/preview.svg`)).toBe(false);

    worker.fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await expect(worker.fetchEvent('/assets/never-seen.js')).rejects.toThrow('offline');
  });

  it('never touches IndexedDB or localStorage (V2-NFR-02)', () => {
    expect(withoutComments(workerSource)).not.toMatch(/indexedDB|localStorage|sessionStorage/);
  });
});

describe('scripts/pwa/sw-kill-switch.js', () => {
  it('takes over immediately', async () => {
    const worker = loadWorker(killSwitchSource);
    await worker.dispatch('install');
    expect(worker.self.skipWaiting).toHaveBeenCalledTimes(1);
    expect(worker.listeners.has('fetch')).toBe(false);
  });

  it('deletes every Bougnat Darts cache, keeps third-party caches and unregisters', async () => {
    const worker = loadWorker(killSwitchSource, ['bougnat-darts-dev', CACHE_NAME, 'third-party-cache']);
    await worker.dispatch('activate');
    expect([...worker.stores.keys()]).toEqual(['third-party-cache']);
    expect(worker.self.registration.unregister).toHaveBeenCalledTimes(1);
    expect(withoutComments(killSwitchSource)).not.toMatch(/indexedDB|localStorage|sessionStorage/);
  });
});
