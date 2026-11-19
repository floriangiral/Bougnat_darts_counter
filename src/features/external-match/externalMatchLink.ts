// Spec: spec:counter/external-match-link
//
// Optional external match link: an external app (e.g. a tournament manager) opens the
// counter with query params that pre-fill an X01 setup, and gets the result back through
// a top-level navigation to an allowed return URL. Pure module: no network call, no DOM,
// no React. Without params (or with an invalid / non-allowed link) nothing changes.
import type { GameConfig, InOutRule, MatchState } from '../../../types';
import type { ExternalMatchContext } from '../../shared/session/persistedAppSession';

export type { ExternalMatchContext };

export type ExternalMatchLink = {
  /** 2 names (singles: p1, p2) or 4 names (doubles: t1p1, t1p2, t2p1, t2p2) */
  playerNames: string[];
  config: Partial<GameConfig>;
  returnUrl: string;
};

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

/**
 * A return URL must be absolute, https (http only for localhost), without credentials,
 * and its origin must exactly match an allowed origin.
 */
export const isAllowedReturnUrl = (value: string, allowedOrigins: readonly string[]): boolean => {
  const url = toUrl(value);
  if (!url || url.username || url.password) return false;
  const secure = url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname));
  return secure && allowedOrigins.includes(url.origin);
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
  allowedOrigins: readonly string[],
): ExternalMatchLink | null => {
  const params = new URLSearchParams(search);
  if (params.get('game')?.trim().toLowerCase() !== 'x01') return null;

  const returnUrl = params.get('return')?.trim() ?? '';
  if (!isAllowedReturnUrl(returnUrl, allowedOrigins)) return null;

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

  const config: Partial<GameConfig> = {
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

/**
 * Team ids in link order: player 1 / team 1 first. Singles use the player ids (p1, p2)
 * and doubles the team ids (team1, team2), as built by the setup.
 */
const linkTeamIds = (match: MatchState): [string, string] =>
  match.config.isDoubles ? ['team1', 'team2'] : ['p1', 'p2'];

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
 * finished, the teams no longer match the link (players changed in setup) or the URL is
 * not allowed. Params set: legs1, legs2, winner (1|2), and sets1, sets2 in SETS mode.
 */
export const buildExternalReturnUrl = (
  context: ExternalMatchContext,
  match: MatchState,
  allowedOrigins: readonly string[],
): string | null => {
  if (match.status !== 'finished' || !match.matchWinnerId) return null;
  if (!isAllowedReturnUrl(context.returnUrl, allowedOrigins)) return null;

  const [team1, team2] = linkTeamIds(match);
  const teamIds = new Set(match.players.map((player) => player.teamId));
  if (!teamIds.has(team1) || !teamIds.has(team2) || teamIds.size !== 2) return null;

  const legs = countLegsWonByTeam(match);
  const url = new URL(context.returnUrl);
  url.searchParams.set('legs1', String(legs[team1] ?? 0));
  url.searchParams.set('legs2', String(legs[team2] ?? 0));
  if (match.config.matchMode === 'SETS') {
    url.searchParams.set('sets1', String(match.setsWon[team1] ?? 0));
    url.searchParams.set('sets2', String(match.setsWon[team2] ?? 0));
  }
  url.searchParams.set('winner', match.matchWinnerId === team1 ? '1' : '2');
  return url.toString();
};
