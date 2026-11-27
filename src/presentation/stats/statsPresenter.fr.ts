import type { DetailedStats, ScoreCountKey } from '../../application/scoring/matchStats';

export const X01_SCORE_COUNT_ROWS: ReadonlyArray<{ label: string; key: ScoreCountKey }> = [
  { label: '180s / 171s', key: 'c180' },
  { label: '160+ / 152+', key: 'c160' },
  { label: '140+ / 133+', key: 'c140' },
  { label: '120+ / 114+', key: 'c120' },
  { label: '100+ / 95+', key: 'c100' },
  { label: '80+ / 76+', key: 'c80' },
  { label: '60+ / 57+', key: 'c60' },
];

export interface PresentedDetailedStats {
  threeDartAverage: string;
  nonCheckoutAverage: string;
  firstNineAverage: string;
  checkoutRate: string;
  checkoutSummary: string;
  checkoutBreakdown: string[];
  highestCheckout: number;
  highestScore: number;
  averageWinningLegDarts: string;
  bestLegDarts: number | null;
  worstLegDarts: number | null;
  scoreCounts: DetailedStats['scoreCounts'];
}

const formatOneDecimal = (value: number): string => value.toFixed(1);

export const presentX01DetailedStats = (stats: DetailedStats): PresentedDetailedStats => ({
  threeDartAverage: formatOneDecimal(stats.threeDartAverage),
  nonCheckoutAverage: formatOneDecimal(stats.nonCheckoutAverage),
  firstNineAverage: formatOneDecimal(stats.firstNineAverage),
  checkoutRate: `${stats.checkoutRate.toFixed(1)}%`,
  checkoutSummary: `${stats.checkoutMade}/${stats.checkoutAttempts} CHECKOUT`,
  checkoutBreakdown: [
    `1 fléchette : ${stats.checkoutByDarts.one.made}/${stats.checkoutByDarts.one.attempts}`,
    `2 fléchettes : ${stats.checkoutByDarts.two.made}/${stats.checkoutByDarts.two.attempts}`,
    `3 fléchettes : ${stats.checkoutByDarts.three.made}/${stats.checkoutByDarts.three.attempts}`,
  ],
  highestCheckout: stats.highestCheckout,
  highestScore: stats.highestScore,
  averageWinningLegDarts: String(stats.averageWinningLegDarts),
  bestLegDarts: stats.bestLegDarts,
  worstLegDarts: stats.worstLegDarts,
  scoreCounts: stats.scoreCounts,
});
