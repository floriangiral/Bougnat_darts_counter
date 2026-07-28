export type TriathlonEventKey = 'capital' | 'cricket' | 'x01';

export interface TriathlonBonusLine {
  label: string;
  points: number;
  detail: string;
}

export interface TriathlonEventScore {
  key: TriathlonEventKey;
  label: string;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  summary: string;
  bonuses: TriathlonBonusLine[];
}

export interface TriathlonScorecard {
  competitorId: string;
  competitorName: string;
  capital: TriathlonEventScore;
  cricket: TriathlonEventScore;
  x01: TriathlonEventScore;
  totalBasePoints: number;
  totalBonusPoints: number;
  totalScore: number;
}