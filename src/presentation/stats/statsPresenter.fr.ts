import { DetailedStats } from '../../application/scoring/matchStats';

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
  checkoutSummary: `${stats.checkoutMade}/${stats.checkoutAttempts} sorties`,
  checkoutBreakdown: [
    `1 fleche: ${stats.checkoutByDarts.one.made}/${stats.checkoutByDarts.one.attempts}`,
    `2 fleches: ${stats.checkoutByDarts.two.made}/${stats.checkoutByDarts.two.attempts}`,
    `3 fleches: ${stats.checkoutByDarts.three.made}/${stats.checkoutByDarts.three.attempts}`,
  ],
  highestCheckout: stats.highestCheckout,
  highestScore: stats.highestScore,
  averageWinningLegDarts: String(stats.averageWinningLegDarts),
  bestLegDarts: stats.bestLegDarts,
  worstLegDarts: stats.worstLegDarts,
  scoreCounts: stats.scoreCounts,
});
