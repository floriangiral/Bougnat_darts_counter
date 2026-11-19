import { describe, expect, it } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import {
  buildExternalReturnUrl,
  countLegsWonByTeam,
  isAllowedReturnUrl,
  parseAllowedOrigins,
  parseExternalMatchLink,
  stripExternalMatchParams,
} from '../../../src/features/external-match/externalMatchLink';
import type { GameConfig, LegState, MatchState, Player } from '../../../types';

// Spec ref: spec:counter/external-match-link
const ALLOWED = ['https://badarts.fr', 'http://localhost:7020'];
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
    expect(isAllowedReturnUrl(RETURN, [])).toBe(false);
  });

  it('rejects plain http on an allowed non-local origin', () => {
    expect(isAllowedReturnUrl('http://example.org/x', ['http://example.org'])).toBe(false);
  });
});

describe('parseExternalMatchLink', () => {
  it('reads a singles X01 link with defaults (501, open in, double out, 3 legs)', () => {
    expect(parseExternalMatchLink(link({}), ALLOWED)).toEqual({
      playerNames: ['Alice', 'Bob'],
      returnUrl: RETURN,
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

  it('cleans names (control characters, spaces, length)', () => {
    const parsed = parseExternalMatchLink(link({ p1: '  Al\u0000ice   B ', p2: 'x'.repeat(50) }), ALLOWED);
    expect(parsed?.playerNames).toEqual(['Alice B', 'x'.repeat(32)]);
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
    expect(parseExternalMatchLink(link({}), [])).toBeNull();
  });
});

describe('stripExternalMatchParams', () => {
  it('removes only the external match params', () => {
    expect(stripExternalMatchParams(`${link({ legs: '2' })}&mode=personal_phone`)).toBe('?mode=personal_phone');
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

describe('buildExternalReturnUrl', () => {
  const context = { returnUrl: RETURN };

  it('adds legs and winner for a singles match, keeping existing params', () => {
    const url = buildExternalReturnUrl(context, finished(singles, baseConfig, ['p1', 'p2', 'p1', 'p1']), ALLOWED);
    expect(url).toBe('https://badarts.fr/poule/abc?match=12&legs1=3&legs2=1&winner=1');
  });

  it('maps teams for doubles and reports winner 2', () => {
    const config = { ...baseConfig, isDoubles: true, legsToWin: 2 };
    const url = buildExternalReturnUrl(context, finished(doubles, config, ['team1', 'team2', 'team2']), ALLOWED);
    expect(url).toBe('https://badarts.fr/poule/abc?match=12&legs1=1&legs2=2&winner=2');
  });

  it('adds sets and counts legs from history in SETS mode (legsWon is reset)', () => {
    const config = { ...baseConfig, matchMode: 'SETS' as const, setsToWin: 2, legsToWin: 2 };
    const match = finished(singles, config, ['p1', 'p1', 'p2', 'p1', 'p1'], {
      legsWon: { p1: 0, p2: 0 },
      setsWon: { p1: 2, p2: 0 },
    });
    const url = new URL(buildExternalReturnUrl(context, match, ALLOWED) ?? '');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      match: '12', legs1: '4', legs2: '1', sets1: '2', sets2: '0', winner: '1',
    });
  });

  it('reports 0 for a team without any won leg or set (whitewash)', () => {
    const legsUrl = buildExternalReturnUrl(context, finished(singles, baseConfig, ['p2', 'p2', 'p2']), ALLOWED);
    expect(legsUrl).toBe('https://badarts.fr/poule/abc?match=12&legs1=0&legs2=3&winner=2');

    const config = { ...baseConfig, matchMode: 'SETS' as const, setsToWin: 1, legsToWin: 1 };
    const setsMatch = finished(singles, config, ['p1'], { setsWon: { p1: 1 } });
    const setsUrl = new URL(buildExternalReturnUrl(context, setsMatch, ALLOWED) ?? '');
    expect(setsUrl.searchParams.get('sets2')).toBe('0');
    expect(setsUrl.searchParams.get('legs2')).toBe('0');
  });

  it('returns null while the match is not finished', () => {
    expect(buildExternalReturnUrl(context, createMatch(singles, baseConfig), ALLOWED)).toBeNull();
  });

  it('returns null when the return URL is no longer allowed (edited storage)', () => {
    const match = finished(singles, baseConfig, ['p1', 'p1', 'p1']);
    expect(buildExternalReturnUrl({ returnUrl: 'https://evil.fr/x' }, match, ALLOWED)).toBeNull();
  });

  it('returns null when the players no longer match the link (changed in setup)', () => {
    const solo = finished([singles[0]], baseConfig, ['p1', 'p1', 'p1']);
    expect(buildExternalReturnUrl(context, solo, ALLOWED)).toBeNull();
    const bot = finished([singles[0], { id: 'bot', name: 'Bot', teamId: 'bot', isBot: true }], baseConfig, ['p1', 'p1', 'p1']);
    expect(buildExternalReturnUrl(context, bot, ALLOWED)).toBeNull();
  });
});
