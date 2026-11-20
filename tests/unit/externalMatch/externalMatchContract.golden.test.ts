import { describe, expect, it } from 'vitest';

import { createMatch, resolveMatchStart, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import {
  buildExternalCancelUrl,
  buildExternalReturnUrl,
  createExternalMatchContext,
  isExternalMatchLinkAttempt,
  parseExternalMatchLink,
} from '../../../src/features/external-match/externalMatchLink';
import type { ExternalMatchContext, ExternalMatchLink, ExternalReturnPolicy } from '../../../src/features/external-match/externalMatchLink';
import type { GameConfig, MatchState, Player } from '../../../types';

// Spec ref: spec:counter/external-match-link, Révision V2 (V2-FR-01, V2-FR-08, V2-AC-01, V2-AC-02).
// Contract v=1 is frozen: these URLs are the exact strings produced at commit 508dfa6. A change of the
// X01 engine (V2-ARCH-03, V2-ARCH-04) must not alter them; an intentional change requires v=2.

const POLICY: ExternalReturnPolicy = { origins: ['https://badarts.fr'], allowPrivateNetworkHttp: false };
const RETURN = 'https://badarts.fr/bougnat-retour?bougnat_match=42&token=abc';
const NOW = Date.UTC(2026, 10, 20, 12, 0, 0);

const parse = (params: Record<string, string>): ExternalMatchLink => {
  const search = `?${new URLSearchParams({ v: '1', game: 'x01', return: RETURN, ...params }).toString()}`;
  const link = parseExternalMatchLink(search, POLICY);
  if (!link) throw new Error(`Golden link rejected: ${search}`);
  return link;
};

/** Players as built by the locked setup of a linked match (link order). */
const playersFor = (link: ExternalMatchLink): Player[] => (link.config.isDoubles
  ? ['t1p1', 't1p2', 't2p1', 't2p2'].map((id, index) => ({
    id,
    name: link.playerNames[index],
    teamId: id.startsWith('t1') ? 'team1' : 'team2',
  }))
  : ['p1', 'p2'].map((id, index) => ({ id, name: link.playerNames[index], teamId: id })));

const configFor = (link: ExternalMatchLink): GameConfig => ({ setsToWin: 1, ...link.config });

const WINNER_TURNS = [180, 180, 141];
const LOSER_TURN = 60;

/** Plays one leg through the real engine: the winner checks out 501 in 9 darts, the other side scores 60. */
const playLeg = (match: MatchState, winnerTeamId: string): MatchState => {
  let next = match;
  let winnerTurn = 0;
  const legsPlayed = next.completedLegs.length;
  while (next.status !== 'finished' && next.completedLegs.length === legsPlayed) {
    const thrower = next.players[next.currentPlayerIndex];
    if (thrower.teamId === winnerTeamId) {
      next = submitTurn(next, WINNER_TURNS[winnerTurn], 3);
      winnerTurn += 1;
    } else {
      next = submitTurn(next, LOSER_TURN, 3);
    }
  }
  return next;
};

const playMatch = (link: ExternalMatchLink, legWinners: string[], starterId: string): {
  context: ExternalMatchContext;
  match: MatchState;
} => {
  let match = resolveMatchStart(createMatch(playersFor(link), configFor(link)), starterId);
  legWinners.forEach((winner) => {
    match = playLeg(match, winner);
  });
  return { context: createExternalMatchContext(link, NOW), match: { ...match, duration: 754.4 } };
};

describe('external match contract v=1 — golden result URLs', () => {
  it('singles 3-1 (spec example)', () => {
    const link = parse({ start: '501', out: 'double', legs: '3', p1: 'Alice', p2: 'Bob' });
    const { context, match } = playMatch(link, ['p1', 'p2', 'p1', 'p1'], '0');
    expect(match.status).toBe('finished');
    expect(buildExternalReturnUrl(context, match, POLICY)).toBe(
      'https://badarts.fr/bougnat-retour?bougnat_match=42&token=abc&v=1&status=completed&legs1=3&legs2=1&winner=1',
    );
  });

  it('doubles 2-3, won by team 2', () => {
    const link = parse({ legs: '3', t1p1: 'Alice', t1p2: 'Carl', t2p1: 'Bob', t2p2: 'Dan' });
    const { context, match } = playMatch(link, ['team1', 'team2', 'team1', 'team2', 'team2'], 'team1');
    expect(buildExternalReturnUrl(context, match, POLICY)).toBe(
      'https://badarts.fr/bougnat-retour?bougnat_match=42&token=abc&v=1&status=completed&legs1=2&legs2=3&winner=2',
    );
  });

  it('sets format: legs counted over the whole match, sets won', () => {
    const link = parse({ sets: '2', legs: '2', p1: 'Alice', p2: 'Bob' });
    const { context, match } = playMatch(link, ['p1', 'p1', 'p2', 'p2', 'p2', 'p2'], '0');
    expect(buildExternalReturnUrl(context, match, POLICY)).toBe(
      'https://badarts.fr/bougnat-retour?bougnat_match=42&token=abc&v=1&status=completed&legs1=2&legs2=4&sets1=1&sets2=2&winner=2',
    );
  });

  it('stats=1 adds averages, 180s, highest checkouts and duration', () => {
    const link = parse({ legs: '2', stats: '1', p1: 'Alice', p2: 'Bob' });
    const { context, match } = playMatch(link, ['p2', 'p1', 'p1'], '1');
    expect(buildExternalReturnUrl(context, match, POLICY)).toBe(
      'https://badarts.fr/bougnat-retour?bougnat_match=42&token=abc&v=1&status=completed&legs1=2&legs2=1&winner=1'
      + '&avg1=140.25&n180_1=4&hco1=141&avg2=100.13&n180_2=2&hco2=141&duration=754',
    );
  });

  it('cancelled carries only the version and the status', () => {
    const link = parse({ p1: 'Alice', p2: 'Bob' });
    expect(buildExternalCancelUrl(createExternalMatchContext(link, NOW), POLICY)).toBe(
      'https://badarts.fr/bougnat-retour?bougnat_match=42&token=abc&v=1&status=cancelled',
    );
  });

  it('ignores an unknown parameter without invalidating the link (additive params only)', () => {
    const withUnknown = parse({ p1: 'Alice', p2: 'Bob', label: 'Poule A', future_option: 'x' });
    expect(withUnknown).toEqual(parse({ p1: 'Alice', p2: 'Bob' }));
  });
});

describe('isExternalMatchLinkAttempt (Web Analytics skipped on link loads)', () => {
  it.each([
    ['?game=x01&p1=A', true],
    ['?return=https%3A%2F%2Fbadarts.fr%2Fx', true],
    ['?game=', true],
    ['?mode=personal_phone&p1=A', false],
    ['?source=pwa', false],
    ['', false],
  ])('%s -> %s', (search, expected) => {
    expect(isExternalMatchLinkAttempt(search)).toBe(expected);
  });
});
