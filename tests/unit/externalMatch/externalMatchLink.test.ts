import { describe, expect, it } from 'vitest';

import { createMatch, resolveMatchOrder, startPlacementRound, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import { buildScoreSubmissionResult } from '../../../src/features/x01/scoring/matchSubmission';
import {
  buildExternalCancelUrl,
  buildExternalReturnUrl,
  countLegsWonByTeam,
  createExternalMatchContext,
  createExternalReturnPolicy,
  getExternalReturnHost,
  isAllowedReturnUrl,
  EXTERNAL_MATCH_CONTEXT_TTL_MS,
  isExternalMatchContext,
  isExternalMatchContextExpired,
  isPrivateIPv4,
  matchFollowsExternalLink,
  analyzeExternalMatchLink,
  parseAllowedOrigins,
  parseExternalMatchLink,
  restoreExternalMatchContext,
  sanitizeExternalPlayerName,
  stripExternalMatchParams,
} from '../../../src/features/external-match/externalMatchLink';
import type { ExternalMatchContext, ExternalReturnPolicy } from '../../../src/features/external-match/externalMatchLink';
import type { GameConfig, LegState, MatchState, Player } from '../../../types';

// Spec ref: spec:counter/external-match-link
const policy = (origins: string[], allowPrivateNetworkHttp = false): ExternalReturnPolicy => ({ origins, allowPrivateNetworkHttp });
const ALLOWED = policy(['https://badarts.fr', 'http://localhost:7020']);
const RETURN = 'https://badarts.fr/poule/abc?match=12';

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

const leg = (winnerId: string | null): LegState => ({ scores: {}, history: [], winnerId, startingPlayerIndex: 0 });

/** Finished match: completed legs + final leg kept in currentLeg, as the engine does. */
const finished = (players: Player[], config: GameConfig, winners: string[], extra: Partial<MatchState> = {}): MatchState => {
  const match = createMatch(players, config);
  const last = winners[winners.length - 1];
  return {
    ...match,
    completedLegs: winners.slice(0, -1).map(leg),
    currentLeg: leg(last),
    status: 'finished',
    matchWinnerId: last,
    ...extra,
  };
};

describe('parseAllowedOrigins', () => {
  it('keeps valid http(s) origins and ignores the rest', () => {
    expect(parseAllowedOrigins(' https://badarts.fr/path , http://localhost:7020,ftp://x.fr, nope,')).toEqual([
      'https://badarts.fr',
      'http://localhost:7020',
    ]);
  });

  it('is empty (feature off) when unset', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(parseAllowedOrigins('')).toEqual([]);
  });
});

describe('createExternalReturnPolicy', () => {
  it('parses the origins and keeps the private network flag', () => {
    expect(createExternalReturnPolicy('https://badarts.fr, nope', false)).toEqual({
      origins: ['https://badarts.fr'],
      allowPrivateNetworkHttp: false,
    });
    expect(createExternalReturnPolicy(undefined, true)).toEqual({ origins: [], allowPrivateNetworkHttp: true });
  });
});

describe('isPrivateIPv4', () => {
  it.each(['10.0.0.1', '10.255.255.255', '172.16.0.1', '172.31.255.255', '192.168.0.1', '192.168.1.20'])(
    'accepts %s',
    (hostname) => {
      expect(isPrivateIPv4(hostname)).toBe(true);
    },
  );

  it.each(['172.15.0.1', '172.32.0.1', '11.0.0.1', '192.169.1.1', '8.8.8.8', '127.0.0.1', 'localhost', 'monpc.local', '[fd00::1]', '10.0.0'])(
    'rejects %s',
    (hostname) => {
      expect(isPrivateIPv4(hostname)).toBe(false);
    },
  );
});

describe('isAllowedReturnUrl', () => {
  it('accepts https URLs of an allowed origin and http only on localhost', () => {
    expect(isAllowedReturnUrl(RETURN, ALLOWED)).toBe(true);
    expect(isAllowedReturnUrl('http://localhost:7020/poule/x', ALLOWED)).toBe(true);
  });

  it.each([
    ['other origin', 'https://evil.fr/poule/x'],
    ['look-alike host', 'https://badarts.fr.evil.fr/x'],
    ['credentials', 'https://user:pass@badarts.fr/x'],
    ['plain http outside localhost', 'http://badarts.fr/x'],
    ['other port', 'https://badarts.fr:8443/x'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['relative URL', '/poule/x'],
    ['empty', ''],
  ])('rejects %s', (_label, url) => {
    expect(isAllowedReturnUrl(url, ALLOWED)).toBe(false);
  });

  it('rejects everything when no origin is allowed', () => {
    expect(isAllowedReturnUrl(RETURN, policy([]))).toBe(false);
  });

  it('rejects plain http on an allowed non-local origin', () => {
    expect(isAllowedReturnUrl('http://example.org/x', policy(['http://example.org']))).toBe(false);
  });

  describe('http to a private IPv4 (local testing only)', () => {
    const lan = ['http://192.168.1.20:7020', 'http://10.0.0.5', 'http://172.20.1.1:8080', 'http://8.8.8.8', 'http://monpc.local'];

    it('is accepted for an allowed private IPv4 origin when the policy allows it', () => {
      const local = policy(lan, true);
      expect(isAllowedReturnUrl('http://192.168.1.20:7020/match/1', local)).toBe(true);
      expect(isAllowedReturnUrl('http://10.0.0.5/match/1', local)).toBe(true);
      expect(isAllowedReturnUrl('http://172.20.1.1:8080/x', local)).toBe(true);
    });

    it('is rejected when the policy does not allow it (preprod, production, CI)', () => {
      expect(isAllowedReturnUrl('http://192.168.1.20:7020/match/1', policy(lan))).toBe(false);
    });

    it('stays limited to private IPv4 and to the allowed origins', () => {
      const local = policy(lan, true);
      expect(isAllowedReturnUrl('http://8.8.8.8/x', local)).toBe(false);
      expect(isAllowedReturnUrl('http://monpc.local/x', local)).toBe(false);
      expect(isAllowedReturnUrl('http://192.168.1.21:7020/x', local)).toBe(false);
      expect(isAllowedReturnUrl('http://192.168.1.20:7021/x', local)).toBe(false);
    });

    it('reads a link and builds the result URL for a private IPv4 partner', () => {
      const local = policy(['http://192.168.1.20:7020'], true);
      const parsed = parseExternalMatchLink(link({ return: 'http://192.168.1.20:7020/match/1', legs: '1' }), local);
      if (!parsed) throw new Error('link should be valid');
      const match = finished(singles, { ...baseConfig, legsToWin: 1 }, ['p2']);
      expect(buildExternalReturnUrl(createExternalMatchContext(parsed), match, local))
        .toBe('http://192.168.1.20:7020/match/1?v=1&status=completed&legs1=0&legs2=1&winner=2');
    });
  });
});

describe('parseExternalMatchLink', () => {
  it('reads a singles X01 link with defaults (501, open in, double out, 3 legs)', () => {
    expect(parseExternalMatchLink(link({}), ALLOWED)).toEqual({
      playerNames: ['Alice', 'Bob'],
      returnUrl: RETURN,
      includeStats: false,
      config: {
        startingScore: 501, checkIn: 'Open', checkOut: 'Double', legsToWin: 3,
        matchMode: 'LEGS', isDoubles: false,
      },
    });
  });

  it('reads explicit options and sets format', () => {
    const parsed = parseExternalMatchLink(link({ GAME: 'X01', start: '301', in: 'Double', out: 'MASTER', legs: '2', sets: '3' }), ALLOWED);
    expect(parsed?.config).toEqual({
      startingScore: 301, checkIn: 'Double', checkOut: 'Master', legsToWin: 2,
      matchMode: 'SETS', setsToWin: 3, isDoubles: false,
    });
  });

  it('reads doubles teams (t1p1, t1p2, t2p1, t2p2) before singles', () => {
    const parsed = parseExternalMatchLink(link({ t1p1: 'A', t1p2: 'B', t2p1: 'C', t2p2: 'D' }), ALLOWED);
    expect(parsed?.playerNames).toEqual(['A', 'B', 'C', 'D']);
    expect(parsed?.config.isDoubles).toBe(true);
  });

  it('reads 3 or 4 singles players (p3, p4) and rejects p4 without p3 (spec 132, RM-09)', () => {
    expect(parseExternalMatchLink(link({ p3: 'Carol' }), ALLOWED)?.playerNames).toEqual(['Alice', 'Bob', 'Carol']);
    expect(parseExternalMatchLink(link({ p3: 'Carol', p4: 'Dave' }), ALLOWED)?.playerNames)
      .toEqual(['Alice', 'Bob', 'Carol', 'Dave']);
    expect(parseExternalMatchLink(link({ p4: 'Dave' }), ALLOWED)).toBeNull();
    expect(stripExternalMatchParams('?p3=Carol&p4=Dave&keep=1')).toBe('?keep=1');
  });

  it('cleans names (control characters, spaces, length)', () => {
    const parsed = parseExternalMatchLink(link({ p1: '  Al\u0000ice   B ', p2: 'x'.repeat(50) }), ALLOWED);
    expect(parsed?.playerNames).toEqual(['Alice B', 'x'.repeat(32)]);
  });

  it('accepts the current contract version and rejects an unknown one', () => {
    expect(parseExternalMatchLink(link({ v: '1' }), ALLOWED)?.playerNames).toEqual(['Alice', 'Bob']);
    expect(parseExternalMatchLink(link({ v: ' 1 ' }), ALLOWED)).not.toBeNull();
    expect(parseExternalMatchLink(link({ v: '2' }), ALLOWED)).toBeNull();
    expect(parseExternalMatchLink(link({ v: '' }), ALLOWED)).toBeNull();
  });

  it.each([
    ['no params', ''],
    ['another game', link({ game: 'cricket' })],
    ['missing return', `?game=x01&p1=A&p2=B`],
    ['non allowed return', link({ return: 'https://evil.fr/x' })],
    ['missing player 2', `?game=x01&p1=A&return=${encodeURIComponent(RETURN)}`],
    ['blank player name', link({ p2: '   ' })],
    ['invalid start', link({ start: 'abc' })],
    ['start too low', link({ start: '1' })],
    ['invalid out rule', link({ out: 'triple' })],
    ['invalid in rule', link({ in: '' })],
    ['legs out of range', link({ legs: '0' })],
    ['decimal legs', link({ legs: '2.5' })],
    ['invalid sets', link({ sets: '99' })],
  ])('returns null for %s', (_label, search) => {
    expect(parseExternalMatchLink(search, ALLOWED)).toBeNull();
  });

  it('returns null when the feature is off (no allowed origin)', () => {
    expect(parseExternalMatchLink(link({}), policy([]))).toBeNull();
  });
});

describe('sanitizeExternalPlayerName', () => {
  it.each([
    ['bidi override (U+202E)', 'Ali\u202Ece', 'Alice'],
    ['zero-width space and joiner', 'Al\u200Bi\u200Dce', 'Alice'],
    ['byte order mark', '\uFEFFAlice', 'Alice'],
    ['tabs and new lines', 'Alice\t\nB', 'Alice B'],
  ])('removes %s', (_label, raw, expected) => {
    expect(sanitizeExternalPlayerName(raw)).toBe(expected);
  });

  it('normalizes to NFC so a composed and a decomposed name are equal', () => {
    expect(sanitizeExternalPlayerName('Ame\u0301lie')).toBe('Am\u00e9lie');
  });

  it('never splits an emoji when cutting at 32 characters', () => {
    const name = sanitizeExternalPlayerName(`${'x'.repeat(31)}\u{1F3AF}\u{1F3AF}`);
    expect(Array.from(name ?? '')).toHaveLength(32);
    expect(name?.endsWith('\u{1F3AF}')).toBe(true);
  });

  it('returns null for a missing or invisible-only name', () => {
    expect(sanitizeExternalPlayerName(null)).toBeNull();
    expect(sanitizeExternalPlayerName('\u202E\u200B  ')).toBeNull();
  });
});

describe('analyzeExternalMatchLink', () => {
  it('is absent without game nor return (a usual start)', () => {
    expect(analyzeExternalMatchLink('', ALLOWED)).toEqual({ status: 'absent' });
    expect(analyzeExternalMatchLink('?mode=personal_phone&p1=A', ALLOWED)).toEqual({ status: 'absent' });
  });

  it('returns the valid link', () => {
    const analysis = analyzeExternalMatchLink(link({}), ALLOWED);
    expect(analysis.status).toBe('valid');
  });

  it.each([
    ['unsupported-version', link({ v: '2' })],
    ['unsupported-game', link({ game: 'cricket' })],
    ['unsupported-game', `?return=${encodeURIComponent(RETURN)}`],
    ['missing-return', '?game=x01&p1=A&p2=B'],
    ['missing-return', link({ return: '  ' })],
    ['missing-players', link({ p2: '' })],
    ['invalid-start', link({ start: '1' })],
    ['invalid-in', link({ in: 'triple' })],
    ['invalid-out', link({ out: '' })],
    ['invalid-legs', link({ legs: '16' })],
    ['invalid-sets', link({ sets: 'x' })],
    ['invalid-stats', link({ stats: 'yes' })],
  ])('reports %s', (issue, search) => {
    expect(analyzeExternalMatchLink(search, ALLOWED)).toEqual({ status: 'invalid', issue });
  });

  it('reports a disabled feature before checking the return URL', () => {
    expect(analyzeExternalMatchLink(link({}), policy([]))).toEqual({ status: 'invalid', issue: 'feature-disabled' });
  });

  it('reports a non-allowed return URL with its host when parseable', () => {
    expect(analyzeExternalMatchLink(link({ return: 'https://evil.fr/x' }), ALLOWED))
      .toEqual({ status: 'invalid', issue: 'return-not-allowed', returnHost: 'evil.fr' });
    expect(analyzeExternalMatchLink(link({ return: '/relative' }), ALLOWED))
      .toEqual({ status: 'invalid', issue: 'return-not-allowed' });
  });

  it('reads the stats flag (1 or 0, absent = 0)', () => {
    expect(parseExternalMatchLink(link({ stats: '1' }), ALLOWED)?.includeStats).toBe(true);
    expect(parseExternalMatchLink(link({ stats: ' 0 ' }), ALLOWED)?.includeStats).toBe(false);
    expect(parseExternalMatchLink(link({}), ALLOWED)?.includeStats).toBe(false);
  });
});

describe('stripExternalMatchParams', () => {
  it('removes only the external match params', () => {
    expect(stripExternalMatchParams(`${link({ legs: '2', v: '1', stats: '1' })}&mode=personal_phone`)).toBe('?mode=personal_phone');
    expect(stripExternalMatchParams(link({}))).toBe('');
    expect(stripExternalMatchParams('')).toBe('');
  });
});

describe('countLegsWonByTeam', () => {
  it('counts every won leg, including the final leg kept in currentLeg', () => {
    const match = finished(singles, baseConfig, ['p1', 'p2', 'p1', 'p1']);
    expect(countLegsWonByTeam(match)).toEqual({ p1: 3, p2: 1 });
  });

  it('ignores legs without winner', () => {
    const match = { ...createMatch(singles, baseConfig), completedLegs: [leg(null)], currentLeg: leg(null) };
    expect(countLegsWonByTeam(match)).toEqual({});
  });
});

const NOW = Date.UTC(2026, 10, 19, 12);

const contextFor = (players: Player[], config: GameConfig, returnUrl = RETURN): ExternalMatchContext => ({
  returnUrl,
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
});

describe('createExternalMatchContext', () => {
  it('keeps the return URL, the players and the imposed format (copies)', () => {
    const parsed = parseExternalMatchLink(link({ legs: '2' }), ALLOWED);
    if (!parsed) throw new Error('link should be valid');
    const context = createExternalMatchContext(parsed, NOW);
    expect(context).toEqual({ returnUrl: RETURN, playerNames: ['Alice', 'Bob'], config: parsed.config, createdAt: NOW });
    const withStats = parseExternalMatchLink(link({ stats: '1' }), ALLOWED);
    if (!withStats) throw new Error('link should be valid');
    expect(createExternalMatchContext(withStats, NOW).includeStats).toBe(true);
    expect(context.playerNames).not.toBe(parsed.playerNames);
    expect(context.config).not.toBe(parsed.config);
  });
});

describe('isExternalMatchContext', () => {
  const valid = contextFor(singles, baseConfig);

  it('accepts a context with or without the stats flag', () => {
    expect(isExternalMatchContext({ ...valid, includeStats: true })).toBe(true);
    expect(isExternalMatchContext({ ...valid, includeStats: 'yes' })).toBe(false);
  });

  it('accepts singles, doubles and sets contexts', () => {
    expect(isExternalMatchContext(valid)).toBe(true);
    expect(isExternalMatchContext(contextFor(doubles, { ...baseConfig, isDoubles: true }))).toBe(true);
    expect(isExternalMatchContext(contextFor(singles, { ...baseConfig, matchMode: 'SETS', setsToWin: 2 }))).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'https://badarts.fr'],
    ['the former shape (return URL only)', { returnUrl: RETURN }],
    ['a missing creation date', { ...valid, createdAt: undefined }],
    ['a non numeric creation date', { ...valid, createdAt: '2026-11-19' }],
    ['a non finite creation date', { ...valid, createdAt: Number.NaN }],
    ['a non string return URL', { ...valid, returnUrl: 12 }],
    ['players that are not an array', { ...valid, playerNames: 'Alice,Bob' }],
    ['an empty player name', { ...valid, playerNames: ['Alice', ''] }],
    ['a non string player name', { ...valid, playerNames: ['Alice', 2] }],
    ['a wrong player count', { ...valid, playerNames: ['Alice', 'Bob', 'Carl', 'Dan', 'Eve'] }],
    ['a single player', { ...valid, playerNames: ['Alice'] }],
    ['doubles with 2 names', { ...valid, config: { ...valid.config, isDoubles: true } }],
    ['a missing config', { ...valid, config: null }],
    ['an invalid start score', { ...valid, config: { ...valid.config, startingScore: '501' } }],
    ['an invalid check in', { ...valid, config: { ...valid.config, checkIn: 'Triple' } }],
    ['an invalid check out', { ...valid, config: { ...valid.config, checkOut: undefined } }],
    ['an invalid match mode', { ...valid, config: { ...valid.config, matchMode: 'BEST_OF' } }],
    ['invalid legs', { ...valid, config: { ...valid.config, legsToWin: '3' } }],
    ['invalid doubles flag', { ...valid, config: { ...valid.config, isDoubles: 'no' } }],
    ['invalid sets', { ...valid, config: { ...valid.config, setsToWin: '2' } }],
  ])('rejects %s', (_label, value) => {
    expect(isExternalMatchContext(value)).toBe(false);
  });
});

describe('context expiry on a shared device', () => {
  const context = contextFor(singles, baseConfig);

  it('keeps a context within the TTL and expires it after', () => {
    expect(isExternalMatchContextExpired(context, NOW)).toBe(false);
    expect(isExternalMatchContextExpired(context, NOW + EXTERNAL_MATCH_CONTEXT_TTL_MS)).toBe(false);
    expect(isExternalMatchContextExpired(context, NOW + EXTERNAL_MATCH_CONTEXT_TTL_MS + 1)).toBe(true);
  });

  it('tolerates a small clock skew but expires a context dated in the future', () => {
    expect(isExternalMatchContextExpired(context, NOW - 60_000)).toBe(false);
    expect(isExternalMatchContextExpired(context, NOW - 10 * 60_000)).toBe(true);
  });

  it('restores only well-formed and fresh contexts', () => {
    expect(restoreExternalMatchContext(context, NOW + 1000)).toBe(context);
    expect(restoreExternalMatchContext(context, NOW + EXTERNAL_MATCH_CONTEXT_TTL_MS + 1)).toBeNull();
    expect(restoreExternalMatchContext({ returnUrl: RETURN }, NOW)).toBeNull();
    expect(restoreExternalMatchContext(null, NOW)).toBeNull();
  });
});

describe('getExternalReturnHost', () => {
  it('returns the host of an allowed return URL, null otherwise', () => {
    expect(getExternalReturnHost(contextFor(singles, baseConfig), ALLOWED)).toBe('badarts.fr');
    expect(getExternalReturnHost(contextFor(singles, baseConfig, 'http://localhost:7020/x'), ALLOWED)).toBe('localhost:7020');
    expect(getExternalReturnHost(contextFor(singles, baseConfig, 'https://evil.fr/x'), ALLOWED)).toBeNull();
  });
});

describe('matchFollowsExternalLink', () => {
  const context = contextFor(singles, baseConfig);

  it('accepts the linked singles and doubles matches', () => {
    expect(matchFollowsExternalLink(context, createMatch(singles, baseConfig))).toBe(true);
    const doublesConfig = { ...baseConfig, isDoubles: true };
    expect(matchFollowsExternalLink(contextFor(doubles, doublesConfig), createMatch(doubles, doublesConfig))).toBe(true);
  });

  it('applies a Double-In link opening to the played match (spec 046)', () => {
    const doubleInConfig = { ...baseConfig, checkIn: 'Double' as const };
    const match = createMatch(singles, doubleInConfig);
    expect(matchFollowsExternalLink(contextFor(singles, doubleInConfig), match)).toBe(true);
    expect(buildScoreSubmissionResult(match, 60, 0)).toEqual({ kind: 'opening_confirm', score: 60 });
  });

  it('ignores sets to win in the legs format', () => {
    expect(matchFollowsExternalLink(context, createMatch(singles, { ...baseConfig, setsToWin: 4 }))).toBe(true);
  });

  it.each<[string, Partial<GameConfig>]>([
    ['start score', { startingScore: 301 }],
    ['check in', { checkIn: 'Double' }],
    ['check out', { checkOut: 'Open' }],
    ['match mode', { matchMode: 'SETS' }],
    ['legs to win', { legsToWin: 5 }],
  ])('rejects a changed %s', (_label, change) => {
    expect(matchFollowsExternalLink(context, createMatch(singles, { ...baseConfig, ...change }))).toBe(false);
  });

  it('rejects changed sets to win in the sets format', () => {
    const setsConfig = { ...baseConfig, matchMode: 'SETS' as const, setsToWin: 2 };
    const setsContext = contextFor(singles, setsConfig);
    expect(matchFollowsExternalLink(setsContext, createMatch(singles, setsConfig))).toBe(true);
    expect(matchFollowsExternalLink(setsContext, createMatch(singles, { ...setsConfig, setsToWin: 3 }))).toBe(false);
  });

  it('rejects a changed doubles flag', () => {
    expect(matchFollowsExternalLink(context, createMatch(singles, { ...baseConfig, isDoubles: true }))).toBe(false);
  });

  it.each<[string, Player[]]>([
    ['renamed player', [singles[0], { ...singles[1], name: 'Robert' }]],
    ['swapped players', [{ ...singles[0], name: 'Bob' }, { ...singles[1], name: 'Alice' }]],
    ['a single player', [singles[0]]],
    ['a bot', [singles[0], { ...singles[1], isBot: true }]],
    ['an unexpected player id', [singles[0], { ...singles[1], id: 'p3' }]],
    ['an unexpected team', [singles[0], { ...singles[1], teamId: 'p1' }]],
  ])('rejects a %s', (_label, players) => {
    expect(matchFollowsExternalLink(context, createMatch(players, baseConfig))).toBe(false);
  });

  it('rejects doubles players moved to the other team', () => {
    const doublesConfig = { ...baseConfig, isDoubles: true };
    const moved = doubles.map((player) => (player.id === 't1p2' ? { ...player, teamId: 'team2' } : player));
    expect(matchFollowsExternalLink(contextFor(doubles, doublesConfig), createMatch(moved, doublesConfig))).toBe(false);
  });

  it('rejects a context whose player count does not match its format', () => {
    const broken = { ...context, playerNames: ['Alice', 'Bob', 'Carl'] };
    expect(matchFollowsExternalLink(broken, createMatch(singles, baseConfig))).toBe(false);
  });
});

describe('buildExternalReturnUrl', () => {
  const context = contextFor(singles, baseConfig);

  it('adds status, legs and winner for a singles match, keeping existing params', () => {
    const url = buildExternalReturnUrl(context, finished(singles, baseConfig, ['p1', 'p2', 'p1', 'p1']), ALLOWED);
    expect(url).toBe('https://badarts.fr/poule/abc?match=12&v=1&status=completed&legs1=3&legs2=1&winner=1');
  });

  it('replaces result params already present in the return URL', () => {
    const preset = contextFor(singles, baseConfig, `${RETURN}&winner=2&status=pending`);
    const url = new URL(buildExternalReturnUrl(preset, finished(singles, baseConfig, ['p1', 'p1', 'p1']), ALLOWED) ?? '');
    expect(url.searchParams.getAll('winner')).toEqual(['1']);
    expect(url.searchParams.getAll('status')).toEqual(['completed']);
  });

  it('maps teams for doubles and reports winner 2', () => {
    const config = { ...baseConfig, isDoubles: true, legsToWin: 2 };
    const url = buildExternalReturnUrl(contextFor(doubles, config), finished(doubles, config, ['team1', 'team2', 'team2']), ALLOWED);
    expect(url).toBe('https://badarts.fr/poule/abc?match=12&v=1&status=completed&legs1=1&legs2=2&winner=2');
  });

  it('adds sets and counts legs from history in SETS mode (legsWon is reset)', () => {
    const config = { ...baseConfig, matchMode: 'SETS' as const, setsToWin: 2, legsToWin: 2 };
    const match = finished(singles, config, ['p1', 'p1', 'p2', 'p1', 'p1'], {
      legsWon: { p1: 0, p2: 0 },
      setsWon: { p1: 2, p2: 0 },
    });
    const url = new URL(buildExternalReturnUrl(contextFor(singles, config), match, ALLOWED) ?? '');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      match: '12', v: '1', status: 'completed', legs1: '4', legs2: '1', sets1: '2', sets2: '0', winner: '1',
    });
  });

  it('reports 0 for a team without any won leg or set (whitewash)', () => {
    const legsUrl = buildExternalReturnUrl(context, finished(singles, baseConfig, ['p2', 'p2', 'p2']), ALLOWED);
    expect(legsUrl).toBe('https://badarts.fr/poule/abc?match=12&v=1&status=completed&legs1=0&legs2=3&winner=2');

    const config = { ...baseConfig, matchMode: 'SETS' as const, setsToWin: 1, legsToWin: 1 };
    const setsMatch = finished(singles, config, ['p1'], { setsWon: { p1: 1 } });
    const setsUrl = new URL(buildExternalReturnUrl(contextFor(singles, config), setsMatch, ALLOWED) ?? '');
    expect(setsUrl.searchParams.get('sets2')).toBe('0');
    expect(setsUrl.searchParams.get('legs2')).toBe('0');
  });

  it('returns null while the match is not finished', () => {
    expect(buildExternalReturnUrl(context, createMatch(singles, baseConfig), ALLOWED)).toBeNull();
  });

  it('returns null when the return URL is no longer allowed (edited storage)', () => {
    const match = finished(singles, baseConfig, ['p1', 'p1', 'p1']);
    expect(buildExternalReturnUrl(contextFor(singles, baseConfig, 'https://evil.fr/x'), match, ALLOWED)).toBeNull();
  });

  it('returns null when the match is not the linked one (players or format changed)', () => {
    const solo = finished([singles[0]], baseConfig, ['p1', 'p1', 'p1']);
    expect(buildExternalReturnUrl(context, solo, ALLOWED)).toBeNull();
    const bot = finished([singles[0], { id: 'bot', name: 'Bot', teamId: 'bot', isBot: true }], baseConfig, ['p1', 'p1', 'p1']);
    expect(buildExternalReturnUrl(context, bot, ALLOWED)).toBeNull();
    const swapped = finished([{ ...singles[0], name: 'Bob' }, { ...singles[1], name: 'Alice' }], baseConfig, ['p1', 'p1', 'p1']);
    expect(buildExternalReturnUrl(context, swapped, ALLOWED)).toBeNull();
    const shorter = finished(singles, { ...baseConfig, legsToWin: 1 }, ['p1']);
    expect(buildExternalReturnUrl(context, shorter, ALLOWED)).toBeNull();
  });

  it('returns null when the winner is not one of the linked teams', () => {
    const match = finished(singles, baseConfig, ['p1', 'p1', 'p1'], { matchWinnerId: 'team9' });
    expect(buildExternalReturnUrl(context, match, ALLOWED)).toBeNull();
  });
});

describe('buildExternalReturnUrl with 3 or 4 players (spec 132, RM-09)', () => {
  const four: Player[] = ['Alice', 'Bob', 'Carol', 'Dave'].map((name, index) => ({ id: `p${index + 1}`, name, teamId: `p${index + 1}` }));
  const config = { ...baseConfig, startingScore: 101, checkOut: 'Open' as const, legsToWin: 1 };
  const play = (match: MatchState, scores: number[]) => scores.reduce((current, score) => submitTurn(current, score, 3), match);

  it('returns legs per side, the winner index, each final rank and the number of played places', () => {
    // Ordre Carol, Alice, Dave, Bob : Carol gagne, Dave prend la 2e place ; Alice et Bob, à égalité, sont 3es ex aequo.
    const won = play(resolveMatchOrder(createMatch(four, config), ['p3', 'p1', 'p4', 'p2']), [101]);
    const match = play(startPlacementRound(won), [0, 101]);
    const url = new URL(buildExternalReturnUrl(contextFor(four, config), match, ALLOWED) ?? '');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      match: '12', v: '1', status: 'completed',
      legs1: '0', legs2: '0', legs3: '1', legs4: '0', winner: '3',
      rank1: '3', rank2: '3', rank3: '1', rank4: '2', places: '2',
    });
  });

  it('reports a single played place when the placements are declined', () => {
    const three = four.slice(0, 3);
    const match = play(createMatch(three, config), [101]);
    const url = new URL(buildExternalReturnUrl(contextFor(three, config), match, ALLOWED) ?? '');
    expect(url.searchParams.get('winner')).toBe('1');
    expect(url.searchParams.get('rank1')).toBe('1');
    expect(url.searchParams.get('places')).toBe('1');
  });
});

describe('buildExternalReturnUrl with stats=1', () => {
  const config = { ...baseConfig, startingScore: 301, legsToWin: 1 };
  const turn = (playerId: string, score: number, remainingAfter: number) =>
    ({ playerId, score, isBust: false, remainingAfter, dartsThrown: 3 });
  const playedMatch = (): MatchState => ({
    ...createMatch(singles, config),
    currentLeg: {
      scores: { p1: 0, p2: 201 },
      history: [turn('p1', 180, 121), turn('p2', 100, 201), turn('p1', 121, 0)],
      winnerId: 'p1',
      startingPlayerIndex: 0,
    },
    status: 'finished',
    matchWinnerId: 'p1',
    duration: 312.4,
  });

  it('adds averages, 180s, highest checkouts and duration per side in link order', () => {
    const context = { ...contextFor(singles, config), includeStats: true };
    const url = new URL(buildExternalReturnUrl(context, playedMatch(), ALLOWED) ?? '');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      match: '12', v: '1', status: 'completed', legs1: '1', legs2: '0', winner: '1',
      avg1: '150.50', n180_1: '1', hco1: '121',
      avg2: '100.00', n180_2: '0', hco2: '0',
      duration: '312',
    });
  });

  it('adds no stats without the flag', () => {
    const url = new URL(buildExternalReturnUrl(contextFor(singles, config), playedMatch(), ALLOWED) ?? '');
    expect(url.searchParams.has('avg1')).toBe(false);
    expect(url.searchParams.has('duration')).toBe(false);
  });

  it('reports zeros for a team without turns and a negative duration', () => {
    const context = { ...contextFor(singles, baseConfig), includeStats: true };
    const match = finished(singles, baseConfig, ['p1', 'p1', 'p1'], { duration: -5 });
    const url = new URL(buildExternalReturnUrl(context, match, ALLOWED) ?? '');
    expect(url.searchParams.get('avg2')).toBe('0.00');
    expect(url.searchParams.get('hco2')).toBe('0');
    expect(url.searchParams.get('duration')).toBe('0');
  });
});

describe('buildExternalCancelUrl', () => {
  it('adds status=cancelled without any score, keeping existing params', () => {
    expect(buildExternalCancelUrl(contextFor(singles, baseConfig), ALLOWED))
      .toBe('https://badarts.fr/poule/abc?match=12&v=1&status=cancelled');
  });

  it('returns null when the return URL is not allowed', () => {
    expect(buildExternalCancelUrl(contextFor(singles, baseConfig, 'https://evil.fr/x'), ALLOWED)).toBeNull();
    expect(buildExternalCancelUrl(contextFor(singles, baseConfig), policy([]))).toBeNull();
  });
});
