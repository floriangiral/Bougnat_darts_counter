import { grantDeepgramToken } from '../../lib/deepgramToken';

export const config = {
  runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_BODY_BYTES = 1024;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return empty(request, 204);
  }

  if (!isAllowedOrigin(request)) {
    return json(request, { error: 'Forbidden' }, 403);
  }

  if (request.method !== 'POST') {
    return json(request, { error: 'Method not allowed' }, 405, {
      Allow: 'POST, OPTIONS',
    });
  }

  if (!isWithinRateLimit(request)) {
    return json(request, { error: 'Too many requests' }, 429, {
      'Retry-After': '60',
    });
  }

  const validationError = await validateRequestBody(request);
  if (validationError) {
    return json(request, { error: validationError }, 400);
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return json(request, { error: 'Voice token service is not configured' }, 503);
  }

  try {
    const token = await grantDeepgramToken(apiKey, process.env.DEEPGRAM_PROJECT_ID);
    return json(request, token);
  } catch (error) {
    console.error('[deepgram-token] grant failed', {
      message: error instanceof Error ? error.message : 'Unknown Deepgram error',
    });
    return json(request, { error: 'Failed to grant voice token' }, 502);
  }
}

async function validateRequestBody(request: Request): Promise<string | null> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return 'Request body is too large';
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    return 'Content-Type must be application/json';
  }

  const body = await request.text();
  if (!body.trim()) {
    return null;
  }

  if (body.length > MAX_BODY_BYTES) {
    return 'Request body is too large';
  }

  try {
    const payload = JSON.parse(body) as unknown;
    if (payload === null || Array.isArray(payload) || typeof payload !== 'object') {
      return 'Request body must be a JSON object';
    }
  } catch {
    return 'Request body must be valid JSON';
  }

  return null;
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return true;
  }

  return allowedOrigins(request).has(origin);
}

function allowedOrigins(request: Request): Set<string> {
  const origins = new Set<string>();
  origins.add(new URL(request.url).origin);

  const configuredAppUrl = process.env.VITE_APP_URL?.trim();
  if (configuredAppUrl) {
    try {
      origins.add(new URL(configuredAppUrl).origin);
    } catch {
      // Invalid deploy configuration is handled by deployment-check.mjs.
    }
  }

  return origins;
}

function isWithinRateLimit(request: Request): boolean {
  const key = clientKey(request);
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    cleanupRateLimitBuckets(now);
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  current.count += 1;
  return true;
}

function cleanupRateLimitBuckets(now: number): void {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

function clientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  return forwardedFor || realIp || 'anonymous';
}

function empty(request: Request, status = 204): Response {
  return new Response(null, {
    status,
    headers: responseHeaders(request),
  });
}

function json(request: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...responseHeaders(request),
      ...extraHeaders,
    },
  });
}

function responseHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Vary': 'Origin',
  };

  const origin = request.headers.get('origin');
  if (origin && allowedOrigins(request).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '600';
  }

  return headers;
}
