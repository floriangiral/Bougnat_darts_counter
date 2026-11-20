import { Checkout, type CheckoutRule } from '../valueObjects/Checkout';
import type { ScoreInput } from '../valueObjects/ScoreInput';
import { isCheckoutPossible, isX01Bust } from '../x01CheckoutRules';

export type TurnEvaluation = {
  remainingScore: number;
  isBust: boolean;
  requiresCheckoutConfirmation: boolean;
};

export class ScoringRules {
  static evaluateTurn(currentScore: number, scoreInput: ScoreInput, rule: CheckoutRule): TurnEvaluation {
    const checkout = Checkout.fromTurn(currentScore, scoreInput, rule);
    const remainingScore = checkout.remainingScore;
    const isBust = isX01Bust(currentScore, scoreInput.value, rule);

    return {
      remainingScore,
      isBust,
      requiresCheckoutConfirmation: !isBust && checkout.isWinningFinish,
    };
  }

  static isCheckoutPossible(score: number, rule: CheckoutRule) {
    return isCheckoutPossible(score, rule);
  }
}
