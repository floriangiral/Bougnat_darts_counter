import type {
  PlayerAccountAuthMe,
  PlayerAccountBootstrap,
  PlayerAccountStatsSummary,
  PlayerAccountProfileStatus,
  PlayerRecentMatch,
  PlayerRecentTournament,
  PlayerAccountSession,
  PlayerAccountSearchResult,
  PlayerProfile,
  PlayerStats,
  MatchDetail,
  MatchHistory,
  MatchHistoryPage,
  PersonalScoringMatchPayload,
  PersonalScoringMatchResponse,
  ScoringProfile,
  TournamentHistory,
  UpdatePlayerProfilePhotoPayload,
  UpdateScoringProfilePayload,
  UpdatePlayerProfilePayload,
} from './playerAccountTypes';

export class PlayerAccountApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: 'unauthorized' | 'profile_missing',
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'PlayerAccountApiError';
  }
}

export const playerAccountUnavailableMessage =
  "On n'arrive pas a joindre l'espace joueur pour le moment. Tes donnees ne sont pas perdues, reessaie dans un instant.";

const normalizeApiBaseUrl = (apiBaseUrl: string): string => apiBaseUrl.trim().replace(/\/$/, '');

const buildUrl = (apiBaseUrl: string, path: string): string => `${normalizeApiBaseUrl(apiBaseUrl)}${path}`;

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PlayerAccountApiError('Reponse serveur illisible.', response.status);
  }
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/%/g, '').replace(',', '.').trim());
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  return undefined;
}

function getValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

function readNumber(records: Record<string, unknown>[], keys: string[]): number | undefined {
  for (const record of records) {
    const number = getNumber(getValue(record, keys));
    if (number !== undefined) {
      return number;
    }
  }

  return undefined;
}

function readString(records: Record<string, unknown>[], keys: string[]): string | undefined {
  for (const record of records) {
    const value = getValue(record, keys);
    const stringValue = getString(value);
    if (stringValue) {
      return stringValue;
    }

    const numberValue = getNumber(value);
    if (numberValue !== undefined) {
      return String(numberValue);
    }
  }

  return undefined;
}

function readArray(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const record = getRecord(value);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function collectStatsRecords(stats: unknown): Record<string, unknown>[] {
  const root = getRecord(stats);
  if (!root) {
    return [];
  }

  const records = [root];
  for (const key of ['overall', 'global', 'x01', 'x01_stats', 'scoring', 'summary']) {
    const nested = getRecord(root[key]);
    if (nested) {
      records.push(nested);
    }
  }

  return records;
}

function normalizeRate(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value > 0 && value <= 1) {
    return value * 100;
  }

  return value;
}

function roundNumber(value: number): number {
  return Math.round(value * 10) / 10;
}

export function normalizePlayerStats(stats: unknown): PlayerAccountStatsSummary {
  const records = collectStatsRecords(stats);
  const matchesPlayed = readNumber(records, ['matches_played', 'matchesPlayed', 'played_matches', 'playedMatches', 'total_matches', 'totalMatches', 'match_count', 'matchCount', 'games_played', 'gamesPlayed']) ?? 0;
  const wins = readNumber(records, ['wins', 'victories', 'matches_won', 'matchesWon', 'won_matches', 'wonMatches', 'win_count', 'winCount']) ?? 0;
  const losses = readNumber(records, ['losses', 'defeats', 'matches_lost', 'matchesLost', 'lost_matches', 'lostMatches', 'loss_count', 'lossCount']) ?? 0;
  const explicitWinRate = normalizeRate(readNumber(records, ['win_rate', 'winRate', 'win_percentage', 'winPercentage']));
  const winRate = explicitWinRate ?? (matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0);
  const checkoutRate = normalizeRate(readNumber(records, ['checkout_rate', 'checkoutRate', 'checkout_percentage', 'checkoutPercentage'])) ?? 0;

  return {
    matchesPlayed,
    wins,
    losses,
    winRate: roundNumber(winRate),
    average: roundNumber(readNumber(records, ['average', 'avg', 'overall_average', 'overallAverage', 'general_average', 'generalAverage', 'three_dart_average', 'threeDartAverage']) ?? 0),
    bestAverage: roundNumber(readNumber(records, ['best_average', 'bestAverage', 'highest_average', 'highestAverage', 'best_three_dart_average', 'bestThreeDartAverage']) ?? 0),
    score180: readNumber(records, ['180', 'one_eighties', 'oneEighties', 'scores_180', 'scores180', 'count_180', 'count180', 'max_scores', 'maxScores']) ?? 0,
    score140Plus: readNumber(records, ['140+', 'scores_140_plus', 'scores140Plus', 'score_140_plus', 'score140Plus', 'count_140_plus', 'count140Plus', 'plus_140', 'plus140']) ?? 0,
    score100Plus: readNumber(records, ['100+', 'scores_100_plus', 'scores100Plus', 'score_100_plus', 'score100Plus', 'count_100_plus', 'count100Plus', 'plus_100', 'plus100']) ?? 0,
    bestCheckout: readNumber(records, ['best_checkout', 'bestCheckout', 'highest_checkout', 'highestCheckout', 'max_checkout', 'maxCheckout']) ?? 0,
    checkoutRate: roundNumber(checkoutRate),
    hasActivity: matchesPlayed > 0 || wins > 0 || losses > 0,
  };
}

function normalizeMatch(value: unknown, index: number): PlayerRecentMatch | null {
  const record = getRecord(value);
  if (!record) {
    return null;
  }

  const id = readString([record], ['id', 'match_id', 'matchId']);
  const gameMode = readString([record], ['game_mode', 'gameMode']);
  const target = readNumber([record], ['target']);
  const game = gameMode?.toLowerCase() === 'x01' && target
    ? `X01 ${target}`
    : readString([record], ['game_type', 'gameType', 'mode', 'type', 'format']) ?? 'Match';
  const opponent = readString([record], ['opponent_name', 'opponentName', 'opponent', 'player', 'player_name', 'playerName']);
  const label = opponent ? `${game} vs ${opponent}` : game;

  return {
    id: id ?? `match-${index}`,
    label,
    date: readString([record], ['played_at', 'playedAt', 'finished_at', 'finishedAt', 'created_at', 'createdAt', 'date']),
    result: readString([record], ['result', 'outcome', 'status']),
    score: readString([record], ['score', 'final_score', 'finalScore', 'legs', 'sets']),
  };
}

function normalizeTournament(value: unknown, index: number): PlayerRecentTournament | null {
  const record = getRecord(value);
  if (!record) {
    return null;
  }

  const id = readString([record], ['id', 'tournament_id', 'tournamentId']);
  const name = readString([record], ['name', 'title', 'tournament_name', 'tournamentName']) ?? `Tournoi ${index + 1}`;

  return {
    id: id ?? `tournament-${index}`,
    name,
    date: readString([record], ['started_at', 'startedAt', 'finished_at', 'finishedAt', 'created_at', 'createdAt', 'date']),
    status: readString([record], ['status', 'state']),
    rank: readString([record], ['rank', 'position', 'standing', 'placement']),
  };
}

export function normalizeRecentMatches(matches: unknown): PlayerRecentMatch[] {
  return readArray(matches, ['items', 'matches', 'recent_matches', 'recentMatches'])
    .map(normalizeMatch)
    .filter((match): match is PlayerRecentMatch => Boolean(match))
    .slice(0, 5);
}

export function normalizeRecentTournaments(tournaments: unknown): PlayerRecentTournament[] {
  return readArray(tournaments, ['items', 'tournaments'])
    .map(normalizeTournament)
    .filter((tournament): tournament is PlayerRecentTournament => Boolean(tournament))
    .slice(0, 5);
}

export function normalizePlayerAccountBootstrap(bootstrap: PlayerAccountBootstrap | Record<string, unknown>): PlayerAccountBootstrap {
  const rawStats = bootstrap.stats;
  const rawRecentMatches = bootstrap.recent_matches;
  const rawTournaments = bootstrap.tournaments;
  const rawScoringProfile = getRecord(bootstrap.scoring_profile)
    ?? getRecord(bootstrap.scoring_settings)
    ?? null;

  return {
    ...bootstrap,
    stats: normalizePlayerStats(rawStats),
    raw_stats: rawStats,
    recent_matches: normalizeRecentMatches(rawRecentMatches),
    raw_recent_matches: readArray(rawRecentMatches, ['items', 'matches', 'recent_matches', 'recentMatches']),
    tournaments: normalizeRecentTournaments(rawTournaments),
    raw_tournaments: readArray(rawTournaments, ['items', 'tournaments']),
    scoring_profile: rawScoringProfile,
    scoring_settings: rawScoringProfile,
  };
}

function normalizeMatchHistoryPage(body: unknown, requestedLimit: number, requestedOffset: number): MatchHistoryPage {
  const record = getRecord(body);
  const items = readArray(body, ['items', 'matches', 'recent_matches', 'recentMatches']) as MatchHistory[];
  const total = record
    ? getNumber(getValue(record, ['total', 'total_count', 'totalCount', 'count'])) ?? items.length
    : items.length;
  const limit = record
    ? getNumber(getValue(record, ['limit', 'page_size', 'pageSize'])) ?? requestedLimit
    : requestedLimit;
  const offset = record
    ? getNumber(getValue(record, ['offset'])) ?? requestedOffset
    : requestedOffset;

  return {
    items,
    total,
    limit,
    offset,
  };
}

function normalizePlayerAccountSearchResult(value: unknown): PlayerAccountSearchResult | null {
  const record = getRecord(value);
  if (!record) return null;
  const playerId = readString([record], ['player_id', 'playerId', 'id']);
  if (!playerId) return null;

  return {
    player_id: playerId,
    display_name: readString([record], ['display_name', 'displayName', 'name', 'full_name', 'fullName']) ?? 'Joueur',
    nickname: readString([record], ['nickname', 'username']) ?? undefined,
    public_slug: readString([record], ['public_slug', 'publicSlug', 'slug']) ?? undefined,
    club_name: readString([record], ['club_name', 'clubName']) ?? undefined,
    avatar_url: readString([record], ['avatar_url', 'avatarUrl', 'photo_url', 'photoUrl']) ?? undefined,
  };
}

function getErrorMessage(body: unknown): string | null {
  const record = getRecord(body);
  if (!record) {
    return null;
  }

  const nestedError = getRecord(record.error);
  for (const source of [record, nestedError]) {
    if (!source) continue;

    for (const key of ['message', 'error', 'detail']) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }

  return null;
}

function isProfileMissing(status: number, body: unknown): boolean {
  if (status === 404) {
    return true;
  }

  const message = getErrorMessage(body)?.toLowerCase() ?? '';
  return message.includes('profil') && (message.includes('introuvable') || message.includes('existe pas') || message.includes('not found'));
}

function unwrapApiData<T>(body: unknown, status: number): T {
  const record = getRecord(body);
  if (!record) {
    throw new PlayerAccountApiError('Reponse serveur invalide.', status);
  }

  if ('data' in record) {
    return record.data as T;
  }

  return record as T;
}

async function fetchApiData<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init.headers,
    },
  });
  const body = await readJsonResponse(response);

  if (!response.ok) {
    const message = getErrorMessage(body) ?? `Service compte indisponible (${response.status}).`;
    const code = response.status === 401
      ? 'unauthorized'
      : isProfileMissing(response.status, body)
        ? 'profile_missing'
        : undefined;
    throw new PlayerAccountApiError(message, response.status, code, body);
  }

  return unwrapApiData<T>(body, response.status);
}

export async function fetchPlayerAuthMe(
  apiBaseUrl: string,
  bearerToken: string,
  signal?: AbortSignal,
): Promise<PlayerAccountAuthMe> {
  return fetchApiData<PlayerAccountAuthMe>(buildUrl(apiBaseUrl, '/v1/auth/me'), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

export async function fetchPlayerScoringBootstrap(
  apiBaseUrl: string,
  bearerToken: string,
  signal?: AbortSignal,
): Promise<PlayerAccountBootstrap> {
  const bootstrap = await fetchApiData<PlayerAccountBootstrap>(buildUrl(apiBaseUrl, '/v1/player/me/scoring-app/bootstrap'), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  return normalizePlayerAccountBootstrap(bootstrap);
}

export async function createPlayerProfile(
  apiBaseUrl: string,
  bearerToken: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<unknown> {
  return fetchApiData<unknown>(buildUrl(apiBaseUrl, '/v1/player/me'), {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchPlayerProfile(
  apiBaseUrl: string,
  bearerToken: string,
  signal?: AbortSignal,
): Promise<PlayerProfile> {
  return fetchApiData<PlayerProfile>(buildUrl(apiBaseUrl, '/v1/player/me'), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

export async function updatePlayerProfile(
  apiBaseUrl: string,
  bearerToken: string,
  payload: UpdatePlayerProfilePayload,
  signal?: AbortSignal,
): Promise<PlayerProfile> {
  return fetchApiData<PlayerProfile>(buildUrl(apiBaseUrl, '/v1/player/me'), {
    method: 'PUT',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function updatePlayerProfilePhoto(
  apiBaseUrl: string,
  bearerToken: string,
  payload: UpdatePlayerProfilePhotoPayload,
  signal?: AbortSignal,
): Promise<unknown> {
  return fetchApiData<unknown>(buildUrl(apiBaseUrl, '/v1/player/me/photo'), {
    method: 'PUT',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchPlayerStats(
  apiBaseUrl: string,
  bearerToken: string,
  options: { gameMode?: 'x01' | string } = {},
  signal?: AbortSignal,
): Promise<PlayerStats> {
  const params = new URLSearchParams();
  if (options.gameMode) {
    params.set('game_mode', options.gameMode);
  }
  const query = params.toString();

  return fetchApiData<PlayerStats>(buildUrl(apiBaseUrl, `/v1/player/me/stats${query ? `?${query}` : ''}`), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

export async function fetchPlayerMatches(
  apiBaseUrl: string,
  bearerToken: string,
  options: { limit?: number; offset?: number; gameMode?: 'x01' | string } = {},
  signal?: AbortSignal,
): Promise<MatchHistoryPage> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (options.gameMode) {
    params.set('game_mode', options.gameMode);
  }

  const body = await fetchApiData<unknown>(buildUrl(apiBaseUrl, `/v1/player/me/matches?${params.toString()}`), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
  return normalizeMatchHistoryPage(body, limit, offset);
}

export async function searchPlayerAccounts(
  apiBaseUrl: string,
  bearerToken: string,
  query: string,
  signal?: AbortSignal,
): Promise<PlayerAccountSearchResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 4) {
    return [];
  }

  const params = new URLSearchParams({ q: normalizedQuery });
  const body = await fetchApiData<unknown>(buildUrl(apiBaseUrl, `/v1/player/me/players/search?${params.toString()}`), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  return readArray(body, ['items', 'players', 'results'])
    .map(normalizePlayerAccountSearchResult)
    .filter((item): item is PlayerAccountSearchResult => Boolean(item));
}

export async function submitPlayerPersonalMatch(
  apiBaseUrl: string,
  bearerToken: string,
  payload: PersonalScoringMatchPayload,
  signal?: AbortSignal,
): Promise<PersonalScoringMatchResponse> {
  return fetchApiData<PersonalScoringMatchResponse>(buildUrl(apiBaseUrl, '/v1/player/me/scoring/personal-matches'), {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchPlayerMatchDetail(
  apiBaseUrl: string,
  bearerToken: string,
  matchId: string,
  signal?: AbortSignal,
): Promise<MatchDetail> {
  return fetchApiData<MatchDetail>(buildUrl(apiBaseUrl, `/v1/player/me/matches/${encodeURIComponent(matchId)}`), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

export async function fetchPlayerTournaments(
  apiBaseUrl: string,
  bearerToken: string,
  options: { limit?: number; offset?: number } = {},
  signal?: AbortSignal,
): Promise<TournamentHistory[]> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  return fetchApiData<TournamentHistory[]>(buildUrl(apiBaseUrl, `/v1/player/me/tournaments?limit=${limit}&offset=${offset}`), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

export async function fetchPlayerScoringProfile(
  apiBaseUrl: string,
  bearerToken: string,
  signal?: AbortSignal,
): Promise<ScoringProfile> {
  return fetchApiData<ScoringProfile>(buildUrl(apiBaseUrl, '/v1/player/me/scoring'), {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

export async function updatePlayerScoringProfile(
  apiBaseUrl: string,
  bearerToken: string,
  payload: UpdateScoringProfilePayload,
  signal?: AbortSignal,
): Promise<ScoringProfile> {
  return fetchApiData<ScoringProfile>(buildUrl(apiBaseUrl, '/v1/player/me/scoring'), {
    method: 'PUT',
    signal,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function bootstrapPlayerAccountSession(
  apiBaseUrl: string,
  bearerToken: string,
  signal?: AbortSignal,
): Promise<PlayerAccountSession> {
  const auth = await fetchPlayerAuthMe(apiBaseUrl, bearerToken, signal);

  try {
    const bootstrap = await fetchPlayerScoringBootstrap(apiBaseUrl, bearerToken, signal);
    return {
      auth,
      bootstrap,
      profileStatus: resolveProfileStatus(bootstrap),
    };
  } catch (error) {
    if (error instanceof PlayerAccountApiError && error.code === 'profile_missing') {
      return {
        auth,
        bootstrap: {
          player: null,
          stats: normalizePlayerStats(null),
          recent_matches: [],
          tournaments: [],
          scoring_profile: null,
        },
        profileStatus: 'incomplete',
      };
    }

    if (signal?.aborted || isUnauthorizedPlayerAccountError(error)) {
      throw error;
    }

    return {
      auth,
      bootstrap: {
        player: {
          email: auth.email,
          name: auth.name,
          display_name: auth.name || auth.email,
        },
        stats: normalizePlayerStats(null),
        recent_matches: [],
        tournaments: [],
        scoring_profile: null,
      },
      profileStatus: 'incomplete',
    };
  }
}

export function isUnauthorizedPlayerAccountError(error: unknown): boolean {
  return error instanceof PlayerAccountApiError && error.status === 401;
}

export function getFriendlyPlayerAccountErrorMessage(error: unknown, fallback = playerAccountUnavailableMessage): string {
  if (error instanceof PlayerAccountApiError) {
    if (error.status === 401) {
      return error.message || 'Session expiree. Reconnecte-toi pour retrouver ton espace joueur.';
    }

    if (error.code === 'profile_missing') {
      return error.message || 'Ton profil joueur n est pas encore initialise.';
    }

    if (!error.status || error.status >= 500) {
      return fallback;
    }

    return error.message || fallback;
  }

  if (error instanceof TypeError) {
    return fallback;
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes('failed to fetch')
      || lowerMessage.includes('networkerror')
      || lowerMessage.includes('load failed')
      || lowerMessage.includes('network request failed')
    ) {
      return fallback;
    }

    return message || fallback;
  }

  return fallback;
}

export function resolveProfileStatus(bootstrap: PlayerAccountBootstrap): PlayerAccountProfileStatus {
  const profile = bootstrap.scoring_profile;
  if (!profile || Object.keys(profile).length === 0) {
    return 'incomplete';
  }

  return 'ready';
}

export function resolvePlayerDisplayName(bootstrap: PlayerAccountBootstrap | null, auth?: PlayerAccountAuthMe | null): string {
  const player = bootstrap?.player;
  return player?.display_name || player?.displayName || player?.name || player?.nickname || player?.username || player?.email || auth?.name || auth?.email || 'Joueur';
}

export function resolvePlayerEmail(bootstrap: PlayerAccountBootstrap | null, auth?: PlayerAccountAuthMe | null): string | null {
  return bootstrap?.player?.email || auth?.email || null;
}
