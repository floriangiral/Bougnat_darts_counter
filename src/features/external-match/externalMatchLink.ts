// Spec: spec:counter/external-match-link
//
// Optional external match link: an external app (e.g. a tournament manager) opens the
// counter with query params that pre-fill an X01 setup, and gets the result back through
// a top-level navigation to an allowed return URL. Pure module: no network call, no DOM,
// no React. Without params (or with an invalid / non-allowed link) nothing changes.
import type { InOutRule, MatchState } from '../../../types';
import type { ExternalMatchConfig, ExternalMatchContext } from '../../shared/session/persistedAppSession';

export type { ExternalMatchConfig, ExternalMatchContext };

export type ExternalMatchLink = {
  /** 2 names (singles: p1, p2) or 4 names (doubles: t1p1, t1p2, t2p1, t2p2) */
  playerNames: string[];
  config: ExternalMatchConfig;
  returnUrl: string;
};

/** Value of the `status` param added to the return URL. */
export type ExternalReturnStatus = 'completed' | 'cancelled';

export const EXTERNAL_MATCH_PARAM_KEYS = [
  'game', 'start', 'in', 'out', 'legs', 'sets',
  'p1', 'p2', 't1p1', 't1p2', 't2p1', 't2p2', 'return',
] as const;

const MAX_NAME_LENGTH = 32;
const MAX_TO_WIN = 15;
const MIN_START_SCORE = 2;
const MAX_START_SCORE = 9999;
const DEFAULT_START_SCORE = 501;
const DEFAULT_LEGS_TO_WIN = 3;

const IN_OUT_RULES: Record<string, InOutRule> = {
  open: 'Open',
  double: 'Double',
  master: 'Master',
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const toUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/**
 * Allowed return origins, from a comma-separated list (env). Invalid entries are ignored;
 * an empty list disables the feature.
 */
export const parseAllowedOrigins = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((entry) => toUrl(entry.trim()))
    .filter((url): url is URL => url !== null && (url.protocol === 'https:' || url.protocol === 'http:'))
    .map((url) => url.origin);

/** Where a linked match may send its result back. */
export type ExternalReturnPolicy = {
  /** Allowed return origins; empty = feature off */
  origins: readonly string[];
  /**
   * Local testing on a phone: also accept http to a private IPv4 (10/8, 172.16/12,
   * 192.168/16). Only for an explicit VITE_APP_ENV=local, never in preprod or production.
   */
  allowPrivateNetworkHttp: boolean;
};

export const createExternalReturnPolicy = (
  rawOrigins: string | undefined,
  allowPrivateNetworkHttp: boolean,
): ExternalReturnPolicy => ({
  origins: parseAllowedOrigins(rawOrigins),
  allowPrivateNetworkHttp,
});

/** Private IPv4 ranges (RFC 1918). The URL parser already normalizes the hostname. */
export const isPrivateIPv4 = (hostname: string): boolean => {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return false;
  const first = Number(match[1]);
  const second = Number(match[2]);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
};

const isAllowedHttpHost = (hostname: string, policy: ExternalReturnPolicy): boolean =>
  LOCAL_HOSTS.has(hostname) || (policy.allowPrivateNetworkHttp && isPrivateIPv4(hostname));

/**
 * A return URL must be absolute, https (http only for localhost, or a private IPv4 when the
 * policy allows it for local testing), without credentials, and its origin must exactly
 * match an allowed origin.
 */
export const isAllowedReturnUrl = (value: string, policy: ExternalReturnPolicy): boolean => {
  const url = toUrl(value);
  if (!url || url.username || url.password) return false;
  const secure = url.protocol === 'https:' || (url.protocol === 'http:' && isAllowedHttpHost(url.hostname, policy));
  return secure && policy.origins.includes(url.origin);
};

const sanitizeName = (value: string | null): string | null => {
  if (value === null) return null;
  // Control characters removed, spaces collapsed; React renders names as text anyway.
  const name = value.replace(/\p{Cc}/gu, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  return name || null;
};

const parseIntInRange = (value: string | null, min: number, max: number): number | null => {
  if (value === null || !/^\d+$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return n >= min && n <= max ? n : null;
};

const parseRule = (value: string): InOutRule | null => IN_OUT_RULES[value.trim().toLowerCase()] ?? null;

const parsePlayers = (params: URLSearchParams): string[] | null => {
  const doubles = ['t1p1', 't1p2', 't2p1', 't2p2'].map((key) => sanitizeName(params.get(key)));
  if (doubles.every((name): name is string => name !== null)) return doubles;
  const singles = ['p1', 'p2'].map((key) => sanitizeName(params.get(key)));
  if (singles.every((name): name is string => name !== null)) return singles;
  return null;
};

/**
 * Reads an external match link from a query string. Returns null when the link is absent
 * or invalid: unknown game, missing players, missing or non-allowed return URL, or a
 * malformed value for any provided option (no silent guess on a tournament match).
 */
export const parseExternalMatchLink = (
  search: string,
  policy: ExternalReturnPolicy,
): ExternalMatchLink | null => {
  const params = new URLSearchParams(search);
  if (params.get('game')?.trim().toLowerCase() !== 'x01') return null;

  const returnUrl = params.get('return')?.trim() ?? '';
  if (!isAllowedReturnUrl(returnUrl, policy)) return null;

  const playerNames = parsePlayers(params);
  if (!playerNames) return null;

  const startingScore = params.has('start')
    ? parseIntInRange(params.get('start'), MIN_START_SCORE, MAX_START_SCORE)
    : DEFAULT_START_SCORE;
  const checkIn = params.has('in') ? parseRule(params.get('in') ?? '') : 'Open';
  const checkOut = params.has('out') ? parseRule(params.get('out') ?? '') : 'Double';
  const legsToWin = params.has('legs')
    ? parseIntInRange(params.get('legs'), 1, MAX_TO_WIN)
    : DEFAULT_LEGS_TO_WIN;
  const setsToWin = params.has('sets') ? parseIntInRange(params.get('sets'), 1, MAX_TO_WIN) : null;

  if (startingScore === null || checkIn === null || checkOut === null || legsToWin === null) return null;
  if (params.has('sets') && setsToWin === null) return null;

  const config: ExternalMatchConfig = {
    startingScore,
    checkIn,
    checkOut,
    legsToWin,
    matchMode: setsToWin === null ? 'LEGS' : 'SETS',
    isDoubles: playerNames.length === 4,
    ...(setsToWin === null ? {} : { setsToWin }),
  };

  return { playerNames, config, returnUrl };
};

/** Query string without the external match params (to clean the address bar once read). */
export const stripExternalMatchParams = (search: string): string => {
  const params = new URLSearchParams(search);
  EXTERNAL_MATCH_PARAM_KEYS.forEach((key) => params.delete(key));
  const rest = params.toString();
  return rest ? `?${rest}` : '';
};


/** Context kept for the linked match: return URL plus the imposed players and format. */
export const createExternalMatchContext = (link: ExternalMatchLink): ExternalMatchContext => ({
  returnUrl: link.returnUrl,
  playerNames: [...link.playerNames],
  config: { ...link.config },
});

const isInOutRule = (value: unknown): value is InOutRule =>
  value === 'Open' || value === 'Double' || value === 'Master';

const isExternalMatchConfig = (value: unknown): value is ExternalMatchConfig => {
  if (typeof value !== 'object' || value === null) return false;
  const config = value as Record<string, unknown>;
  return typeof config.startingScore === 'number'
    && isInOutRule(config.checkIn)
    && isInOutRule(config.checkOut)
    && (config.matchMode === 'LEGS' || config.matchMode === 'SETS')
    && typeof config.legsToWin === 'number'
    && typeof config.isDoubles === 'boolean'
    && (config.setsToWin === undefined || typeof config.setsToWin === 'number');
};

/**
 * Runtime guard for a context read back from the persisted session (local storage can be
 * edited or come from an older shape): anything unexpected is dropped.
 */
export const isExternalMatchContext = (value: unknown): value is ExternalMatchContext => {
  if (typeof value !== 'object' || value === null) return false;
  const { returnUrl, playerNames, config } = value as Record<string, unknown>;
  if (typeof returnUrl !== 'string' || !Array.isArray(playerNames)) return false;
  if (!playerNames.every((name) => typeof name === 'string' && name.length > 0)) return false;
  if (!isExternalMatchConfig(config)) return false;
  return playerNames.length === (config.isDoubles ? 4 : 2);
};

/** Host of an allowed return URL, shown to the players (e.g. "badarts.fr"). */
export const getExternalReturnHost = (
  context: ExternalMatchContext,
  policy: ExternalReturnPolicy,
): string | null => (isAllowedReturnUrl(context.returnUrl, policy) ? new URL(context.returnUrl).host : null);

/** Player ids in link order, as built by the setup (singles p1, p2; doubles t1p1…t2p2). */
const linkPlayerIds = (isDoubles: boolean): string[] =>
  isDoubles ? ['t1p1', 't1p2', 't2p1', 't2p2'] : ['p1', 'p2'];

/**
 * Team ids in link order: player 1 / team 1 first. Singles use the player ids (p1, p2)
 * and doubles the team ids (team1, team2), as built by the setup.
 */
const linkTeamIds = (isDoubles: boolean): [string, string] =>
  isDoubles ? ['team1', 'team2'] : ['p1', 'p2'];

const expectedTeamId = (playerId: string, isDoubles: boolean): string => {
  if (!isDoubles) return playerId;
  return playerId.startsWith('t1') ? 'team1' : 'team2';
};

/**
 * True when the match is the one imposed by the link: same players in the same order
 * (no bot), same start score, in/out rules and format. The setup is locked for a linked
 * match; this check keeps the result safe even if the composition changes anyway.
 */
export const matchFollowsExternalLink = (context: ExternalMatchContext, match: MatchState): boolean => {
  const expected = context.config;
  const actual = match.config;
  const sameFormat = actual.startingScore === expected.startingScore
    && actual.checkIn === expected.checkIn
    && actual.checkOut === expected.checkOut
    && actual.matchMode === expected.matchMode
    && actual.legsToWin === expected.legsToWin
    && actual.isDoubles === expected.isDoubles
    && (expected.matchMode !== 'SETS' || actual.setsToWin === expected.setsToWin);
  if (!sameFormat) return false;

  const ids = linkPlayerIds(expected.isDoubles);
  if (match.players.length !== ids.length || context.playerNames.length !== ids.length) return false;
  return ids.every((id, index) => {
    const player = match.players.find((candidate) => candidate.id === id);
    return player !== undefined
      && !player.isBot
      && player.teamId === expectedTeamId(id, expected.isDoubles)
      && player.name === context.playerNames[index];
  });
};

/**
 * Legs won by each team over the whole match. In SETS mode legsWon is reset after each
 * set, so legs are counted from the leg history (the final leg stays in currentLeg).
 */
export const countLegsWonByTeam = (match: MatchState): Record<string, number> => {
  const counts: Record<string, number> = {};
  [...match.completedLegs, match.currentLeg].forEach((leg) => {
    if (leg.winnerId) counts[leg.winnerId] = (counts[leg.winnerId] ?? 0) + 1;
  });
  return counts;
};

/**
 * Return URL carrying the result of a finished match, or null if the match is not
 * finished, is not the linked match (players or format changed) or the URL is not
 * allowed. Params set: status=completed, legs1, legs2, winner (1|2), and sets1, sets2 in
 * SETS mode. Existing params of the return URL are kept (same-name params are replaced).
 */
export const buildExternalReturnUrl = (
  context: ExternalMatchContext,
  match: MatchState,
  policy: ExternalReturnPolicy,
): string | null => {
  if (match.status !== 'finished' || !match.matchWinnerId) return null;
  if (!isAllowedReturnUrl(context.returnUrl, policy)) return null;
  if (!matchFollowsExternalLink(context, match)) return null;

  const [team1, team2] = linkTeamIds(context.config.isDoubles);
  if (match.matchWinnerId !== team1 && match.matchWinnerId !== team2) return null;

  const legs = countLegsWonByTeam(match);
  const url = new URL(context.returnUrl);
  url.searchParams.set('status', 'completed' satisfies ExternalReturnStatus);
  url.searchParams.set('legs1', String(legs[team1] ?? 0));
  url.searchParams.set('legs2', String(legs[team2] ?? 0));
  if (match.config.matchMode === 'SETS') {
    url.searchParams.set('sets1', String(match.setsWon[team1] ?? 0));
    url.searchParams.set('sets2', String(match.setsWon[team2] ?? 0));
  }
  url.searchParams.set('winner', match.matchWinnerId === team1 ? '1' : '2');
  return url.toString();
};

/**
 * Return URL telling the external app that the linked match was abandoned on the counter
 * (status=cancelled, no score), or null if the URL is not allowed.
 */
export const buildExternalCancelUrl = (
  context: ExternalMatchContext,
  policy: ExternalReturnPolicy,
): string | null => {
  if (!isAllowedReturnUrl(context.returnUrl, policy)) return null;
  const url = new URL(context.returnUrl);
  url.searchParams.set('status', 'cancelled' satisfies ExternalReturnStatus);
  return url.toString();
};
