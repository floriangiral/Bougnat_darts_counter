import { describe, expect, it } from 'vitest';

import { buildTriathlonScorecards, getTriathlonWinnerId, sortTriathlonScorecards, type TriathlonScorecard } from '../../utils/triathlonScoring';
import type { CapitalPlayerState, Player } from '../../types';
import { createMatch, submitTurn } from '../../src/application/scoring/matchLifecycle';
import type { CricketMatchSummary, GameConfig } from '../../types';

describe('triathlonScoring', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice', teamId: 'p1' },
    { id: 'p2', name: 'Bob', teamId: 'p2' },
  ];
  const config: GameConfig = {
    startingScore: 40, checkIn: 'Open', checkOut: 'Double',
    matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
  };

  it('awards individual Capital rank and performance bonuses including shared bonuses', () => {
    const results: CapitalPlayerState[] = players.map((player, index) => ({
      ...player, score: index === 0 ? 100 : 50, targetIndex: 17,
      history: [
        { target: 'CAPITAL', darts: [], pointsScored: 50, isSuccess: true },
        { target: '20', darts: [], pointsScored: 0, isSuccess: false },
      ],
    }));
    const [alice, bob] = buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, capitalResults: results });
    expect(alice.capital).toMatchObject({ basePoints: 20, bonusPoints: 13, totalPoints: 33 });
    expect(bob.capital).toMatchObject({ basePoints: 16, bonusPoints: 8, totalPoints: 24 });
    expect(alice.capital.bonuses).toEqual([
      { label: 'Score cumule', points: 5, detail: '100 pts' },
      { label: 'Regularite', points: 4, detail: '1 reussites' },
      { label: 'Peu de penalites', points: 4, detail: '1' },
    ]);
    expect(alice.totalScore).toBe(33);
    expect(bob.totalScore).toBe(24);
    expect(alice.cricket.totalPoints).toBe(0);
  });

  it('awards Cricket MPR, score and closing bonuses without dividing by zero', () => {
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
      basePoints: 20, bonusPoints: 13, totalPoints: 33,
      summary: 'Score 60, MPR 3.00, 2 numeros fermes.',
    });
    expect(alice.cricket.bonuses).toEqual([
      { label: 'Meilleur MPR', points: 5, detail: '3.00' },
      { label: 'Difference de score', points: 4, detail: '60 pts' },
      { label: 'Numeros fermes', points: 4, detail: '2' },
    ]);
    expect(bob.cricket).toMatchObject({ basePoints: 14, bonusPoints: 0, summary: 'Score 0, MPR 0.00, 0 numeros fermes.' });
  });

  it('computes X01 bonuses from actual finished match history in singles and doubles', () => {
    for (const isDoubles of [false, true]) {
      const match = submitTurn(createMatch(players, { ...config, isDoubles }), 40, 2);
      const [alice, bob] = buildTriathlonScorecards({
        competitors: players, sourcePlayers: players, isDoubles, x01Match: match,
      });
      expect(alice.x01).toMatchObject({ basePoints: 20, bonusPoints: 14, totalPoints: 34 });
      expect(alice.x01.bonuses).toEqual([
        { label: 'Checkout eleve', points: 4, detail: '40' },
        { label: 'Meilleure moyenne', points: 5, detail: '60.0' },
        { label: 'Moins de flechettes', points: 5, detail: '2' },
      ]);
      expect(alice.x01.summary).toContain('Victoire 501.');
      expect(bob.x01).toMatchObject({ basePoints: 14, bonusPoints: 0 });
      expect(bob.x01.summary).toContain('Defaite 501.');
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
        competitorName: 'Equipe 1',
        capital: { key: 'capital', label: 'Capital', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        cricket: { key: 'cricket', label: 'Cricket', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        x01: { key: 'x01', label: '501', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: '', bonuses: [] },
        totalBasePoints: 60,
        totalBonusPoints: 0,
        totalScore: 60,
      },
      {
        competitorId: 'team2',
        competitorName: 'Equipe 2',
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
      { id: 'team1', name: 'Equipe 1', teamId: 'team1' },
      { id: 'team2', name: 'Equipe 2', teamId: 'team2' },
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
