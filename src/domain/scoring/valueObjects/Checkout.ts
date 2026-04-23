import type { ScoreInput } from './ScoreInput';

export type CheckoutRule = 'Open' | 'Double' | 'Master';

export class Checkout {
  private constructor(
    public readonly currentScore: number,
    public readonly scoredPoints: number,
    public readonly rule: CheckoutRule,
  ) {}

  static fromTurn(currentScore: number, scoreInput: ScoreInput, rule: CheckoutRule) {
    return new Checkout(currentScore, scoreInput.value, rule);
  }

  get remainingScore() {
    return this.currentScore - this.scoredPoints;
  }

  get isWinningFinish() {
    return this.remainingScore === 0;
  }
}
