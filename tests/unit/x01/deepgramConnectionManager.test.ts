import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupDeepgramConnection, connectDeepgramLive } from '../../../src/features/x01/voice/deepgramConnectionManager';
import type { DeepgramLiveConnection } from '../../../src/features/x01/voice/deepgramLiveTypes';
import { buildDeepgramListenConfig } from '../../../src/features/x01/voice/voiceConfig';

const sdk = vi.hoisted(() => ({
  constructor: vi.fn<(options: unknown) => void>(),
  connect: vi.fn(),
}));
vi.mock('@deepgram/sdk', () => ({
  DeepgramClient: class {
    constructor(options: unknown) { sdk.constructor(options); }
    listen = { v1: { connect: sdk.connect } };
  },
}));

function setup() {
  const connection = {
    on: vi.fn(),
    connect: vi.fn(),
    waitForOpen: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  };
  const refs = {
    connectionRef: { current: null as DeepgramLiveConnection | null },
    socketReadyRef: { current: false },
  };
  const handlers = { onOpen: vi.fn(), onMessage: vi.fn(), onError: vi.fn(), onClose: vi.fn() };
  sdk.connect.mockResolvedValue(connection);
  return { connection, refs, handlers };
}

beforeEach(() => vi.clearAllMocks());

describe('deepgramConnectionManager', () => {
  it('authenticates, registers all handlers before connecting and waits until open', async () => {
    const { connection, refs, handlers } = setup();
    let open!: () => void;
    connection.waitForOpen.mockReturnValueOnce(new Promise<void>((resolve) => { open = resolve; }));
    let completed = false;
    const pending = connectDeepgramLive(refs, 'access-token', handlers).then((value) => {
      completed = true;
      return value;
    });
    await Promise.resolve();
    expect(sdk.constructor).toHaveBeenCalledWith({ accessToken: 'access-token' });
    expect(sdk.connect).toHaveBeenCalledWith(buildDeepgramListenConfig('Bearer access-token'));
    expect(refs.connectionRef.current).toBe(connection);
    expect(connection.on.mock.calls).toEqual([
      ['open', handlers.onOpen],
      ['message', handlers.onMessage],
      ['error', handlers.onError],
      ['close', handlers.onClose],
    ]);
    expect(connection.on.mock.invocationCallOrder[3]).toBeLessThan(connection.connect.mock.invocationCallOrder[0]);
    expect(completed).toBe(false);
    open();
    await expect(pending).resolves.toBe(connection);
  });

  it('propagates SDK creation and socket-open failures for the caller to handle', async () => {
    const { connection, refs, handlers } = setup();
    sdk.connect.mockRejectedValueOnce(new Error('connect failed'));
    await expect(connectDeepgramLive(refs, 'token', handlers)).rejects.toThrow('connect failed');
    expect(refs.connectionRef.current).toBeNull();
    connection.waitForOpen.mockRejectedValueOnce(new Error('open failed'));
    await expect(connectDeepgramLive(refs, 'token', handlers)).rejects.toThrow('open failed');
    expect(refs.connectionRef.current).toBe(connection);
  });

  it('closes the live socket and clears readiness, including repeated cleanup', async () => {
    const { connection, refs, handlers } = setup();
    await connectDeepgramLive(refs, 'token', handlers);
    refs.socketReadyRef.current = true;
    cleanupDeepgramConnection(refs);
    expect(connection.close).toHaveBeenCalledOnce();
    expect(refs.connectionRef.current).toBeNull();
    expect(refs.socketReadyRef.current).toBe(false);
    cleanupDeepgramConnection(refs);
    expect(connection.close).toHaveBeenCalledOnce();
  });
});
