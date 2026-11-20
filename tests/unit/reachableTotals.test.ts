import { describe, expect, it } from 'vitest';

import { getReachableTotals, isReachableTotal } from '../../src/domain/scoring/reachableTotals';

const unreachableUpTo = (dartCount: number) => {
  const max = dartCount * 60;
  return Array.from({ length: max + 1 }, (_, total) => total).filter((total) => !isReachableTotal(total, dartCount));
};

// Spec ref: specs/054-counter-impossible-totals-validation (RM-01, AC-03).
describe('reachable totals', () => {
  it('lists exactly the nine totals that cannot be scored with three darts', () => {
    expect(unreachableUpTo(3)).toEqual([163, 166, 169, 172, 173, 175, 176, 178, 179]);
    expect(Math.max(...getReachableTotals(3))).toBe(180);
  });

  it('supports any dart count, counting missed darts as zero', () => {
    expect(unreachableUpTo(1)).toEqual([23, 29, 31, 35, 37, 41, 43, 44, 46, 47, 49, 52, 53, 55, 56, 58, 59]);
    expect(unreachableUpTo(2)).toEqual([103, 106, 109, 112, 113, 115, 116, 118, 119]);
    expect([...getReachableTotals(0)]).toEqual([0]);
    expect(isReachableTotal(50, 1)).toBe(true);
    expect(isReachableTotal(60, 1)).toBe(true);
  });

  it('rejects negative, out of range and non integer totals', () => {
    expect(isReachableTotal(-3)).toBe(false);
    expect(isReachableTotal(181)).toBe(false);
    expect(isReachableTotal(12.5)).toBe(false);
    expect(isReachableTotal(Number.NaN)).toBe(false);
  });

  it('refuses an invalid dart count', () => {
    expect(() => getReachableTotals(-1)).toThrow(RangeError);
    expect(() => getReachableTotals(1.5)).toThrow(RangeError);
  });
});
