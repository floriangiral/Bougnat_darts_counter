import type { TriathlonEventKey, TriathlonEventScore, TriathlonScorecard } from './triathlonTypes';

type RankRule = {
  rankPoints: number[];
};

type BonusRule = {
  points: number;
  label: string;
  detail: (value: number) => string;
};

/**
 * Barème v2 (spec 048). Un résultat sans `scoringVersion` a été compté avec le barème v1.
 * Principes : le rang récompense le résultat, un bonus récompense une performance
 * accessible au perdant, aucun critère ne dépend de l'ordre de jeu, égalité = mêmes points.
 * Un bonus n'est attribué que si la meilleure valeur est strictement meilleure que celle
 * d'au moins un autre compétiteur (RM-02).
 */
export const TRIATHLON_SCORING_RULES = {
  version: 2,
  x01: {
    winnerBasePoints: 20,
    // Perdant en position de sortie : reste finissable en une visite selon la règle de sortie du 501.
    closeLossBasePoints: 14,
    standardLossBasePoints: 10,
    tonPlusThreshold: 100,
    bonuses: {
      bestFirstNineAverage: {
        points: 4,
        label: 'Meilleure moyenne 9 premières fléchettes',
        detail: (value: number) => value.toFixed(1),
      } satisfies BonusRule,
      bestAverage: {
        points: 5,
        label: 'Meilleure moyenne',
        detail: (value: number) => value.toFixed(1),
      } satisfies BonusRule,
      mostTonPlusVisits: {
        points: 5,
        label: 'Visites à 100 ou plus',
        detail: (value: number) => `${value}`,
      } satisfies BonusRule,
    },
  },
  cricket: {
    winnerBasePoints: 20,
    loserBasePoints: 14,
    drawBasePoints: 17,
    bonuses: {
      bestMpr: {
        points: 5,
        label: 'Meilleur MPR',
        detail: (value: number) => value.toFixed(2),
      } satisfies BonusRule,
      fullClose: {
        points: 4,
        label: 'Fermeture complète',
        detail: () => '7 cibles fermées',
      } satisfies BonusRule,
      mostClosedNumbers: {
        points: 4,
        label: 'Numéros fermés',
        detail: (value: number) => `${value}`,
      } satisfies BonusRule,
    },
  },
  capital: {
    rank: {
      rankPoints: [20, 16, 12, 8],
    } satisfies RankRule,
    bonuses: {
      bestChallenge: {
        points: 5,
        label: 'Meilleur challenge',
        detail: (value: number) => `${value} pts`,
      } satisfies BonusRule,
      regularity: {
        points: 4,
        label: 'Régularité',
        detail: (value: number) => `${value} réussites`,
      } satisfies BonusRule,
      fewestPenalties: {
        points: 4,
        label: 'Peu de pénalités',
        detail: (value: number) => `${value}`,
      } satisfies BonusRule,
    },
  },
} as const;

export const TRIATHLON_SCORING_VERSION = TRIATHLON_SCORING_RULES.version;

/** Version du barème d'un résultat enregistré : absence de version = barème v1. */
export const resolveTriathlonScoringVersion = (scoringVersion: number | null | undefined) => scoringVersion ?? 1;

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
  summary: 'Épreuve non jouée.',
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

export type { TriathlonBonusLine, TriathlonEventKey, TriathlonEventScore, TriathlonScorecard } from './triathlonTypes';
