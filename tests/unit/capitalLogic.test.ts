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

  it('validates strictly less-than-21 and suite rounds correctly', () => {
    const valid = evaluateCapitalRound(
      '21_OU_MOINS',
      [
        { value: 6, multiplier: 1 },
        { value: 7, multiplier: 1 },
        { value: 7, multiplier: 1 },
      ],
      0
    );
    expect(valid.isSuccess).toBe(true);
    expect(valid.pointsScored).toBe(20);

    const invalid = evaluateCapitalRound(
      '21_OU_MOINS',
      [
        { value: 7, multiplier: 1 },
        { value: 7, multiplier: 1 },
        { value: 7, multiplier: 1 },
      ],
      0
    );
    expect(invalid.isSuccess).toBe(false);
    expect(invalid.pointsScored).toBe(0);

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

  it('treats a simple bull as valid only when paired with two target hits and forbids double bull without it', () => {
    const singleBullAdjacent = evaluateCapitalRound(
      'COTE_A_COTE',
      [
        { value: 25, multiplier: 1 },
        { value: 20, multiplier: 1 },
        { value: 1, multiplier: 1 },
      ],
      0
    );
    expect(singleBullAdjacent.isSuccess).toBe(true);
    expect(singleBullAdjacent.pointsScored).toBe(46);

    const bullAlone = evaluateCapitalRound(
      'COTE_A_COTE',
      [
        { value: 25, multiplier: 1 },
        { value: 0, multiplier: 1 },
        { value: 0, multiplier: 1 },
      ],
      0
    );
    expect(bullAlone.isSuccess).toBe(false);
    expect(bullAlone.pointsScored).toBe(0);

    const doubleBullWithoutSimpleBull = evaluateCapitalRound(
      'COTE_A_COTE',
      [
        { value: 25, multiplier: 2 },
        { value: 20, multiplier: 1 },
        { value: 19, multiplier: 1 },
      ],
      0
    );
    expect(doubleBullWithoutSimpleBull.isSuccess).toBe(false);
    expect(doubleBullWithoutSimpleBull.pointsScored).toBe(0);
  });
});
