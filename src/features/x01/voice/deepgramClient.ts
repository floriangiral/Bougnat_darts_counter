import type { DeepgramTokenResponse } from './dartsSpeechTypes';

type CachedToken = {
  accessToken: string;
  expiresAt: number;
  expiresIn: number;
};

let cachedToken: CachedToken | null = null;
let pendingTokenRequest: Promise<DeepgramTokenResponse> | null = null;

function getCachedToken(): DeepgramTokenResponse | null {
  if (!cachedToken) {
    return null;
  }

  if (Date.now() >= cachedToken.expiresAt) {
    cachedToken = null;
    return null;
  }

  return {
    accessToken: cachedToken.accessToken,
    expiresIn: cachedToken.expiresIn,
  };
}

export async function fetchDeepgramAccessToken(signal?: AbortSignal): Promise<DeepgramTokenResponse> {
  const existingToken = getCachedToken();
  if (existingToken) {
    return existingToken;
  }

  if (pendingTokenRequest !== null) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = (async () => {
    const response = await fetch('/api/deepgram/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      let details: string;

      try {
        const payload = await response.json() as { error?: string; details?: string };
        details = [payload.error, payload.details].filter(Boolean).join(' - ');
      } catch {
        try {
          details = await response.text();
        } catch {
          details = '';
        }
      }

      throw new Error(
        details
          ? `Voice token request failed (${response.status}): ${details}`
          : `Voice token request failed (${response.status})`,
      );
    }

    const token = await response.json() as DeepgramTokenResponse;
    const expiresIn = Math.max(0, token.expiresIn ?? 0);
    const refreshSkewMs = 10_000;
    cachedToken = {
      accessToken: token.accessToken,
      expiresAt: Date.now() + Math.max(0, expiresIn * 1000 - refreshSkewMs),
      expiresIn,
    };

    return token;
  })();

  try {
    return await pendingTokenRequest;
  } finally {
    pendingTokenRequest = null;
  }
}
