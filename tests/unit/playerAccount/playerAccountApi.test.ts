import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PlayerAccountApiError,
  bootstrapPlayerAccountSession,
  fetchPlayerAuthMe,
  fetchPlayerMatches,
  fetchPlayerProfile,
  fetchPlayerScoringProfile,
  fetchPlayerScoringBootstrap,
  fetchPlayerStats,
  fetchPlayerTournaments,
  isUnauthorizedPlayerAccountError,
  normalizePlayerStats,
  resolvePlayerDisplayName,
  updatePlayerProfile,
  updatePlayerProfilePhoto,
  updatePlayerScoringProfile,
} from '../../../src/features/player-account/playerAccountApi';

const apiResponse = (data: unknown, ok = true, status = ok ? 200 : 500) => ({
  ok,
  status,
  text: vi.fn().mockResolvedValue(JSON.stringify({ data, request_id: 'req_123' })),
});

const apiError = (status: number, message: string) => ({
  ok: false,
  status,
  text: vi.fn().mockResolvedValue(JSON.stringify({ error: { message }, request_id: 'req_err' })),
});

const directApiResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

describe('playerAccountApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('recupere /v1/auth/me avec le JWT utilisateur et retourne json.data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({ email: 'flo@example.test', name: 'Flo' }));
    vi.stubGlobal('fetch', fetchMock);

    const auth = await fetchPlayerAuthMe('https://api.bougnatdarts.fr', 'player-jwt');

    expect(auth).toEqual({ email: 'flo@example.test', name: 'Flo' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bougnatdarts.fr/v1/auth/me',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer player-jwt',
        }),
      }),
    );
  });

  it('recupere le bootstrap joueur avec le JWT utilisateur et retourne json.data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      player: { display_name: 'Flo' },
      scoring_profile: { hand: 'right' },
      stats: { matches_played: 4, wins: 3, checkout_rate: 0.25 },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const bootstrap = await fetchPlayerScoringBootstrap('https://api.bougnatdarts.fr', 'player-jwt');

    expect(bootstrap.player?.display_name).toBe('Flo');
    expect(bootstrap.stats).toMatchObject({
      matchesPlayed: 4,
      wins: 3,
      checkoutRate: 25,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bougnatdarts.fr/v1/player/me/scoring-app/bootstrap',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer player-jwt',
        }),
      }),
    );
  });

  it('recupere le profil joueur courant avec le JWT utilisateur', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      id: 'player_1',
      public_slug: 'flo',
      first_name: 'Flo',
      last_name: 'Giral',
      display_name: 'Flo',
      email: 'flo@example.test',
      photo_url: 'https://img.clerk.test/flo.jpg',
      gender: '',
      dominant_hand: 'right',
      is_active: true,
      is_public: false,
      created_at: '2026-01-01T00:00:00Z',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const profile = await fetchPlayerProfile('https://api.bougnatdarts.fr', 'player-jwt');

    expect(profile.display_name).toBe('Flo');
    expect(profile.photo_url).toBe('https://img.clerk.test/flo.jpg');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bougnatdarts.fr/v1/player/me',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer player-jwt',
        }),
      }),
    );
  });

  it('met a jour le profil joueur avec un payload complet sans photo ni avatar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      id: 'player_1',
      public_slug: 'flo',
      first_name: 'Florian',
      last_name: 'Giral',
      display_name: 'Flo',
      gender: 'undisclosed',
      dominant_hand: 'left',
      is_active: true,
      is_public: true,
      created_at: '2026-01-01T00:00:00Z',
    }));
    vi.stubGlobal('fetch', fetchMock);

    await updatePlayerProfile('https://api.bougnatdarts.fr/', 'player-jwt', {
      first_name: 'Florian',
      last_name: 'Giral',
      display_name: 'Flo',
      nickname: 'Le Bougnat',
      phone: '0600000000',
      birth_date: '01-02-1990',
      gender: 'undisclosed',
      country: 'France',
      city: 'Clermont-Ferrand',
      address: '',
      postal_code: '63000',
      nationality: 'Francaise',
      dominant_hand: 'left',
      darts_category: 'promotion',
      federation: 'FFD',
      license_number: 'LIC-123',
      is_public: true,
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bougnatdarts.fr/v1/player/me',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer player-jwt',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(body).toMatchObject({
      first_name: 'Florian',
      last_name: 'Giral',
      display_name: 'Flo',
      birth_date: '01-02-1990',
      is_public: true,
    });
    expect(body).not.toHaveProperty('photo_url');
    expect(body).not.toHaveProperty('avatar_url');
  });

  it('met a jour la photo via l endpoint dedie avec uniquement photo_url', async () => {
    const fetchMock = vi.fn().mockResolvedValue(directApiResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await updatePlayerProfilePhoto('https://api.bougnatdarts.fr/', 'player-jwt', {
      photo_url: 'https://img.clerk.test/flo-new.jpg',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bougnatdarts.fr/v1/player/me/photo',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer player-jwt',
          'Content-Type': 'application/json',
        }),
      }),
    );
    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(body).toEqual({ photo_url: 'https://img.clerk.test/flo-new.jpg' });
    expect(body).not.toHaveProperty('avatar_url');
  });

  it('recupere les sections joueur separees avec pagination et JWT utilisateur', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse({ matches_played: 12, wins: 8 }))
      .mockResolvedValueOnce(apiResponse([{ id: 'match_1', opponent_name: 'Alice' }]))
      .mockResolvedValueOnce(apiResponse([{ id: 'tournament_1', tournament_name: 'Open' }]))
      .mockResolvedValueOnce(apiResponse({ player_id: 'player_1', default_target: 501, preferred_format: 'x01' }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchPlayerStats('https://api.bougnatdarts.fr', 'player-jwt');
    await fetchPlayerMatches('https://api.bougnatdarts.fr', 'player-jwt', { limit: 20, offset: 0 });
    await fetchPlayerTournaments('https://api.bougnatdarts.fr', 'player-jwt', { limit: 20, offset: 0 });
    await fetchPlayerScoringProfile('https://api.bougnatdarts.fr', 'player-jwt');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.bougnatdarts.fr/v1/player/me/stats',
      'https://api.bougnatdarts.fr/v1/player/me/matches?limit=20&offset=0',
      'https://api.bougnatdarts.fr/v1/player/me/tournaments?limit=20&offset=0',
      'https://api.bougnatdarts.fr/v1/player/me/scoring',
    ]);
    for (const call of fetchMock.mock.calls) {
      expect(call[1]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer player-jwt',
        }),
      }));
    }
  });

  it('met a jour les preferences scoring avec un payload dedie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiResponse({
      player_id: 'player_1',
      default_target: 701,
      preferred_format: 'x01',
      sound_enabled: false,
      voice_enabled: true,
      theme_preference: 'dark',
    }));
    vi.stubGlobal('fetch', fetchMock);

    await updatePlayerScoringProfile('https://api.bougnatdarts.fr', 'player-jwt', {
      default_target: 701,
      preferred_format: 'x01',
      sound_enabled: false,
      voice_enabled: true,
      theme_preference: 'dark',
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bougnatdarts.fr/v1/player/me/scoring',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer player-jwt',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(body).toEqual({
      default_target: 701,
      preferred_format: 'x01',
      sound_enabled: false,
      voice_enabled: true,
      theme_preference: 'dark',
    });
  });

  it('accepte aussi une reponse bootstrap directe non enveloppee', async () => {
    const fetchMock = vi.fn().mockResolvedValue(directApiResponse({
      player: { email: 'direct@example.test' },
      scoring_profile: null,
      stats: { matchesPlayed: 2, wins: 1 },
      recent_matches: [{ id: 'm1', game_type: '501', result: 'win' }],
      tournaments: [{ id: 't1', name: 'Open Bougnat', rank: 3 }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const bootstrap = await fetchPlayerScoringBootstrap('https://api.bougnatdarts.fr', 'player-jwt');

    expect(bootstrap.player?.email).toBe('direct@example.test');
    expect(bootstrap.stats?.matchesPlayed).toBe(2);
    expect(bootstrap.recent_matches?.[0]).toMatchObject({ label: '501', result: 'win' });
    expect(bootstrap.tournaments?.[0]).toMatchObject({ name: 'Open Bougnat', rank: '3' });
  });

  it('bootstrappe une session compte sans appeler login/register backend', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse({ email: 'alice@example.test', name: 'Alice' }))
      .mockResolvedValueOnce(apiResponse({ player: { name: 'Alice' }, scoring_profile: { theme: 'dark' } }));
    vi.stubGlobal('fetch', fetchMock);

    const session = await bootstrapPlayerAccountSession('http://localhost:8080', 'player-jwt');

    expect(session.profileStatus).toBe('ready');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/v1/auth/me',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/v1/player/me/scoring-app/bootstrap',
      expect.any(Object),
    );
    expect(fetchMock.mock.calls.map(([url]) => url)).not.toContain('http://localhost:8080/v1/auth/login');
    expect(fetchMock.mock.calls.map(([url]) => url)).not.toContain('http://localhost:8080/v1/auth/register');
  });

  it('garde la session connectee avec profil incomplet si le bootstrap joueur retourne 404', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse({ email: 'new@example.test' }))
      .mockResolvedValueOnce(apiError(404, 'Profil joueur introuvable'));
    vi.stubGlobal('fetch', fetchMock);

    const session = await bootstrapPlayerAccountSession('https://bougnat-darts-develop.fly.dev/', 'player-jwt');

    expect(session.profileStatus).toBe('incomplete');
    expect(session.auth.email).toBe('new@example.test');
    expect(session.bootstrap.scoring_profile).toBeNull();
    expect(session.bootstrap.stats).toMatchObject({
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      hasActivity: false,
    });
  });

  it('signale les 401 pour permettre de supprimer l etat connecte local', async () => {
    const fetchMock = vi.fn().mockResolvedValue(apiError(401, 'Unauthorized'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPlayerAuthMe('https://api.bougnatdarts.fr', 'expired-jwt')).rejects.toMatchObject({
      status: 401,
    });

    const error = new PlayerAccountApiError('Unauthorized', 401, 'unauthorized');
    expect(isUnauthorizedPlayerAccountError(error)).toBe(true);
  });

  it('normalise les stats joueur snake_case et calcule le win rate si absent', () => {
    expect(normalizePlayerStats({
      matches_played: 10,
      wins: 7,
      losses: 3,
      overall_average: 58.24,
      best_average: 82.7,
      scores_180: 2,
      scores_140_plus: 11,
      scores_100_plus: 38,
      best_checkout: 116,
      checkout_rate: 0.32,
    })).toEqual({
      matchesPlayed: 10,
      wins: 7,
      losses: 3,
      winRate: 70,
      average: 58.2,
      bestAverage: 82.7,
      score180: 2,
      score140Plus: 11,
      score100Plus: 38,
      bestCheckout: 116,
      checkoutRate: 32,
      hasActivity: true,
    });
  });

  it('resout le nom joueur en priorisant le profil backend', () => {
    expect(resolvePlayerDisplayName({
      player: {
        username: 'gluntoto',
      },
    }, {
      email: 'fallback@example.test',
      name: 'Fallback',
    })).toBe('gluntoto');
  });
});
