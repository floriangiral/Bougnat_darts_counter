import { describe, expect, it } from 'vitest';

import { buildTriathlonScorecards, getTriathlonWinnerId, sortTriathlonScorecards, type TriathlonScorecard } from '../../utils/triathlonScoring';
import type { CapitalPlayerState, Player } from '../../types';
import { createMatch, submitTurn } from '../../src/application/scoring/matchLifecycle';
import type { CricketMatchSummary, GameConfig } from '../../types';
import { resolveTriathlonScoringVersion, TRIATHLON_SCORING_RULES, TRIATHLON_SCORING_VERSION } from '../../src/domain/triathlon';

describe('triathlonScoring', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice', teamId: 'p1' },
    { id: 'p2', name: 'Bob', teamId: 'p2' },
  ];
  const config: GameConfig = {
    startingScore: 40, checkIn: 'Open', checkOut: 'Double',
    matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
  };

  it('awards Capital rank points and only the bonuses that separate the competitors', () => {
    const results: CapitalPlayerState[] = players.map((player, index) => ({
      ...player, score: index === 0 ? 100 : 50, targetIndex: 3,
      history: [
        { target: 'CAPITAL', darts: [], pointsScored: 50, isSuccess: true },
        { target: '20', darts: [], pointsScored: index === 0 ? 40 : 0, isSuccess: index === 0 },
        { target: 'SUITE', darts: [], pointsScored: 0, isSuccess: false },
      ],
    }));
    const [alice, bob] = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, capitalResults: results });
    expect(alice.capital).toMatchObject({ basePoints: 20, bonusPoints: 8, totalPoints: 28 });
    expect(bob.capital).toMatchObject({ basePoints: 16, bonusPoints: 0, totalPoints: 16 });
    expect(alice.capital.bonuses).toEqual([
      { label: 'Régularité', points: 4, detail: '2 réussites' },
      { label: 'Peu de pénalités', points: 4, detail: '1' },
    ]);
    expect(alice.totalScore).toBe(28);
    expect(bob.totalScore).toBe(16);
    expect(alice.cricket.totalPoints).toBe(0);
  });

  it('gives the same Capital points to tied competitors without any shared bonus', () => {
    const results: CapitalPlayerState[] = players.map((player) => ({
      ...player, score: 80, targetIndex: 1,
      history: [{ target: 'CAPITAL', darts: [], pointsScored: 80, isSuccess: true }],
    }));
    const cards = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, capitalResults: results });
    expect(cards.map((card) => card.capital.totalPoints)).toEqual([20, 20]);
    expect(cards.flatMap((card) => card.capital.bonuses)).toEqual([]);
  });

  it('awards Cricket winner points, MPR and closing bonuses without dividing by zero', () => {
    const summary: CricketMatchSummary = {
      competitors: [
        { id: 'p1', name: 'Alice', score: 60, dartsThrown: 6, history: [], marks: { 20: 3, 19: 3, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 } },
        { id: 'p2', name: 'Bob', score: 0, dartsThrown: 0, history: [], marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 } },
      ],
      legsWon: {}, setsWon: {}, currentSetLegsWon: {}, winnerId: 'p1',
      config, isDoubles: false, memberNamesByCompetitor: {},
    };
    const [alice, bob] = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, cricketSummary: summary });
    expect(alice.cricket).toMatchObject({
      basePoints: 20, bonusPoints: 9, totalPoints: 29,
      summary: 'Victoire Cricket. Score 60, MPR 3.00, 2 numéros fermés.',
    });
    expect(alice.cricket.bonuses).toEqual([
      { label: 'Meilleur MPR', points: 5, detail: '3.00' },
      { label: 'Numéros fermés', points: 4, detail: '2' },
    ]);
    expect(bob.cricket).toMatchObject({ basePoints: 14, bonusPoints: 0, summary: 'Défaite Cricket. Score 0, MPR 0.00, 0 numéros fermés.' });
  });

  it('gives the full close bonus with its detail and draw points when the winner is unknown', () => {
    const closed = { 20: 3, 19: 3, 18: 3, 17: 3, 16: 3, 15: 3, 25: 3 };
    const summary: CricketMatchSummary = {
      competitors: [
        { id: 'p1', name: 'Alice', score: 30, dartsThrown: 21, history: [], marks: closed },
        { id: 'p2', name: 'Bob', score: 30, dartsThrown: 21, history: [], marks: { ...closed, 25: 2 } },
      ],
      legsWon: {}, setsWon: {}, currentSetLegsWon: {}, winnerId: 'ghost',
      config, isDoubles: false, memberNamesByCompetitor: {},
    };
    const [alice, bob] = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, cricketSummary: summary });
    expect(alice.cricket.basePoints).toBe(17);
    expect(bob.cricket.basePoints).toBe(17);
    expect(alice.cricket.summary).toContain('Égalité Cricket.');
    expect(alice.cricket.bonuses).toEqual([
      { label: 'Meilleur MPR', points: 5, detail: '3.00' },
      { label: 'Fermeture complète', points: 4, detail: '7 cibles fermées' },
      { label: 'Numéros fermés', points: 4, detail: '7' },
    ]);
    expect(bob.cricket.bonuses).toEqual([]);
  });

  it('computes X01 bonuses from actual finished match history in singles and doubles', () => {
    for (const isDoubles of [false, true]) {
      const match = submitTurn(createMatch(players, { ...config, isDoubles }), 40, 2);
      const [alice, bob] = buildTriathlonScorecards({
        competitors: players, sourcePlayers: players, isDoubles, x01Match: match,
      });
      expect(alice.x01).toMatchObject({ basePoints: 20, bonusPoints: 9, totalPoints: 29 });
      expect(alice.x01.bonuses).toEqual([
        { label: 'Meilleure moyenne 9 premières fléchettes', points: 4, detail: '60.0' },
        { label: 'Meilleure moyenne', points: 5, detail: '60.0' },
      ]);
      expect(alice.x01.summary).toBe('Victoire 501. Moyenne 60.0, 9 premières 60.0, 0 visites à 100 ou plus, 2 fléchettes.');
      expect(bob.x01).toMatchObject({ basePoints: 14, bonusPoints: 0 });
      expect(bob.x01.summary).toContain('Défaite 501 (reste 40).');
    }
  });

  it('distinguishes a standard X01 loss from a close loss using darts and average gaps', () => {
    let match = createMatch(players, { ...config, startingScore: 301 });
    for (const score of [60, 0, 60, 0, 60, 0, 60, 0, 21, 0, 40]) {
      match = submitTurn(match, score, match.currentPlayerIndex === 0 ? 1 : 3);
    }
    expect(match.status).toBe('finished');
    const cards = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, x01Match: match });
    expect(cards[1].x01.basePoints).toBe(10);
  });

  it.each([
    [2, 14], [40, 14], [170, 14], [158, 14], [159, 10], [169, 10], [171, 10], [461, 10],
  ])('treats a Double-Out loser left on %i as a %i-point loss (checkout position)', (remaining, basePoints) => {
    // Alice termine 501 en une visite fictive ; Bob a d'abord ramené son reste à la valeur testée.
    let match = createMatch(players, { ...config, startingScore: 501, initialStartingPlayerIndex: 1 });
    match = submitTurn(match, 501 - remaining, 3);
    match = { ...match, currentLeg: { ...match.currentLeg, scores: { ...match.currentLeg.scores, p1: 40 } } };
    match = submitTurn(match, 40, 3);
    expect(match.matchWinnerId).toBe('p1');
    const [, bob] = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, x01Match: match });
    expect(bob.x01.basePoints).toBe(basePoints);
  });

  it('awards no 501 winner points when the match has no winner', () => {
    const match = submitTurn(createMatch(players, config), 38, 3);
    const cards = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, x01Match: match });
    expect(cards.map((card) => card.x01.basePoints)).toEqual([14, 14]);
    expect(cards[0].x01.summary).toContain('Défaite 501 (reste 2).');
  });

  it('keeps the maximum theoretical total at 100 points (34 / 33 / 33)', () => {
    const sumBonuses = (bonuses: Record<string, { points: number }>) =>
      Object.values(bonuses).reduce((sum, bonus) => sum + bonus.points, 0);
    const { x01, cricket, capital } = TRIATHLON_SCORING_RULES;
    const maxX01 = x01.winnerBasePoints + sumBonuses(x01.bonuses);
    const maxCricket = cricket.winnerBasePoints + sumBonuses(cricket.bonuses);
    const maxCapital = capital.rank.rankPoints[0] + sumBonuses(capital.bonuses);
    expect([maxX01, maxCricket, maxCapital]).toEqual([34, 33, 33]);
    expect(maxX01 + maxCricket + maxCapital).toBe(100);
    expect(TRIATHLON_SCORING_VERSION).toBe(2);
    expect(resolveTriathlonScoringVersion(undefined)).toBe(1);
    expect(resolveTriathlonScoringVersion(2)).toBe(2);
  });

  it('handles absent competitors, missing event metrics and ties without mutating input order', () => {
    expect(buildTriathlonScorecards({
      competitors: [], sourcePlayers: [], isDoubles: false, capitalResults: [],
    })).toEqual([]);
    expect(getTriathlonWinnerId([])).toBeNull();
    const cards = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false });
    const reversed = [...cards].reverse();
    expect(sortTriathlonScorecards(reversed).map((card) => card.competitorId)).toEqual(['p1', 'p2']);
    expect(reversed.map((card) => card.competitorId)).toEqual(['p2', 'p1']);
    expect(sortTriathlonScorecards(cards, 'p1')[0].competitorId).toBe('p1');
  });

  it('sorts tied competitors with the tie-break winner first', () => {
    const scorecards: TriathlonScorecard[] = [
      {
        competitorId: 'team1',
        competitorName: 'Équipe 1',
        capital: { key: 'capital', label: 'Capital', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        cricket: { key: 'cricket', label: 'Cricket', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        x01: { key: 'x01', label: '501', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        totalBasePoints: 60,
        totalBonusPoints: 0,
        totalScore: 60,
      },
      {
        competitorId: 'team2',
        competitorName: 'Équipe 2',
        capital: { key: 'capital', label: 'Capital', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        cricket: { key: 'cricket', label: 'Cricket', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        x01: { key: 'x01', label: '501', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        totalBasePoints: 60,
        totalBonusPoints: 0,
        totalScore: 60,
      },
    ];

    const sorted = sortTriathlonScorecards(scorecards, 'team2');
    expect(sorted[0].competitorId).toBe('team2');
    expect(getTriathlonWinnerId(scorecards, 'team2')).toBe('team2');
  });

  it('aggregates Capital scores by team in doubles mode', () => {
    const competitors = [
      { id: 'team1', name: 'Équipe 1', teamId: 'team1' },
      { id: 'team2', name: 'Équipe 2', teamId: 'team2' },
    ];
    const sourcePlayers: Player[] = [
      { id: 'a1', name: 'A1', teamId: 'team1' },
      { id: 'a2', name: 'A2', teamId: 'team1' },
      { id: 'b1', name: 'B1', teamId: 'team2' },
      { id: 'b2', name: 'B2', teamId: 'team2' },
    ];
    const capitalResults: CapitalPlayerState[] = [
      { id: 'a1', name: 'A1', score: 180, targetIndex: 16, history: [{ target: 'CAPITAL', darts: [], pointsScored: 60, isSuccess: true }] },
      { id: 'a2', name: 'A2', score: 160, targetIndex: 16, history: [{ target: 'CAPITAL', darts: [], pointsScored: 50, isSuccess: true }] },
      { id: 'b1', name: 'B1', score: 140, targetIndex: 16, history: [{ target: 'CAPITAL', darts: [], pointsScored: 40, isSuccess: true }] },
      { id: 'b2', name: 'B2', score: 130, targetIndex: 16, history: [{ target: 'CAPITAL', darts: [], pointsScored: 35, isSuccess: true }] },
    ];

    const [team1, team2] = buildTriathlonScorecards({
      competitors,
      sourcePlayers,
      isDoubles: true,
      capitalResults,
    });

    expect(team1.competitorId).toBe('team1');
    expect(team1.capital.basePoints).toBeGreaterThan(team2.capital.basePoints);
    expect(team1.capital.summary).toContain('Score 340');
    expect(team2.capital.summary).toContain('Score 270');
  });
});
