import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SKIP_WAITING_MESSAGE,
  applyPendingServiceWorkerUpdate,
  createServiceWorkerUpdates,
  resetServiceWorkerUpdatesForTests,
  startServiceWorkerUpdates,
  unregisterServiceWorkers,
} from '../../../src/infrastructure/web/serviceWorkerUpdates';

// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (V2-FR-06, V2-AC-04, invariants 4/5/9)
class Emitter {
  private listeners = new Map<string, Array<() => void>>();
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string) {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

class FakeWorker extends Emitter {
  state = 'installing';
  postMessage = vi.fn();
  install() {
    this.state = 'installed';
    this.emit('statechange');
  }
}

class FakeRegistration extends Emitter {
  active: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
  update = vi.fn(() => Promise.resolve());
  unregister = vi.fn(() => Promise.resolve(true));
}

class FakeContainer extends Emitter {
  controller: FakeWorker | null = null;
  registration = new FakeRegistration();
  register = vi.fn(() => Promise.resolve(this.registration));
  getRegistration = vi.fn(() => Promise.resolve(this.registration));
  getRegistrations = vi.fn(() => Promise.resolve([this.registration]));
  changeController(worker: FakeWorker | null) {
    this.controller = worker;
    this.emit('controllerchange');
  }
}

class FakeDocument extends Emitter {
  visibilityState: DocumentVisibilityState = 'visible';
}

const setup = ({ controlled = true, blocked = false } = {}) => {
  const container = new FakeContainer();
  const doc = new FakeDocument();
  if (controlled) {
    container.controller = new FakeWorker();
    container.registration.active = container.controller;
  }
  const state = { blocked };
  const deps = {
    serviceWorker: container as unknown as ServiceWorkerContainer,
    document: doc as unknown as Document,
    reload: vi.fn(),
    isLiveUpdateBlocked: vi.fn(() => state.blocked),
    setLiveUpdatePending: vi.fn(),
    log: vi.fn(),
  };
  const updates = createServiceWorkerUpdates(deps);
  return { container, doc, deps, state, updates, registration: container.registration };
};

const deployUpdate = (registration: FakeRegistration) => {
  const worker = new FakeWorker();
  registration.installing = worker;
  registration.emit('updatefound');
  registration.installing = null;
  registration.waiting = worker;
  worker.install();
  return worker;
};

afterEach(() => {
  resetServiceWorkerUpdatesForTests();
});

describe('service worker updates', () => {
  it('registers /sw.js without HTTP cache and checks for updates on load and when visible again', async () => {
    const { container, doc, updates, registration } = setup();
    await expect(updates.register()).resolves.toBe(registration);
    expect(container.register).toHaveBeenCalledWith('/sw.js', { updateViaCache: 'none' });
    expect(registration.update).toHaveBeenCalledTimes(1);

    doc.visibilityState = 'hidden';
    doc.emit('visibilitychange');
    expect(registration.update).toHaveBeenCalledTimes(1);
    doc.visibilityState = 'visible';
    doc.emit('visibilitychange');
    expect(registration.update).toHaveBeenCalledTimes(2);
  });

  it('logs registration and update failures without throwing', async () => {
    const { container, deps, updates, registration } = setup();
    const updateError = new Error('offline');
    registration.update.mockRejectedValueOnce(updateError);
    await updates.register();
    await Promise.resolve();
    expect(deps.log).toHaveBeenCalledWith('SW update check failed', updateError);

    const registrationError = new Error('SecurityError');
    container.register.mockRejectedValueOnce(registrationError);
    await expect(updates.register()).resolves.toBeNull();
    expect(deps.log).toHaveBeenCalledWith('SW registration failed', registrationError);
  });

  it('does not activate nor reload on the very first install', async () => {
    const { container, deps, updates, registration } = setup({ controlled: false });
    await updates.register();
    const worker = deployUpdate(registration);
    expect(worker.postMessage).not.toHaveBeenCalled();

    registration.active = worker;
    container.changeController(worker);
    expect(deps.reload).not.toHaveBeenCalled();
    expect(deps.setLiveUpdatePending).not.toHaveBeenCalled();
  });

  it('activates an update outside protected screens and reloads once', async () => {
    const { container, deps, updates, registration } = setup();
    await updates.register();
    const worker = deployUpdate(registration);
    expect(worker.postMessage).toHaveBeenCalledWith(SKIP_WAITING_MESSAGE);

    container.changeController(worker);
    container.changeController(worker);
    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it('defers an update during a protected screen and applies it through the waiting worker', async () => {
    const { container, deps, state, updates, registration } = setup({ blocked: true });
    await updates.register();
    const worker = deployUpdate(registration);
    expect(worker.postMessage).not.toHaveBeenCalled();
    expect(deps.setLiveUpdatePending).toHaveBeenCalledWith(true);
    expect(deps.reload).not.toHaveBeenCalled();

    state.blocked = false;
    await updates.applyPendingUpdate();
    expect(worker.postMessage).toHaveBeenCalledWith(SKIP_WAITING_MESSAGE);
    expect(deps.reload).not.toHaveBeenCalled();
    container.changeController(worker);
    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it('handles a worker already waiting at registration', async () => {
    const { registration, updates } = setup();
    const waiting = new FakeWorker();
    registration.waiting = waiting;
    await updates.register();
    expect(waiting.postMessage).toHaveBeenCalledWith(SKIP_WAITING_MESSAGE);
  });

  it('ignores updatefound without installing worker and intermediate states', async () => {
    const { deps, updates, registration } = setup();
    await updates.register();
    registration.emit('updatefound');
    const worker = new FakeWorker();
    registration.installing = worker;
    registration.emit('updatefound');
    worker.state = 'redundant';
    worker.emit('statechange');
    expect(worker.postMessage).not.toHaveBeenCalled();
    expect(deps.setLiveUpdatePending).not.toHaveBeenCalled();
  });

  it('marks the update pending when another tab activates it during a protected screen', () => {
    const { container, deps } = setup({ blocked: true });
    container.changeController(new FakeWorker());
    expect(deps.setLiveUpdatePending).toHaveBeenCalledWith(true);
    expect(deps.reload).not.toHaveBeenCalled();
  });

  it('reloads when another tab activates an update outside protected screens', () => {
    const { container, deps } = setup();
    container.changeController(new FakeWorker());
    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it('reloads a pending update without waiting worker, even before registration', async () => {
    const { container, deps, updates } = setup();
    await updates.applyPendingUpdate();
    expect(container.getRegistration).toHaveBeenCalledTimes(1);
    expect(deps.reload).toHaveBeenCalledTimes(1);

    const other = setup();
    other.container.getRegistration.mockRejectedValueOnce(new Error('denied'));
    await other.updates.applyPendingUpdate();
    expect(other.deps.reload).toHaveBeenCalledTimes(1);
  });
});

describe('service worker bootstrap', () => {
  it('falls back to a plain reload when no worker is managed (development, tests)', async () => {
    const fallback = vi.fn();
    await applyPendingServiceWorkerUpdate(fallback);
    expect(fallback).toHaveBeenCalledTimes(1);

    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });
    await applyPendingServiceWorkerUpdate();
    vi.unstubAllGlobals();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('works without logger', async () => {
    const { container, deps } = setup();
    container.register.mockRejectedValueOnce(new Error('SecurityError'));
    await expect(createServiceWorkerUpdates({ ...deps, log: undefined }).register()).resolves.toBeNull();
    container.getRegistrations.mockRejectedValueOnce(new Error('denied'));
    await expect(unregisterServiceWorkers(container as unknown as ServiceWorkerContainer)).resolves.toBeUndefined();
  });

  it('registers on load and routes pending updates to the started instance', async () => {
    const { container, deps } = setup();
    const target = new Emitter();
    startServiceWorkerUpdates(deps, target as unknown as Window);
    expect(container.register).not.toHaveBeenCalled();
    target.emit('load');
    expect(container.register).toHaveBeenCalledTimes(1);

    const fallback = vi.fn();
    await applyPendingServiceWorkerUpdate(fallback);
    expect(fallback).not.toHaveBeenCalled();
    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it('unregisters stale workers in development and logs failures', async () => {
    const container = new FakeContainer();
    await unregisterServiceWorkers(container as unknown as ServiceWorkerContainer);
    expect(container.registration.unregister).toHaveBeenCalledTimes(1);

    const log = vi.fn();
    const error = new Error('denied');
    container.getRegistrations.mockRejectedValueOnce(error);
    await unregisterServiceWorkers(container as unknown as ServiceWorkerContainer, log);
    expect(log).toHaveBeenCalledWith('SW cleanup failed', error);
  });
});
