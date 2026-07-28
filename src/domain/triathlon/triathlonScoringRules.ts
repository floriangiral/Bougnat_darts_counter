import type { TriathlonBonusLine, TriathlonEventKey, TriathlonEventScore, TriathlonScorecard } from './triathlonTypes';

type RankRule = {
  rankPoints: number[];
};

type BonusRule = {
  points: number;
  label: string;
  detail: (value: number) => string;
};

export const TRIATHLON_SCORING_RULES = {
  x01: {
    winnerBasePoints: 20,
    closeLossBasePoints: 14,
    standardLossBasePoints: 10,
    closeLossThresholds: {
      dartsGap: 3,
      averageGap: 6,
    },
    bonuses: {
      highestCheckout: {
        points: 4,
        label: 'Checkout eleve',
        detail: (value: number) => `${value}`,
      } satisfies BonusRule,
      bestAverage: {
        points: 5,
        label: 'Meilleure moyenne',
        detail: (value: number) => value.toFixed(1),
      } satisfies BonusRule,
      fewestDarts: {
        points: 5,
        label: 'Moins de flechettes',
        detail: (value: number) => `${value}`,
      } satisfies BonusRule,
    },
  },
  cricket: {
    rank: {
      rankPoints: [20, 14, 10, 6],
    } satisfies RankRule,
    bonuses: {
      bestMpr: {
        points: 5,
        label: 'Meilleur MPR',
        detail: (value: number) => value.toFixed(2),
      } satisfies BonusRule,
      bestScore: {
        points: 4,
        label: 'Difference de score',
        detail: (value: number) => `${value} pts`,
      } satisfies BonusRule,
      mostClosedNumbers: {
        points: 4,
        label: 'Numeros fermes',
        detail: (value: number) => `${value}`,
      } satisfies BonusRule,
    },
  },
  capital: {
    rank: {
      rankPoints: [20, 16, 12, 8],
    } satisfies RankRule,
    bonuses: {
      bestScore: {
        points: 5,
        label: 'Score cumule',
        detail: (value: number) => `${value} pts`,
      } satisfies BonusRule,
      regularity: {
        points: 4,
        label: 'Regularite',
        detail: (value: number) => `${value} reussites`,
      } satisfies BonusRule,
      fewestPenalties: {
        points: 4,
        label: 'Peu de penalites',
        detail: (value: number) => `${value}`,
      } satisfies BonusRule,
    },
  },
} as const;

export const TRIATHLON_EVENT_LABELS: Record<TriathlonEventKey, string> = {
  capital: 'Capital',
  cricket: 'Cricket',
  x01: '501',
};

export const createEmptyTriathlonEvent = (key: TriathlonEventKey, label: string): TriathlonEventScore => ({
  key,
  label,
  basePoints: 0,
  bonusPoints: 0,
  totalPoints: 0,
  summary: 'Epreuve non jouee.',
  bonuses: [],
});

export const createTriathlonScorecard = (competitorId: string, competitorName: string): TriathlonScorecard => ({
  competitorId,
  competitorName,
  capital: createEmptyTriathlonEvent('capital', TRIATHLON_EVENT_LABELS.capital),
  cricket: createEmptyTriathlonEvent('cricket', TRIATHLON_EVENT_LABELS.cricket),
  x01: createEmptyTriathlonEvent('x01', TRIATHLON_EVENT_LABELS.x01),
  totalBasePoints: 0,
  totalBonusPoints: 0,
  totalScore: 0,
});

export type { TriathlonBonusLine, TriathlonEventKey, TriathlonEventScore, TriathlonScorecard };