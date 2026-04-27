import { describe, expect, it } from 'vitest';

import { presentX01DetailedStats } from '../../../../src/presentation/stats/statsPresenter.fr';
import { DetailedStats } from '../../../../src/application/scoring/matchStats';

describe('stats presenter fr', () => {
  it('formats numeric stats into french-ready strings', () => {
    const raw: DetailedStats = {
      threeDartAverage: 58.666,
      nonCheckoutAverage: 45.1,
      firstNineAverage: 55.444,
      checkoutRate: 33.333,
      checkoutMade: 1,
      checkoutAttempts: 3,
      checkoutByDarts: {
        one: { attempts: 1, made: 0 },
        two: { attempts: 1, made: 0 },
        three: { attempts: 1, made: 1 },
      },
      highestCheckout: 120,
      highestScore: 140,
      averageWinningLegDarts: 18,
      bestLegDarts: 15,
      worstLegDarts: 24,
      scoreCounts: {
        c180: 0,
        c160: 1,
        c140: 2,
        c120: 3,
        c100: 4,
        c80: 5,
        c60: 6,
      },
    };

    const presented = presentX01DetailedStats(raw);

    expect(presented.threeDartAverage).toBe('58.7');
    expect(presented.firstNineAverage).toBe('55.4');
    expect(presented.checkoutRate).toBe('33.3%');
    expect(presented.checkoutSummary).toBe('1/3 CHECKOUT');
    expect(presented.checkoutBreakdown).toEqual([
      '1 fleche: 0/1',
      '2 fleches: 0/1',
      '3 fleches: 1/1',
    ]);
    expect(presented.averageWinningLegDarts).toBe('18');
  });
});
