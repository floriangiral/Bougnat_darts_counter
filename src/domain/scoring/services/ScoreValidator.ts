import { type CheckoutRule } from '../valueObjects/Checkout';
import { ScoreInput, type ScoreInputValidationResult } from '../valueObjects/ScoreInput';

export type RemainingTargetValidationResult =
  | { ok: true; value: ScoreInput; impliedScore: number }
  | {
      ok: false;
      reason: 'impossible_remaining' | 'same_score_use_miss';
    };

export class ScoreValidator {
  static validateScoreInput(raw: number): ScoreInputValidationResult {
    return ScoreInput.create(raw);
  }

  static validateRemainingTarget(
    targetRemaining: number,
    currentScore: number,
    rule: CheckoutRule,
  ): RemainingTargetValidationResult {
    if (targetRemaining < 0 || targetRemaining > currentScore) {
      return { ok: false, reason: 'impossible_remaining' };
    }

    if (targetRemaining === currentScore) {
      return { ok: false, reason: 'same_score_use_miss' };
    }

    if (rule === 'Double' && targetRemaining === 1) {
      return { ok: false, reason: 'impossible_remaining' };
    }

    const impliedScore = currentScore - targetRemaining;
    const scoreInput = ScoreInput.create(impliedScore);
    if (!scoreInput.ok) {
      return { ok: false, reason: 'impossible_remaining' };
    }

    return {
      ok: true,
      value: scoreInput.value,
      impliedScore,
    };
  }
}
