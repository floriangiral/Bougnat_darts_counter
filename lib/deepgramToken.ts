export interface GrantedDeepgramToken {
  accessToken: string;
  expiresIn: number;
}

const DEEPGRAM_PROJECTS_BASE_URL = 'https://api.deepgram.com/v1/projects';

type DeepgramGrantResponse = {
  access_token?: string;
  expires_in?: number;
};

export async function grantDeepgramToken(apiKey: string, projectId?: string): Promise<GrantedDeepgramToken> {
  const normalizedProjectId = normalizeProjectId(projectId);
  if (normalizedProjectId) {
    await verifyDeepgramProjectAccess(apiKey, normalizedProjectId);
  }

  const response = await fetch('https://api.deepgram.com/v1/auth/grant', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ttl_seconds: 55,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json() as DeepgramGrantResponse;
  return {
    accessToken: payload.access_token ?? '',
    expiresIn: payload.expires_in ?? 0,
  };
}

async function verifyDeepgramProjectAccess(apiKey: string, projectId: string): Promise<void> {
  const response = await fetch(`${DEEPGRAM_PROJECTS_BASE_URL}/${encodeURIComponent(projectId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

function normalizeProjectId(projectId?: string): string | undefined {
  const trimmed = projectId?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || undefined;
  }

  return trimmed;
}
