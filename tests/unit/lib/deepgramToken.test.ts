import { afterEach, describe, expect, it, vi } from 'vitest';
import { grantDeepgramToken } from '../../../lib/deepgramToken';

describe('grantDeepgramToken', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('genere un token sans verifier de projet quand aucun projectId n est fourni', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ access_token: 'token-123', expires_in: 55 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const token = await grantDeepgramToken('dg-key');

    expect(token).toEqual({ accessToken: 'token-123', expiresIn: 55 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.deepgram.com/v1/auth/grant',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('verifie le projet avant de generer un token quand projectId est present', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'token-abc', expires_in: 42 }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const token = await grantDeepgramToken('dg-key', 'project-1');

    expect(token).toEqual({ accessToken: 'token-abc', expiresIn: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.deepgram.com/v1/projects/project-1',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.deepgram.com/v1/auth/grant',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('echoue si le projet n est pas accessible et n appelle pas la generation de token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('forbidden'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(grantDeepgramToken('dg-key', 'project-1')).rejects.toThrow('forbidden');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.deepgram.com/v1/projects/project-1',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
