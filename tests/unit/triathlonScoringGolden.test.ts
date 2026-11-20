import { describe, expect, it } from 'vitest';

import { createMatch, submitTurn } from '../../src/application/scoring/matchLifecycle';
import { buildTriathlonScorecards, type TriathlonEventScore } from '../../utils/triathlonScoring';
import type { CapitalPlayerState, CricketMatchSummary, CricketPlayerState, GameConfig, MatchState, Player } from '../../types';

// Golden tests du barème Triathlon v2 (spec 048, issue #246).
// Chaque scénario indique, en commentaire, les points obtenus avec le barème v1
// (« avant ») ; les assertions portent sur le barème v2 (« après »).

const players: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
];

const x01Config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double',
  matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};

const playX01 = (starterIndex: number, visits: number[]): MatchState => {
  let match = createMatch(players, { ...x01Config, initialStartingPlayerIndex: starterIndex });
  for (const score of visits) match = submitTurn(match, score, 3);
  expect(match.status).toBe('finished');
  return match;
};

const scoreX01 = (match: MatchState) =>
  buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, x01Match: match });

const golden = (event: TriathlonEventScore) => ({
  base: event.basePoints,
  bonuses: event.bonuses.map((bonus) => `${bonus.label} +${bonus.points}`),
  total: event.totalPoints,
});

const closedMarks = { 20: 3, 19: 3, 18: 3, 17: 3, 16: 3, 15: 3, 25: 3 };
const emptyMarks = { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 };

const cricketSummary = (
  competitors: Array<Pick<CricketPlayerState, 'id' | 'score' | 'dartsThrown' | 'marks'>>,
  winnerId: string | null,
): CricketMatchSummary => ({
  competitors: competitors.map((competitor) => ({ ...competitor, name: competitor.id, history: [] })),
  legsWon: {}, setsWon: {}, currentSetLegsWon: {}, winnerId,
  config: x01Config, isDoubles: false, memberNamesByCompetitor: {},
});

const scoreCricket = (summary: CricketMatchSummary) =>
  buildTriathlonScorecards({ competitors: players, sourcePlayers: players, isDoubles: false, cricketSummary: summary });

describe('Triathlon — golden tests du barème v2', () => {
  it('501 : le perdant loin de la sortie (461) contre un 9 fléchettes reçoit la défaite standard (AC-01)', () => {
    // Alice commence : 180, 180, 141 ; Bob : 20, 20 → reste 461.
    // Avant (v1) : Alice 20 + Checkout élevé 4 + Meilleure moyenne 5 = 29 ;
    //              Bob 14 (défaite serrée) + Moins de fléchettes 5 = 19.
    const [alice, bob] = scoreX01(playX01(0, [180, 20, 180, 20, 141]));

    expect(golden(bob.x01)).toEqual({ base: 10, bonuses: [], total: 10 });
    expect(golden(alice.x01)).toEqual({
      base: 20,
      bonuses: ['Meilleure moyenne 9 premières fléchettes +4', 'Meilleure moyenne +5', 'Visites à 100 ou plus +5'],
      total: 34,
    });
  });

  it('501 : le perdant en position de sortie (40) reçoit la défaite serrée (AC-01)', () => {
    // Bob commence : 180, 180, 101 → reste 40 ; Alice : 180, 180, 141.
    // Avant (v1) : Alice 20 + Checkout 4 + Moyenne 5 + Moins de fléchettes 5 = 34 ;
    //              Bob 14 + Moins de fléchettes 5 = 19.
    const [alice, bob] = scoreX01(playX01(1, [180, 180, 180, 180, 101, 141]));

    expect(golden(bob.x01)).toEqual({ base: 14, bonuses: [], total: 14 });
    expect(golden(alice.x01)).toEqual({
      base: 20,
      bonuses: ['Meilleure moyenne 9 premières fléchettes +4', 'Meilleure moyenne +5'],
      total: 29,
    });
  });

  it('501 : les points ne dépendent pas de qui a commencé (AC-02)', () => {
    // Vainqueur Alice : 100, 100, 100, 100, 101 ; Bob : 100, 60, 60, 60 (+ 0 s'il commence) → reste 221.
    // Avant (v1) : Alice commence → Alice 29, Bob 14 + Moins de fléchettes 5 = 19 (le perdant reçoit le bonus) ;
    //              Bob commence  → Alice 34 (fléchettes à égalité, bonus partagé), Bob 19.
    const aliceStarts = scoreX01(playX01(0, [100, 100, 100, 60, 100, 60, 100, 60, 101]));
    const bobStarts = scoreX01(playX01(1, [100, 100, 60, 100, 60, 100, 60, 100, 0, 101]));

    const expectedAlice = {
      base: 20,
      bonuses: ['Meilleure moyenne 9 premières fléchettes +4', 'Meilleure moyenne +5', 'Visites à 100 ou plus +5'],
      total: 34,
    };
    expect(golden(aliceStarts[1].x01)).toEqual({ base: 10, bonuses: [], total: 10 });
    expect(golden(bobStarts[1].x01)).toEqual({ base: 10, bonuses: [], total: 10 });
    expect(golden(aliceStarts[0].x01)).toEqual(expectedAlice);
    expect(golden(bobStarts[0].x01)).toEqual(expectedAlice);
  });

  it('Cricket : le vainqueur réel à 0-0 reçoit 20 et le perdant 14 (AC-03)', () => {
    // Avant (v1) : rang sur le score (0-0) → 20 chacun ; Alice + MPR 5 + Numéros fermés 4 = 29 ; Bob 20.
    const [alice, bob] = scoreCricket(cricketSummary([
      { id: 'p1', score: 0, dartsThrown: 9, marks: closedMarks },
      { id: 'p2', score: 0, dartsThrown: 9, marks: { ...emptyMarks, 20: 1 } },
    ], 'p1'));

    expect(golden(bob.cricket)).toEqual({ base: 14, bonuses: [], total: 14 });
    expect(golden(alice.cricket)).toEqual({
      base: 20,
      bonuses: ['Meilleur MPR +5', 'Fermeture complète +4', 'Numéros fermés +4'],
      total: 33,
    });
  });

  it('Cricket : une égalité déclarée (vainqueur absent) donne 17 points chacun (AC-03, AC-04)', () => {
    // Avant (v1) : 20 + MPR 5 + Différence de score 4 + Numéros fermés 4 = 33 chacun.
    const marks = { ...emptyMarks, 20: 3, 19: 2 };
    const [alice, bob] = scoreCricket(cricketSummary([
      { id: 'p1', score: 40, dartsThrown: 30, marks },
      { id: 'p2', score: 40, dartsThrown: 30, marks },
    ], null));

    expect(golden(alice.cricket)).toEqual({ base: 17, bonuses: [], total: 17 });
    expect(golden(bob.cricket)).toEqual({ base: 17, bonuses: [], total: 17 });
  });

  it('Capital : aucun bonus en double du rang ni partagé par tous les compétiteurs (AC-04)', () => {
    // Avant (v1) : Alice 20 + Score cumulé 5 + Régularité 4 + Peu de pénalités 4 = 33 ;
    //              Bob 16 + Régularité 4 + Peu de pénalités 4 = 24.
    const capitalResults: CapitalPlayerState[] = [
      {
        id: 'p1', name: 'Alice', score: 100, targetIndex: 2,
        history: [
          { target: 'CAPITAL', darts: [], pointsScored: 60, isSuccess: true },
          { target: '20', darts: [], pointsScored: 40, isSuccess: true },
        ],
      },
      {
        id: 'p2', name: 'Bob', score: 50, targetIndex: 2,
        history: [
          { target: 'CAPITAL', darts: [], pointsScored: 30, isSuccess: true },
          { target: '20', darts: [], pointsScored: 20, isSuccess: true },
        ],
      },
    ];
    const [alice, bob] = buildTriathlonScorecards({
      competitors: players, sourcePlayers: players, isDoubles: false, capitalResults,
    });

    expect(golden(alice.capital)).toEqual({ base: 20, bonuses: ['Meilleur challenge +5'], total: 25 });
    expect(golden(bob.capital)).toEqual({ base: 16, bonuses: [], total: 16 });
  });
});
