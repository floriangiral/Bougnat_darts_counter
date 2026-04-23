export const buildTriathlonStatsSession = () => ({
  screen: 'TRIATHLON_STATS',
  selectedGameType: 'TRIATHLON',
  currentMatch: {
    id: 'triathlon-smoke-match',
    players: [
      { id: 'p1', name: 'Joueur 1', teamId: 'p1' },
      { id: 'p2', name: 'Joueur 2', teamId: 'p2' },
    ],
    config: { isDoubles: false },
  },
  matchWinner: '',
  arenaPrefillPlayers: [],
  arenaPrefillConfig: undefined,
  cricketResults: null,
  capitalResults: [],
  matchRuntime: null,
  triathlonData: {
    globalScores: { p1: 86, p2: 74 },
    results: {
      triathlonCompetitors: [
        { id: 'p1', name: 'Joueur 1', teamId: 'p1' },
        { id: 'p2', name: 'Joueur 2', teamId: 'p2' },
      ],
      finalWinnerId: 'p1',
      scorecards: [
        {
          competitorId: 'p1',
          competitorName: 'Joueur 1',
          capital: { key: 'capital', label: 'Capital', basePoints: 20, bonusPoints: 4, totalPoints: 24, summary: 'Capital domine', bonuses: [{ label: 'Bonus', points: 4, detail: 'Smoke' }] },
          cricket: { key: 'cricket', label: 'Cricket', basePoints: 18, bonusPoints: 2, totalPoints: 20, summary: 'Cricket solide', bonuses: [{ label: 'Bonus', points: 2, detail: 'Smoke' }] },
          x01: { key: 'x01', label: '501', basePoints: 36, bonusPoints: 6, totalPoints: 42, summary: '501 propre', bonuses: [{ label: 'Bonus', points: 6, detail: 'Smoke' }] },
          totalBasePoints: 74,
          totalBonusPoints: 12,
          totalScore: 86,
        },
        {
          competitorId: 'p2',
          competitorName: 'Joueur 2',
          capital: { key: 'capital', label: 'Capital', basePoints: 14, bonusPoints: 0, totalPoints: 14, summary: 'Capital correct', bonuses: [] },
          cricket: { key: 'cricket', label: 'Cricket', basePoints: 20, bonusPoints: 0, totalPoints: 20, summary: 'Cricket correct', bonuses: [] },
          x01: { key: 'x01', label: '501', basePoints: 40, bonusPoints: 0, totalPoints: 40, summary: '501 correct', bonuses: [] },
          totalBasePoints: 74,
          totalBonusPoints: 0,
          totalScore: 74,
        },
      ],
    },
  },
});

export const buildCapitalStatsSession = () => ({
  screen: 'CAPITAL_STATS',
  selectedGameType: 'CAPITAL',
  currentMatch: null,
  matchWinner: '',
  arenaPrefillPlayers: [],
  arenaPrefillConfig: undefined,
  cricketResults: null,
  triathlonData: null,
  matchRuntime: null,
  capitalResults: [
    {
      id: 'p1',
      name: 'Joueur 1',
      score: 212,
      targetIndex: 15,
      history: [
        {
          target: 'LE_20',
          darts: [{ value: 20, multiplier: 3 }],
          pointsScored: 60,
          isSuccess: true,
        },
      ],
    },
    {
      id: 'p2',
      name: 'Joueur 2',
      score: 168,
      targetIndex: 15,
      history: [
        {
          target: 'LE_20',
          darts: [{ value: 20, multiplier: 2 }],
          pointsScored: 40,
          isSuccess: true,
        },
      ],
    },
  ],
});

export const buildCricketStatsSession = () => ({
  screen: 'CRICKET_STATS',
  selectedGameType: 'CRICKET',
  currentMatch: null,
  matchWinner: '',
  arenaPrefillPlayers: [],
  arenaPrefillConfig: undefined,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: null,
  cricketResults: {
    competitors: [
      {
        id: 'p1',
        name: 'Joueur 1',
        score: 54,
        dartsThrown: 18,
        marks: { 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3, bull: 2 },
        history: [{ target: 20, multiplier: 3, isMiss: false, pointsScored: 0 }],
      },
      {
        id: 'p2',
        name: 'Joueur 2',
        score: 32,
        dartsThrown: 21,
        marks: { 15: 3, 16: 2, 17: 1, 18: 3, 19: 3, 20: 3, bull: 1 },
        history: [{ target: null, multiplier: 1, isMiss: true, pointsScored: 0 }],
      },
    ],
    legsWon: { p1: 1 },
    setsWon: {},
    currentSetLegsWon: {},
    winnerId: 'p1',
    config: { isDoubles: false },
    isDoubles: false,
    memberNamesByCompetitor: { p1: ['Joueur 1'], p2: ['Joueur 2'] },
  },
});
