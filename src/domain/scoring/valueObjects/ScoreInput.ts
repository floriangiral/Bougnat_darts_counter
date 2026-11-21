import { getReachableTotals, isReachableTotal } from '../reachableTotals';

export const POSSIBLE_THREE_DART_TURN_SCORES = getReachableTotals(3);

export type ScoreInputErrorReason = 'not_a_number' | 'negative' | 'impossible_turn_score';

export type ScoreInputValidationResult =
  | { ok: true; value: ScoreInput }
  | { ok: false; reason: ScoreInputErrorReason };

export class ScoreInput {
  private constructor(public readonly value: number) {}

  static create(raw: number): ScoreInputValidationResult {
    if (Number.isNaN(raw)) {
      return { ok: false, reason: 'not_a_number' };
    }

    if (raw < 0) {
      return { ok: false, reason: 'negative' };
    }

    if (!isPossibleThreeDartTurnScore(raw)) {
      return { ok: false, reason: 'impossible_turn_score' };
    }

    return { ok: true, value: new ScoreInput(raw) };
  }
}

export const isPossibleThreeDartTurnScore = (score: number) => isReachableTotal(score, 3);
