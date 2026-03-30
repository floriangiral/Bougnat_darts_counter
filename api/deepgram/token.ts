import { grantDeepgramToken } from '../../lib/deepgramToken';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Missing DEEPGRAM_API_KEY' }, 500);
  }

  try {
    const token = await grantDeepgramToken(apiKey);
    return json(token);
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown Deepgram error';
    return json({ error: 'Failed to grant Deepgram token', details }, 502);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
