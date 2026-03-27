import { describe, expect, it } from 'vitest';

import { buildTriathlonScorecards, getTriathlonWinnerId, sortTriathlonScorecards, type TriathlonScorecard } from '../../utils/triathlonScoring';
import type { CapitalPlayerState, Player } from '../../types';

describe('triathlonScoring', () => {
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
