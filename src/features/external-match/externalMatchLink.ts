// Spec: spec:counter/external-match-link
//
// Optional external match link: an external app (e.g. a tournament manager) opens the
// counter with query params that pre-fill an X01 setup, and gets the result back through
// a top-level navigation to an allowed return URL. Pure module: no network call, no DOM,
// no React. Without params (or with an invalid / non-allowed link) nothing changes.
import type { InOutRule, MatchState } from '../../../types';
import { calculateDetailedStatsForTeam } from '../../application/scoring/matchStats';
import type { ExternalMatchConfig, ExternalMatchContext } from '../../shared/session/persistedAppSession';

export type { ExternalMatchConfig, ExternalMatchContext };

export type ExternalMatchLink = {
  /** 2 names (singles: p1, p2) or 4 names (doubles: t1p1, t1p2, t2p1, t2p2) */
  playerNames: string[];
  config: ExternalMatchConfig;
  returnUrl: string;
  /** `stats=1`: add match statistics to the result */
  includeStats: boolean;
};

/** Why a link that looks like an external match link was rejected (shown to the players). */
export type ExternalLinkIssue =
  | 'feature-disabled'
  | 'unsupported-version'
  | 'unsupported-game'
  | 'missing-return'
  | 'return-not-allowed'
  | 'missing-players'
  | 'invalid-start'
  | 'invalid-in'
  | 'invalid-out'
  | 'invalid-legs'
  | 'invalid-sets'
  | 'invalid-stats';

export type ExternalLinkAnalysis =
  | { status: 'absent' }
  | { status: 'valid'; link: ExternalMatchLink }
  | { status: 'invalid'; issue: ExternalLinkIssue; /** host of a rejected return URL */ returnHost?: string };

/** Value of the `status` param added to the return URL. */
export type ExternalReturnStatus = 'completed' | 'cancelled';

/**
 * Version of the link contract (`v` param). An incoming link without `v` is read as the
 * current version; an unknown version is rejected. Every return URL carries it.
 */
export const EXTERNAL_MATCH_CONTRACT_VERSION = '1';

export const EXTERNAL_MATCH_PARAM_KEYS = [
  'v', 'game', 'start', 'in', 'out', 'legs', 'sets', 'stats',
  'p1', 'p2', 't1p1', 't1p2', 't2p1', 't2p2', 'return',
] as const;

/**
 * A linked match context older than this is dropped when the session is restored, so a
 * forgotten tournament link (and the partner token in its return URL) does not linger on a
 * shared device. Long enough for any match, short enough for the next tournament day.
 */
export const EXTERNAL_MATCH_CONTEXT_TTL_MS = 12 * 60 * 60 * 1000;
/** Tolerated clock skew for a context dated in the future (tampered or changed clock). */
const EXTERNAL_MATCH_CONTEXT_FUTURE_SKEW_MS = 5 * 60 * 1000;

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

/**
 * Names are rendered as text by React, so this is about display, not injection: control
 * (Cc) and invisible format characters (Cf: bidi overrides such as U+202E, zero-width
 * spaces and joiners, BOM) are removed so a name cannot look like another one. Then NFC
 * normalization, spaces collapsed, and a cut at 32 characters that never splits an emoji.
 */
export const sanitizeExternalPlayerName = (value: string | null): string | null => {
  if (value === null) return null;
  const cleaned = value
    .replace(/\s/g, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .normalize('NFC')
    .replace(/ +/g, ' ')
    .trim();
  const name = Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('').trim();
  return name || null;
};

const parseIntInRange = (value: string | null, min: number, max: number): number | null => {
  if (value === null || !/^\d+$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return n >= min && n <= max ? n : null;
};

const parseRule = (value: string): InOutRule | null => IN_OUT_RULES[value.trim().toLowerCase()] ?? null;

const parsePlayers = (params: URLSearchParams): string[] | null => {
  const doubles = ['t1p1', 't1p2', 't2p1', 't2p2'].map((key) => sanitizeExternalPlayerName(params.get(key)));
  if (doubles.every((name): name is string => name !== null)) return doubles;
  const singles = ['p1', 'p2'].map((key) => sanitizeExternalPlayerName(params.get(key)));
  if (singles.every((name): name is string => name !== null)) return singles;
  return null;
};

const invalid = (issue: ExternalLinkIssue, returnHost?: string): ExternalLinkAnalysis =>
  (returnHost === undefined ? { status: 'invalid', issue } : { status: 'invalid', issue, returnHost });

const parseStatsFlag = (value: string | null): boolean | null => {
  if (value === null) return false;
  const flag = value.trim();
  if (flag === '1') return true;
  if (flag === '0') return false;
  return null;
};

type ValidationResult<T> =
  | { value: T; error?: never }
  | { value?: never; error: ExternalLinkAnalysis };

const getExternalLinkPreambleError = (
  params: URLSearchParams,
  policy: ExternalReturnPolicy,
): ExternalLinkAnalysis | null => {
  const version = params.get('v');
  if (version !== null && version.trim() !== EXTERNAL_MATCH_CONTRACT_VERSION) return invalid('unsupported-version');
  if (params.get('game')?.trim().toLowerCase() !== 'x01') return invalid('unsupported-game');
  return policy.origins.length === 0 ? invalid('feature-disabled') : null;
};

const parseExternalReturnUrl = (
  params: URLSearchParams,
  policy: ExternalReturnPolicy,
): ValidationResult<string> => {
  const returnUrl = params.get('return')?.trim() ?? '';
  if (!returnUrl) return { error: invalid('missing-return') };
  if (!isAllowedReturnUrl(returnUrl, policy)) {
    return { error: invalid('return-not-allowed', toUrl(returnUrl)?.host || undefined) };
  }
  return { value: returnUrl };
};

type ParsedExternalMatch = Pick<ExternalMatchLink, 'playerNames' | 'config' | 'includeStats'>;

const parseExternalMatch = (params: URLSearchParams): ValidationResult<ParsedExternalMatch> => {
  const playerNames = parsePlayers(params);
  if (!playerNames) return { error: invalid('missing-players') };

  const startingScore = params.has('start')
    ? parseIntInRange(params.get('start'), MIN_START_SCORE, MAX_START_SCORE)
    : DEFAULT_START_SCORE;
  if (startingScore === null) return { error: invalid('invalid-start') };

  const rawCheckIn = params.get('in');
  const checkIn = rawCheckIn === null ? 'Open' : parseRule(rawCheckIn);
  if (checkIn === null) return { error: invalid('invalid-in') };

  const rawCheckOut = params.get('out');
  const checkOut = rawCheckOut === null ? 'Double' : parseRule(rawCheckOut);
  if (checkOut === null) return { error: invalid('invalid-out') };

  const legsToWin = params.has('legs')
    ? parseIntInRange(params.get('legs'), 1, MAX_TO_WIN)
    : DEFAULT_LEGS_TO_WIN;
  if (legsToWin === null) return { error: invalid('invalid-legs') };

  const setsToWin = params.has('sets') ? parseIntInRange(params.get('sets'), 1, MAX_TO_WIN) : null;
  if (params.has('sets') && setsToWin === null) return { error: invalid('invalid-sets') };

  const includeStats = parseStatsFlag(params.get('stats'));
  if (includeStats === null) return { error: invalid('invalid-stats') };

  const config: ExternalMatchConfig = {
    startingScore,
    checkIn,
    checkOut,
    legsToWin,
    matchMode: setsToWin === null ? 'LEGS' : 'SETS',
    isDoubles: playerNames.length === 4,
    ...(setsToWin === null ? {} : { setsToWin }),
  };

  return { value: { playerNames, config, includeStats } };
};

/**
 * Reads an external match link from a query string:
 * - `absent` when the query has neither `game` nor `return` (a usual start);
 * - `invalid` with the first issue found: unknown contract version, unsupported game,
 *   feature disabled, missing or non-allowed return URL, missing players, or a malformed
 *   value for any provided option (no silent guess on a tournament match);
 * - `valid` with the link otherwise.
 */
export const analyzeExternalMatchLink = (
  search: string,
  policy: ExternalReturnPolicy,
): ExternalLinkAnalysis => {
  const params = new URLSearchParams(search);
  if (!params.has('game') && !params.has('return')) return { status: 'absent' };

  const preambleError = getExternalLinkPreambleError(params, policy);
  if (preambleError) return preambleError;

  const parsedReturnUrl = parseExternalReturnUrl(params, policy);
  if (parsedReturnUrl.error) return parsedReturnUrl.error;

  const parsedMatch = parseExternalMatch(params);
  if (parsedMatch.error) return parsedMatch.error;

  return {
    status: 'valid',
    link: { ...parsedMatch.value, returnUrl: parsedReturnUrl.value },
  };
};

/** The valid link of a query string, or null (absent or invalid). */
export const parseExternalMatchLink = (search: string, policy: ExternalReturnPolicy): ExternalMatchLink | null => {
  const analysis = analyzeExternalMatchLink(search, policy);
  return analysis.status === 'valid' ? analysis.link : null;
};

/** Query string without the external match params (to clean the address bar once read). */
export const stripExternalMatchParams = (search: string): string => {
  const params = new URLSearchParams(search);
  EXTERNAL_MATCH_PARAM_KEYS.forEach((key) => params.delete(key));
  const rest = params.toString();
  return rest ? `?${rest}` : '';
};


/** Context kept for the linked match: return URL plus the imposed players and format. */
export const createExternalMatchContext = (link: ExternalMatchLink, now: number = Date.now()): ExternalMatchContext => ({
  returnUrl: link.returnUrl,
  playerNames: [...link.playerNames],
  config: { ...link.config },
  createdAt: now,
  ...(link.includeStats ? { includeStats: true } : {}),
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
  const { returnUrl, playerNames, config, createdAt, includeStats } = value as Record<string, unknown>;
  if (typeof returnUrl !== 'string' || !Array.isArray(playerNames)) return false;
  if (includeStats !== undefined && typeof includeStats !== 'boolean') return false;
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) return false;
  if (!playerNames.every((name) => typeof name === 'string' && name.length > 0)) return false;
  if (!isExternalMatchConfig(config)) return false;
  return playerNames.length === (config.isDoubles ? 4 : 2);
};

/** True when the context is older than the TTL, or dated in the future beyond a small skew. */
export const isExternalMatchContextExpired = (context: ExternalMatchContext, now: number): boolean =>
  now - context.createdAt > EXTERNAL_MATCH_CONTEXT_TTL_MS
  || context.createdAt - now > EXTERNAL_MATCH_CONTEXT_FUTURE_SKEW_MS;

/**
 * Context read back from a persisted session: kept only if well-formed and not expired.
 * Anything else (edited storage, former shape, forgotten link) is dropped.
 */
export const restoreExternalMatchContext = (value: unknown, now: number): ExternalMatchContext | null =>
  (isExternalMatchContext(value) && !isExternalMatchContextExpired(value, now) ? value : null);

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

const formatAverage = (value: number): string => (Number.isFinite(value) ? value.toFixed(2) : '0.00');

/**
 * `stats=1` result params, per player/team in link order: avg (3-dart average, 2 decimals),
 * n180 (180s), hco (highest checkout, 0 if none), plus the match duration in seconds.
 */
const appendExternalResultStats = (url: URL, match: MatchState, teams: [string, string]): void => {
  teams.forEach((teamId, index) => {
    const side = String(index + 1);
    const stats = calculateDetailedStatsForTeam(match, teamId);
    url.searchParams.set(`avg${side}`, formatAverage(stats.threeDartAverage));
    url.searchParams.set(`n180_${side}`, String(stats.scoreCounts.c180));
    url.searchParams.set(`hco${side}`, String(stats.highestCheckout));
  });
  url.searchParams.set('duration', String(Math.max(0, Math.round(match.duration))));
};

/**
 * Return URL carrying the result of a finished match, or null if the match is not
 * finished, is not the linked match (players or format changed) or the URL is not
 * allowed. Params set: v, status=completed, legs1, legs2, winner (1|2), and sets1, sets2
 * in SETS mode, and the `stats=1` params (see appendExternalResultStats). Existing params of
 * the return URL are kept (same-name params are replaced).
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
  url.searchParams.set('v', EXTERNAL_MATCH_CONTRACT_VERSION);
  url.searchParams.set('status', 'completed' satisfies ExternalReturnStatus);
  url.searchParams.set('legs1', String(legs[team1] ?? 0));
  url.searchParams.set('legs2', String(legs[team2] ?? 0));
  if (match.config.matchMode === 'SETS') {
    url.searchParams.set('sets1', String(match.setsWon[team1] ?? 0));
    url.searchParams.set('sets2', String(match.setsWon[team2] ?? 0));
  }
  url.searchParams.set('winner', match.matchWinnerId === team1 ? '1' : '2');
  if (context.includeStats) appendExternalResultStats(url, match, [team1, team2]);
  return url.toString();
};

/**
 * Return URL telling the external app that the linked match was abandoned on the counter
 * (v, status=cancelled, no score), or null if the URL is not allowed.
 */
export const buildExternalCancelUrl = (
  context: ExternalMatchContext,
  policy: ExternalReturnPolicy,
): string | null => {
  if (!isAllowedReturnUrl(context.returnUrl, policy)) return null;
  const url = new URL(context.returnUrl);
  url.searchParams.set('v', EXTERNAL_MATCH_CONTRACT_VERSION);
  url.searchParams.set('status', 'cancelled' satisfies ExternalReturnStatus);
  return url.toString();
};
