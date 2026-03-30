export interface GrantedDeepgramToken {
  accessToken: string;
  expiresIn: number;
}

type DeepgramGrantResponse = {
  access_token?: string;
  expires_in?: number;
};

export async function grantDeepgramToken(apiKey: string): Promise<GrantedDeepgramToken> {
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
