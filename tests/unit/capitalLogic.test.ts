import { describe, expect, it } from 'vitest';

import { evaluateCapitalRound, shouldResolveCapitalRound } from '../../utils/capitalLogic';
import type { CapitalDart } from '../../types';

describe('capitalLogic', () => {
  it('resolves Capital immediately and 57 only when complete or exact', () => {
    const single20: CapitalDart[] = [{ value: 20, multiplier: 1 }];
    expect(shouldResolveCapitalRound('CAPITAL', single20)).toBe(true);
    expect(shouldResolveCapitalRound('57', [{ value: 19, multiplier: 3 }])).toBe(true);
    expect(shouldResolveCapitalRound('57', [{ value: 20, multiplier: 1 }])).toBe(false);
    expect(
      shouldResolveCapitalRound('57', [
        { value: 20, multiplier: 1 },
        { value: 18, multiplier: 1 },
        { value: 17, multiplier: 1 },
      ])
    ).toBe(true);
  });

  it('scores exact 57 and halves the score on failure', () => {
    const success = evaluateCapitalRound(
      '57',
      [
        { value: 20, multiplier: 1 },
        { value: 19, multiplier: 1 },
        { value: 18, multiplier: 1 },
      ],
      120
    );
    expect(success.isSuccess).toBe(true);
    expect(success.pointsScored).toBe(57);
    expect(success.newScore).toBe(177);

    const failure = evaluateCapitalRound('DOUBLE', [{ value: 20, multiplier: 1 }], 101);
    expect(failure.isSuccess).toBe(false);
    expect(failure.newScore).toBe(51);
  });

  it('validates less-than-21 and suite rounds correctly', () => {
    const lessThan21 = evaluateCapitalRound(
      '21_OU_MOINS',
      [
        { value: 7, multiplier: 1 },
        { value: 7, multiplier: 1 },
        { value: 7, multiplier: 1 },
      ],
      0
    );
    expect(lessThan21.isSuccess).toBe(true);
    expect(lessThan21.pointsScored).toBe(21);

    const suite = evaluateCapitalRound(
      'SUITE',
      [
        { value: 10, multiplier: 1 },
        { value: 11, multiplier: 1 },
        { value: 12, multiplier: 1 },
      ],
      0
    );
    expect(suite.isSuccess).toBe(true);
    expect(suite.pointsScored).toBe(33);
  });
});
