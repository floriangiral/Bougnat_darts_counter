// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (V2-FR-06, invariants 4/5/9).
// A new service worker installs and then waits: the page asks it to activate (SKIP_WAITING)
// only outside protected scoring screens, then reloads once on controllerchange.

export const SERVICE_WORKER_URL = '/sw.js';
export const SKIP_WAITING_MESSAGE = { type: 'SKIP_WAITING' } as const;

type Logger = (...args: unknown[]) => void;

export type ServiceWorkerUpdateDeps = {
  serviceWorker: ServiceWorkerContainer;
  document: Pick<Document, 'visibilityState' | 'addEventListener'>;
  reload: () => void;
  isLiveUpdateBlocked: () => boolean;
  setLiveUpdatePending: (pending: boolean) => void;
  log?: Logger;
};

export type ServiceWorkerUpdates = {
  register: () => Promise<ServiceWorkerRegistration | null>;
  applyPendingUpdate: () => Promise<void>;
};

export function createServiceWorkerUpdates(deps: ServiceWorkerUpdateDeps): ServiceWorkerUpdates {
  const { serviceWorker } = deps;
  const log: Logger = deps.log ?? (() => undefined);
  let registration: ServiceWorkerRegistration | null = null;
  let controller = serviceWorker.controller;
  let activationRequested = false;
  let reloading = false;

  const reloadOnce = () => {
    if (reloading) return;
    reloading = true;
    deps.reload();
  };

  const requestActivation = (worker: ServiceWorker) => {
    activationRequested = true;
    worker.postMessage(SKIP_WAITING_MESSAGE);
  };

  const handleWaitingWorker = (worker: ServiceWorker) => {
    if (deps.isLiveUpdateBlocked()) {
      deps.setLiveUpdatePending(true);
      return;
    }
    requestActivation(worker);
  };

  const watchInstallingWorker = (reg: ServiceWorkerRegistration) => {
    const worker = reg.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      // Without an active worker this is the first install: it activates by itself, no reload.
      if (worker.state === 'installed' && reg.active) {
        handleWaitingWorker(worker);
      }
    });
  };

  const checkForUpdate = (reg: ServiceWorkerRegistration, context: string) => {
    reg.update().catch((error: unknown) => log(`SW ${context} failed`, error));
  };

  serviceWorker.addEventListener('controllerchange', () => {
    const previous = controller;
    controller = serviceWorker.controller;
    // clients.claim() of the very first worker: the page already runs the current release.
    if (!previous && !activationRequested) return;
    if (deps.isLiveUpdateBlocked()) {
      deps.setLiveUpdatePending(true);
      return;
    }
    reloadOnce();
  });

  const register = async () => {
    try {
      const reg = await serviceWorker.register(SERVICE_WORKER_URL, { updateViaCache: 'none' });
      registration = reg;
      log('SW registered');
      if (reg.waiting && reg.active) {
        handleWaitingWorker(reg.waiting);
      }
      reg.addEventListener('updatefound', () => watchInstallingWorker(reg));
      checkForUpdate(reg, 'update check');
      deps.document.addEventListener('visibilitychange', () => {
        if (deps.document.visibilityState === 'visible') {
          checkForUpdate(reg, 'refresh check');
        }
      });
      return reg;
    } catch (error) {
      log('SW registration failed', error);
      return null;
    }
  };

  const applyPendingUpdate = async () => {
    const reg = registration ?? (await serviceWorker.getRegistration().catch(() => undefined)) ?? null;
    if (reg?.waiting && reg.active) {
      requestActivation(reg.waiting);
      return;
    }
    reloadOnce();
  };

  return { register, applyPendingUpdate };
}

let activeUpdates: ServiceWorkerUpdates | null = null;

/** Production bootstrap: registers /sw.js once the page has loaded. */
export function startServiceWorkerUpdates(deps: ServiceWorkerUpdateDeps, target: Pick<Window, 'addEventListener'>) {
  const updates = createServiceWorkerUpdates(deps);
  activeUpdates = updates;
  target.addEventListener('load', () => {
    void updates.register();
  });
  return updates;
}

/** Development: removes service workers left by a production build on the same origin. */
export function unregisterServiceWorkers(serviceWorker: ServiceWorkerContainer, log: Logger = () => undefined) {
  return serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => undefined)
    .catch((error: unknown) => {
      log('SW cleanup failed', error);
    });
}

/** Applies an update deferred during a protected screen (waiting worker first, plain reload otherwise). */
export function applyPendingServiceWorkerUpdate(fallbackReload: () => void = () => window.location.reload()) {
  if (!activeUpdates) {
    fallbackReload();
    return Promise.resolve();
  }
  return activeUpdates.applyPendingUpdate();
}

export function resetServiceWorkerUpdatesForTests() {
  activeUpdates = null;
}
