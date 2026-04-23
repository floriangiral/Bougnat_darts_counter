import { Checkout, type CheckoutRule } from '../valueObjects/Checkout';
import type { ScoreInput } from '../valueObjects/ScoreInput';

const DOUBLE_OUT_BOGEY_SCORES = new Set([159, 162, 163, 165, 166, 168, 169]);

export type TurnEvaluation = {
  remainingScore: number;
  isBust: boolean;
  requiresCheckoutConfirmation: boolean;
};

export class ScoringRules {
  static evaluateTurn(currentScore: number, scoreInput: ScoreInput, rule: CheckoutRule): TurnEvaluation {
    const checkout = Checkout.fromTurn(currentScore, scoreInput, rule);
    const remainingScore = checkout.remainingScore;
    const isBust = remainingScore < 0 || (rule === 'Double' && remainingScore === 1);

    return {
      remainingScore,
      isBust,
      requiresCheckoutConfirmation: !isBust && checkout.isWinningFinish,
    };
  }

  static isCheckoutPossible(score: number, rule: CheckoutRule) {
    if (rule === 'Open') {
      return score > 0 && score <= 180;
    }

    if (rule === 'Double') {
      return score >= 2 && score <= 170 && !DOUBLE_OUT_BOGEY_SCORES.has(score);
    }

    return score >= 2 && score <= 180;
  }
}
