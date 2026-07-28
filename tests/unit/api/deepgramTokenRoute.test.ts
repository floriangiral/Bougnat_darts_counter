import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const grantDeepgramTokenMock = vi.fn();

vi.mock('../../../lib/deepgramToken', () => ({
  grantDeepgramToken: grantDeepgramTokenMock,
}));

describe('functions/api/deepgram/token', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('DEEPGRAM_API_KEY', 'dg-secret');
    vi.stubEnv('DEEPGRAM_PROJECT_ID', 'project-1');
    vi.stubEnv('VITE_APP_URL', 'https://counter.example.test');
    grantDeepgramTokenMock.mockResolvedValue({ accessToken: 'token-123', expiresIn: 55 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('refuse les origines non autorisees sans appeler Deepgram', async () => {
    const handler = await importHandler();
    const response = await handler(request({
      headers: { origin: 'https://evil.example.test' },
      ip: '203.0.113.1',
    }));

    expect(response.status).toBe(403);
    expect(grantDeepgramTokenMock).not.toHaveBeenCalled();
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('emet des headers CORS stricts pour origine configuree', async () => {
    const handler = await importHandler();
    const response = await handler(request({
      headers: { origin: 'https://counter.example.test' },
      ip: '203.0.113.2',
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://counter.example.test');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('ne renvoie pas les details fournisseur au client', async () => {
    grantDeepgramTokenMock.mockRejectedValue(new Error('upstream leaked detail'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = await importHandler();

    const response = await handler(request({ ip: '203.0.113.3' }));
    const body = await response.json() as { error: string; details?: string };

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: 'Failed to grant voice token' });
    expect(body.details).toBeUndefined();
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('valide strictement le corps JSON', async () => {
    const handler = await importHandler();
    const response = await handler(request({
      body: '"not-object"',
      ip: '203.0.113.4',
    }));

    expect(response.status).toBe(400);
    expect(grantDeepgramTokenMock).not.toHaveBeenCalled();
  });

  it('limite les demandes de token par client', async () => {
    const handler = await importHandler();
    const responses: Response[] = [];

    for (let index = 0; index < 21; index += 1) {
      responses.push(await handler(request({ ip: '203.0.113.5' })));
    }

    expect(responses.slice(0, 20).every((response) => response.status === 200)).toBe(true);
    expect(responses[20].status).toBe(429);
    expect(responses[20].headers.get('Retry-After')).toBe('60');
  });

  it('gere les preflights sans consommer de quota', async () => {
    const handler = await importHandler();
    const response = await handler(request({
      method: 'OPTIONS',
      headers: { origin: 'https://counter.example.test' },
      ip: '203.0.113.6',
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(grantDeepgramTokenMock).not.toHaveBeenCalled();
  });
});

async function importHandler(): Promise<(request: Request) => Promise<Response>> {
  const module = await import('../../../functions/api/deepgram/token');
  return (request) => module.handleTokenRequest(request);
}

function request(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  ip: string;
}): Request {
  const headers = new Headers({
    'content-type': 'application/json',
    'x-forwarded-for': options.ip,
    ...options.headers,
  });

  return new Request('https://counter.example.test/api/deepgram/token', {
    method: options.method ?? 'POST',
    headers,
    body: options.method === 'OPTIONS' ? undefined : options.body ?? '{}',
  });
}
