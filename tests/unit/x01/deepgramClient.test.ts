import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('deepgramClient', () => {
  let fetchDeepgramAccessToken: typeof import('../../../src/features/x01/voice/deepgramClient').fetchDeepgramAccessToken;

  beforeEach(async () => {
    vi.resetModules();
    ({ fetchDeepgramAccessToken } = await import('../../../src/features/x01/voice/deepgramClient'));
  });

  it('caches a successful token and avoids a second request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accessToken: 'token-1', expiresIn: 120 }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchDeepgramAccessToken()).resolves.toEqual({ accessToken: 'token-1', expiresIn: 120 });
    await expect(fetchDeepgramAccessToken()).resolves.toEqual({ accessToken: 'token-1', expiresIn: 120 });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('shares an in-flight request between concurrent callers', async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveResponse = resolve; }));
    vi.stubGlobal('fetch', fetchMock);

    const first = fetchDeepgramAccessToken();
    const second = fetchDeepgramAccessToken();
    resolveResponse(new Response(JSON.stringify({ accessToken: 'shared-token', expiresIn: 60 }), { status: 200 }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { accessToken: 'shared-token', expiresIn: 60 },
      { accessToken: 'shared-token', expiresIn: 60 },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('reports provider errors without retaining a failed request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'unavailable' }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'recovered', expiresIn: 60 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchDeepgramAccessToken()).rejects.toThrow('Voice token request failed (503): unavailable');
    await expect(fetchDeepgramAccessToken()).resolves.toEqual({ accessToken: 'recovered', expiresIn: 60 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
