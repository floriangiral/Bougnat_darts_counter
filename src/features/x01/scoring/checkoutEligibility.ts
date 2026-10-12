import type { InOutRule } from '../../../../types';

const DOUBLE_OUT_BOGEY_SCORES = new Set([159, 162, 163, 165, 166, 168, 169]);

export const isCheckoutPossible = (score: number, checkoutRule: InOutRule): boolean => {
  if (checkoutRule === 'Open') {
    return score > 0 && score <= 180;
  }

  if (checkoutRule === 'Double') {
    return score >= 2 && score <= 170 && !DOUBLE_OUT_BOGEY_SCORES.has(score);
  }

  return score >= 2 && score <= 180;
};
