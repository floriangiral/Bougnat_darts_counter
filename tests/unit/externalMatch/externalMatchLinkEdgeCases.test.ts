import { describe, expect, it } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import {
  EXTERNAL_MATCH_CONTEXT_TTL_MS,
  analyzeExternalMatchLink,
  buildExternalCancelUrl,
  buildExternalReturnUrl,
  createExternalMatchContext,
  createExternalReturnPolicy,
  getExternalReturnHost,
  isAllowedReturnUrl,
  isExternalMatchContextExpired,
  isPrivateIPv4,
  matchFollowsExternalLink,
  parseAllowedOrigins,
  parseExternalMatchLink,
  restoreExternalMatchContext,
  sanitizeExternalPlayerName,
  stripExternalMatchParams,
} from '../../../src/features/external-match/externalMatchLink';
import type { ExternalMatchContext, ExternalReturnPolicy } from '../../../src/features/external-match/externalMatchLink';
import type { GameConfig, LegState, MatchState, Player, Turn } from '../../../types';

// Spec ref: spec:counter/external-match-link (edge cases)
const RETURN = 'https://badarts.fr/poule/abc?match=12';
const NOW = Date.UTC(2026, 10, 19, 12);
const policy = (origins: string[], allowPrivateNetworkHttp = false): ExternalReturnPolicy => ({ origins, allowPrivateNetworkHttp });
const ALLOWED = policy(['https://badarts.fr', 'http://localhost:7020']);

const link = (params: Record<string, string>) =>
  `?${new URLSearchParams({ game: 'x01', p1: 'Alice', p2: 'Bob', return: RETURN, ...params }).toString()}`;

const singles: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
];
const doubles: Player[] = [
  { id: 't1p1', name: 'A', teamId: 'team1' },
  { id: 't1p2', name: 'B', teamId: 'team1' },
  { id: 't2p1', name: 'C', teamId: 'team2' },
  { id: 't2p2', name: 'D', teamId: 'team2' },
];
const baseConfig: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
  setsToWin: 1, legsToWin: 3, isDoubles: false,
};

const contextFor = (players: Player[], config: GameConfig, extra: Partial<ExternalMatchContext> = {}): ExternalMatchContext => ({
  returnUrl: RETURN,
  createdAt: NOW,
  playerNames: players.map((player) => player.name),
  config: {
    startingScore: config.startingScore,
    checkIn: config.checkIn,
    checkOut: config.checkOut,
    matchMode: config.matchMode,
    legsToWin: config.legsToWin,
    isDoubles: config.isDoubles,
    ...(config.matchMode === 'SETS' ? { setsToWin: config.setsToWin } : {}),
  },
  ...extra,
});

const leg = (winnerId: string | null, history: Turn[] = []): LegState => ({ scores: {}, history, winnerId, startingPlayerIndex: 0 });

const finished = (players: Player[], config: GameConfig, winners: string[], extra: Partial<MatchState> = {}): MatchState => ({
  ...createMatch(players, config),
  completedLegs: winners.slice(0, -1).map((winner) => leg(winner)),
  currentLeg: leg(winners[winners.length - 1]),
  status: 'finished',
  matchWinnerId: winners[winners.length - 1],
  ...extra,
});

describe('analyzeExternalMatchLink - incoming values', () => {
  it('accepts game and return with surrounding spaces and any case', () => {
    const parsed = parseExternalMatchLink(link({ game: ' X01 ', return: `  ${RETURN}  ` }), ALLOWED);
    expect(parsed?.returnUrl).toBe(RETURN);
  });

  it.each([
    ['2', 2], ['9999', 9999], ['0501', 501], [' 301 ', 301],
  ])('accepts the start score %j', (start, expected) => {
    expect(parseExternalMatchLink(link({ start }), ALLOWED)?.config.startingScore).toBe(expected);
  });

  it.each(['10000', '-5', '1e3', '3.5', '', 'abc'])('rejects the start score %j', (start) => {
    expect(analyzeExternalMatchLink(link({ start }), ALLOWED)).toEqual({ status: 'invalid', issue: 'invalid-start' });
  });

  it.each([['1', 1], ['15', 15], [' 7 ', 7]])('accepts %j legs', (legs, expected) => {
    expect(parseExternalMatchLink(link({ legs }), ALLOWED)?.config.legsToWin).toBe(expected);
  });

  it.each(['0', '16', '-1', 'two'])('rejects %j legs', (legs) => {
    expect(analyzeExternalMatchLink(link({ legs }), ALLOWED)).toEqual({ status: 'invalid', issue: 'invalid-legs' });
  });

  it.each([['1', 1], ['15', 15]])('accepts %j sets with legs per set', (sets, expected) => {
    const parsed = parseExternalMatchLink(link({ sets, legs: '2' }), ALLOWED);
    expect(parsed?.config).toMatchObject({ matchMode: 'SETS', setsToWin: expected, legsToWin: 2 });
  });

  it.each(['0', '16', ''])('rejects %j sets', (sets) => {
    expect(analyzeExternalMatchLink(link({ sets }), ALLOWED)).toEqual({ status: 'invalid', issue: 'invalid-sets' });
  });

  it.each([['MASTER', 'Master'], [' double ', 'Double'], ['Open', 'Open']])('reads the rule %j', (rule, expected) => {
    const parsed = parseExternalMatchLink(link({ in: rule, out: rule }), ALLOWED);
    expect(parsed?.config.checkIn).toBe(expected);
    expect(parsed?.config.checkOut).toBe(expected);
  });

  it('reports an invalid check in before an invalid check out', () => {
    expect(analyzeExternalMatchLink(link({ in: 'x', out: 'y' }), ALLOWED)).toEqual({ status: 'invalid', issue: 'invalid-in' });
  });

  it.each(['', 'true', '2', 'yes'])('rejects the stats flag %j', (stats) => {
    expect(analyzeExternalMatchLink(link({ stats }), ALLOWED)).toEqual({ status: 'invalid', issue: 'invalid-stats' });
  });

  it.each(['01', '1.0', '2', ' '])('rejects the contract version %j', (v) => {
    expect(analyzeExternalMatchLink(link({ v }), ALLOWED)).toEqual({ status: 'invalid', issue: 'unsupported-version' });
  });

  it('checks the version before the game', () => {
    expect(analyzeExternalMatchLink(link({ v: '9', game: 'cricket' }), ALLOWED))
      .toEqual({ status: 'invalid', issue: 'unsupported-version' });
  });

  it('reports a disabled feature even without return URL', () => {
    expect(analyzeExternalMatchLink('?game=x01&p1=A&p2=B', policy([]))).toEqual({ status: 'invalid', issue: 'feature-disabled' });
  });

  it('reports a missing game when only a return URL is given', () => {
    expect(analyzeExternalMatchLink(`?return=${encodeURIComponent(RETURN)}`, policy([])))
      .toEqual({ status: 'invalid', issue: 'unsupported-game' });
  });

  it('reports a return URL with credentials as not allowed, with its host', () => {
    expect(analyzeExternalMatchLink(link({ return: 'https://user:pass@badarts.fr/x' }), ALLOWED))
      .toEqual({ status: 'invalid', issue: 'return-not-allowed', returnHost: 'badarts.fr' });
  });

  it('accepts another path and a fragment on an allowed origin', () => {
    expect(parseExternalMatchLink(link({ return: 'https://badarts.fr/other/path#top' }), ALLOWED)?.returnUrl)
      .toBe('https://badarts.fr/other/path#top');
  });

  it('falls back to singles when doubles names are incomplete', () => {
    const parsed = parseExternalMatchLink(link({ t1p1: 'A', t1p2: 'B', t2p1: 'C' }), ALLOWED);
    expect(parsed?.playerNames).toEqual(['Alice', 'Bob']);
    expect(parsed?.config.isDoubles).toBe(false);
  });

  it('rejects incomplete doubles without singles', () => {
    const search = `?game=x01&t1p1=A&t1p2=B&t2p1=C&return=${encodeURIComponent(RETURN)}`;
    expect(analyzeExternalMatchLink(search, ALLOWED)).toEqual({ status: 'invalid', issue: 'missing-players' });
  });

  it('keeps unicode names (accents, emoji, right-to-left scripts)', () => {
    const parsed = parseExternalMatchLink(link({ p1: 'Zoé 🎯', p2: 'ليلى' }), ALLOWED);
    expect(parsed?.playerNames).toEqual(['Zoé 🎯', 'ليلى']);
  });
});

describe('sanitizeExternalPlayerName - more cases', () => {
  it('turns non-breaking and other unicode spaces into regular spaces', () => {
    expect(sanitizeExternalPlayerName('Jean\u00A0Pierre\u2003Paul')).toBe('Jean Pierre Paul');
  });

  it('drops zero-width joiners of emoji sequences (documented trade-off)', () => {
    expect(sanitizeExternalPlayerName('👨\u200D👩')).toBe('👨👩');
  });

  it('keeps a name at exactly 32 characters', () => {
    expect(sanitizeExternalPlayerName('y'.repeat(32))).toBe('y'.repeat(32));
  });

  it('trims spaces left by the 32 characters cut', () => {
    expect(sanitizeExternalPlayerName(`${'z'.repeat(31)} x`)).toBe('z'.repeat(31));
  });
});

describe('return policy and private network', () => {
  it('builds a policy from raw origins', () => {
    expect(createExternalReturnPolicy(' https://BadArts.fr/ ,http://192.168.1.20:7020', true)).toEqual({
      origins: ['https://badarts.fr', 'http://192.168.1.20:7020'],
      allowPrivateNetworkHttp: true,
    });
  });

  it('normalizes allowed origins (case, trailing slash, default port)', () => {
    expect(parseAllowedOrigins('HTTPS://BADARTS.FR:443/,https://badarts.fr')).toEqual(['https://badarts.fr', 'https://badarts.fr']);
  });

  it.each(['256.1.1.1', '192.168.1', '192.168.1.1.1', 'a.b.c.d', '010.1.1.1'])('handles the hostname %j', (hostname) => {
    expect(isPrivateIPv4(hostname)).toBe(hostname === '010.1.1.1');
  });

  it('applies the URL parser normalization before the private check', () => {
    const local = policy(['http://192.168.1.20'], true);
    expect(isAllowedReturnUrl('http://0xC0A80114/match', local)).toBe(true);
    expect(isAllowedReturnUrl('http://3232235796/match', local)).toBe(true);
  });

  it('keeps https to a private IPv4 allowed without the local flag', () => {
    expect(isAllowedReturnUrl('https://192.168.1.20/x', policy(['https://192.168.1.20']))).toBe(true);
  });

  it('accepts http on 127.0.0.1 but not on the IPv6 loopback', () => {
    expect(isAllowedReturnUrl('http://127.0.0.1:7020/x', policy(['http://127.0.0.1:7020']))).toBe(true);
    expect(isAllowedReturnUrl('http://[::1]:7020/x', policy(['http://[::1]:7020'], true))).toBe(false);
  });

  it('reads a private network link only when the policy allows it', () => {
    const search = link({ return: 'http://10.0.0.5:7020/m/1' });
    expect(analyzeExternalMatchLink(search, policy(['http://10.0.0.5:7020'], true)).status).toBe('valid');
    expect(analyzeExternalMatchLink(search, policy(['http://10.0.0.5:7020'])))
      .toEqual({ status: 'invalid', issue: 'return-not-allowed', returnHost: '10.0.0.5:7020' });
  });
});

describe('context expiry boundaries', () => {
  const context = contextFor(singles, baseConfig);

  it('accepts a context dated exactly 5 minutes in the future and rejects one millisecond more', () => {
    expect(isExternalMatchContextExpired(context, NOW - 5 * 60 * 1000)).toBe(false);
    expect(isExternalMatchContextExpired(context, NOW - 5 * 60 * 1000 - 1)).toBe(true);
  });

  it('dates a new context with the current time by default', () => {
    const parsed = parseExternalMatchLink(link({}), ALLOWED);
    if (!parsed) throw new Error('link should be valid');
    const before = Date.now();
    const created = createExternalMatchContext(parsed);
    expect(created.createdAt).toBeGreaterThanOrEqual(before);
    expect(created.createdAt).toBeLessThanOrEqual(Date.now());
    expect('includeStats' in created).toBe(false);
  });

  it('restores a context with its stats flag', () => {
    const withStats = { ...context, includeStats: true };
    expect(restoreExternalMatchContext(withStats, NOW + EXTERNAL_MATCH_CONTEXT_TTL_MS)).toEqual(withStats);
  });
});

describe('host, strip and cancel helpers', () => {
  it('shows the port in the host when it is not the default one', () => {
    const context = contextFor(singles, baseConfig, { returnUrl: 'https://badarts.fr:8443/x' });
    expect(getExternalReturnHost(context, policy(['https://badarts.fr:8443']))).toBe('badarts.fr:8443');
  });

  it('keeps the order of unrelated params and the hash-less query', () => {
    expect(stripExternalMatchParams('?a=1&game=x01&b=2&stats=1&v=1&return=x&c=3')).toBe('?a=1&b=2&c=3');
    expect(stripExternalMatchParams('?mode=local')).toBe('?mode=local');
  });

  it('keeps the fragment of the return URL in the cancel URL', () => {
    const context = contextFor(singles, baseConfig, { returnUrl: 'https://badarts.fr/m?x=1#board-4' });
    expect(buildExternalCancelUrl(context, ALLOWED)).toBe('https://badarts.fr/m?x=1&v=1&status=cancelled#board-4');
  });
});

describe('buildExternalReturnUrl - more cases', () => {
  it('keeps the fragment and replaces duplicated result params', () => {
    const context = contextFor(singles, baseConfig, { returnUrl: 'https://badarts.fr/m?legs1=9&legs1=8#top' });
    const url = buildExternalReturnUrl(context, finished(singles, baseConfig, ['p1', 'p1', 'p1']), ALLOWED);
    expect(url).toBe('https://badarts.fr/m?legs1=3&v=1&status=completed&legs2=0&winner=1#top');
  });

  it('reports 0 sets for a team missing from setsWon', () => {
    const config = { ...baseConfig, matchMode: 'SETS' as const, setsToWin: 1, legsToWin: 1 };
    const match = finished(singles, config, ['p2'], { setsWon: { p2: 1 } });
    const url = new URL(buildExternalReturnUrl(contextFor(singles, config), match, ALLOWED) ?? '');
    expect(url.searchParams.get('sets1')).toBe('0');
    expect(url.searchParams.get('sets2')).toBe('1');
    expect(url.searchParams.get('winner')).toBe('2');
  });

  it('adds stats per team for doubles', () => {
    const config = { ...baseConfig, isDoubles: true, startingScore: 101, legsToWin: 1 };
    const turn = (playerId: string, score: number, remainingAfter: number): Turn =>
      ({ playerId, score, isBust: false, remainingAfter, dartsThrown: 3 });
    const match: MatchState = {
      ...createMatch(doubles, config),
      currentLeg: leg('team2', [turn('t1p1', 60, 41), turn('t2p1', 60, 41), turn('t1p2', 20, 21), turn('t2p2', 41, 0)]),
      status: 'finished',
      matchWinnerId: 'team2',
      duration: 90,
    };
    const url = new URL(buildExternalReturnUrl(contextFor(doubles, config, { includeStats: true }), match, ALLOWED) ?? '');
    expect(url.searchParams.get('winner')).toBe('2');
    expect(url.searchParams.get('avg1')).toBe('40.00');
    expect(url.searchParams.get('avg2')).toBe('50.50');
    expect(url.searchParams.get('hco2')).toBe('41');
    expect(url.searchParams.get('hco1')).toBe('0');
    expect(url.searchParams.get('duration')).toBe('90');
  });

  it('accepts doubles only with the players in link order', () => {
    const config = { ...baseConfig, isDoubles: true };
    const context = contextFor(doubles, config);
    const swapped = doubles.map((player) => (player.id === 't1p1' ? { ...player, name: 'B' } : player.id === 't1p2' ? { ...player, name: 'A' } : player));
    expect(matchFollowsExternalLink(context, createMatch(swapped, config))).toBe(false);
    expect(matchFollowsExternalLink(context, createMatch(doubles, config))).toBe(true);
  });

  it('does not send a result for a match still in progress, even with a winner set', () => {
    const match = { ...finished(singles, baseConfig, ['p1']), status: 'playing' as MatchState['status'] };
    expect(buildExternalReturnUrl(contextFor(singles, baseConfig), match, ALLOWED)).toBeNull();
  });

  it('does not send a result without winner', () => {
    const match = { ...finished(singles, baseConfig, ['p1']), matchWinnerId: null };
    expect(buildExternalReturnUrl(contextFor(singles, baseConfig), match, ALLOWED)).toBeNull();
  });
});
