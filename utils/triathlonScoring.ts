import { CapitalPlayerState, CricketMatchSummary, MatchState, Player } from '../types';
import { calculateDetailedStats, calculateDetailedStatsForTeam } from '../src/application/scoring/matchStats';
import {
  createEmptyTriathlonEvent,
  createTriathlonScorecard,
  TRIATHLON_EVENT_LABELS,
  TRIATHLON_SCORING_RULES,
  type TriathlonBonusLine,
  type TriathlonEventKey,
  type TriathlonEventScore,
  type TriathlonScorecard,
} from '../src/domain/triathlon';
import { CRICKET_TARGETS } from './cricketLogic';

export type {
  TriathlonBonusLine,
  TriathlonEventKey,
  TriathlonEventScore,
  TriathlonScorecard,
} from '../src/domain/triathlon';

type TriathlonCompetitor = Pick<Player, 'id' | 'name' | 'teamId'>;

type X01Metric = {
  highestCheckout: number;
  threeDartAvg: number;
  totalDarts: number;
};

type CricketMetric = {
  score: number;
  mpr: number;
  closedNumbers: number;
};

type CapitalMetric = {
  score: number;
  successfulRounds: number;
  penalties: number;
};

const parseStatNumber = (value: string | number | null | undefined) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = String(value).replace(/%/g, '').replace(/,/g, '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toMap = (competitors: TriathlonCompetitor[]) =>
  Object.fromEntries(
    competitors.map((competitor) => [
      competitor.id,
      createTriathlonScorecard(competitor.id, competitor.name),
    ])
  ) as Record<string, TriathlonScorecard>;

const awardBonus = <T extends string>(
  metrics: Record<string, number>,
  points: number,
  label: string,
  detailFactory: (metric: number) => string
) => {
  const values = Object.values(metrics);
  if (values.length === 0) return new Map<string, TriathlonBonusLine[]>();
  const bestValue = Math.max(...values);
  if (bestValue <= 0) return new Map<string, TriathlonBonusLine[]>();

  const winners = Object.entries(metrics)
    .filter(([, value]) => value === bestValue)
    .map(([competitorId]) => competitorId);

  return new Map(
    winners.map((competitorId) => [competitorId, [{ label, points, detail: detailFactory(bestValue) }]])
  );
};

const appendBonuses = (
  eventScores: Record<string, TriathlonEventScore>,
  bonusMap: Map<string, TriathlonBonusLine[]>
) => {
  bonusMap.forEach((bonusLines, competitorId) => {
    if (!eventScores[competitorId]) return;
    eventScores[competitorId].bonuses.push(...bonusLines);
    eventScores[competitorId].bonusPoints += bonusLines.reduce((sum, line) => sum + line.points, 0);
    eventScores[competitorId].totalPoints = eventScores[competitorId].basePoints + eventScores[competitorId].bonusPoints;
  });
};

const awardLowestBonus = (
  metrics: Record<string, number>,
  points: number,
  label: string,
  detailFactory: (metric: number) => string
) => {
  const values = Object.values(metrics).filter((value) => Number.isFinite(value));
  if (values.length === 0) return new Map<string, TriathlonBonusLine[]>();

  const bestValue = Math.min(...values);
  return new Map(
    Object.entries(metrics)
      .filter(([, value]) => value === bestValue)
      .map(([competitorId]) => [competitorId, [{ label, points, detail: detailFactory(bestValue) }]])
  );
};

const applyRankPoints = (
  competitors: TriathlonCompetitor[],
  scores: Record<string, number>,
  rankPoints: number[],
  eventScores: Record<string, TriathlonEventScore>
) => {
  const uniqueScores = Array.from(new Set(Object.values(scores))).sort((a, b) => b - a);

  competitors.forEach((competitor) => {
    const score = scores[competitor.id] ?? 0;
    const rankIndex = Math.max(0, uniqueScores.indexOf(score));
    const basePoints = rankPoints[Math.min(rankIndex, rankPoints.length - 1)] ?? 0;
    eventScores[competitor.id].basePoints = basePoints;
    eventScores[competitor.id].totalPoints = basePoints;
  });
};

const finalizeScorecards = (scorecards: Record<string, TriathlonScorecard>) =>
  Object.values(scorecards).map((card) => {
    const totalBasePoints = card.capital.basePoints + card.cricket.basePoints + card.x01.basePoints;
    const totalBonusPoints = card.capital.bonusPoints + card.cricket.bonusPoints + card.x01.bonusPoints;
    return {
      ...card,
      totalBasePoints,
      totalBonusPoints,
      totalScore: totalBasePoints + totalBonusPoints,
    };
  });

export const sortTriathlonScorecards = (scorecards: TriathlonScorecard[], tieBreakWinnerId?: string | null) =>
  [...scorecards].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (tieBreakWinnerId) {
      if (a.competitorId === tieBreakWinnerId) return -1;
      if (b.competitorId === tieBreakWinnerId) return 1;
    }
    return a.competitorName.localeCompare(b.competitorName);
  });

export const getTriathlonWinnerId = (scorecards: TriathlonScorecard[], tieBreakWinnerId?: string | null) => {
  const sorted = sortTriathlonScorecards(scorecards, tieBreakWinnerId);
  return sorted[0]?.competitorId ?? null;
};

const buildX01EventScores = (
  match: MatchState,
  competitors: TriathlonCompetitor[]
) => {
  const eventScores = Object.fromEntries(
    competitors.map((competitor) => [
      competitor.id,
      {
        ...createEmptyTriathlonEvent('x01', TRIATHLON_EVENT_LABELS.x01),
      },
    ])
  ) as Record<string, TriathlonEventScore>;

  const metrics: Record<string, X01Metric> = {};
  competitors.forEach((competitor) => {
    const stats = match.config.isDoubles
      ? calculateDetailedStatsForTeam(match, competitor.id)
      : calculateDetailedStats(match, competitor.id);

    const playerIds = new Set(match.players.filter((player) => player.teamId === competitor.id || player.id === competitor.id).map((player) => player.id));
    const totalDarts = [...match.completedLegs, match.currentLeg]
      .flatMap((leg) => leg.history)
      .filter((turn) => playerIds.has(turn.playerId))
      .reduce((sum, turn) => sum + turn.dartsThrown, 0);

    metrics[competitor.id] = {
      highestCheckout: stats.highestCheckout,
      threeDartAvg: parseStatNumber(stats.threeDartAverage),
      totalDarts,
    };
  });

  competitors.forEach((competitor) => {
    if (competitor.id === match.matchWinnerId) {
      eventScores[competitor.id].basePoints = TRIATHLON_SCORING_RULES.x01.winnerBasePoints;
      return;
    }

    const winnerMetrics = metrics[match.matchWinnerId || competitors[0]?.id] || { totalDarts: 0, threeDartAvg: 0, highestCheckout: 0 };
    const currentMetrics = metrics[competitor.id];
    const dartsGap = Math.abs((winnerMetrics.totalDarts || 0) - (currentMetrics.totalDarts || 0));
    const avgGap = Math.abs((winnerMetrics.threeDartAvg || 0) - (currentMetrics.threeDartAvg || 0));
    const isCloseLoss =
      dartsGap <= TRIATHLON_SCORING_RULES.x01.closeLossThresholds.dartsGap
      || avgGap <= TRIATHLON_SCORING_RULES.x01.closeLossThresholds.averageGap;

    eventScores[competitor.id].basePoints = isCloseLoss
      ? TRIATHLON_SCORING_RULES.x01.closeLossBasePoints
      : TRIATHLON_SCORING_RULES.x01.standardLossBasePoints;
  });

  Object.values(eventScores).forEach((score) => {
    score.totalPoints = score.basePoints;
  });

  appendBonuses(
    eventScores,
    awardBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id].highestCheckout])),
      TRIATHLON_SCORING_RULES.x01.bonuses.highestCheckout.points,
      TRIATHLON_SCORING_RULES.x01.bonuses.highestCheckout.label,
      TRIATHLON_SCORING_RULES.x01.bonuses.highestCheckout.detail
    )
  );
  appendBonuses(
    eventScores,
    awardBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id].threeDartAvg])),
      TRIATHLON_SCORING_RULES.x01.bonuses.bestAverage.points,
      TRIATHLON_SCORING_RULES.x01.bonuses.bestAverage.label,
      TRIATHLON_SCORING_RULES.x01.bonuses.bestAverage.detail
    )
  );
  appendBonuses(
    eventScores,
    awardLowestBonus(
      Object.fromEntries(
        competitors
          .map((competitor) => [competitor.id, metrics[competitor.id].totalDarts] as const)
          .filter((entry): entry is readonly [string, number] => entry[1] > 0)
      ),
      TRIATHLON_SCORING_RULES.x01.bonuses.fewestDarts.points,
      TRIATHLON_SCORING_RULES.x01.bonuses.fewestDarts.label,
      TRIATHLON_SCORING_RULES.x01.bonuses.fewestDarts.detail
    )
  );

  competitors.forEach((competitor) => {
    const metric = metrics[competitor.id];
    eventScores[competitor.id].summary =
      competitor.id === match.matchWinnerId
        ? `Victoire 501. Moyenne ${metric.threeDartAvg.toFixed(1)}, checkout ${metric.highestCheckout || 0}, ${metric.totalDarts} flechettes.`
        : `Defaite 501. Moyenne ${metric.threeDartAvg.toFixed(1)}, checkout ${metric.highestCheckout || 0}, ${metric.totalDarts} flechettes.`;
  });

  return eventScores;
};

const buildCricketEventScores = (summary: CricketMatchSummary, competitors: TriathlonCompetitor[]) => {
  const eventScores = Object.fromEntries(
    competitors.map((competitor) => [
      competitor.id,
      {
        ...createEmptyTriathlonEvent('cricket', TRIATHLON_EVENT_LABELS.cricket),
      },
    ])
  ) as Record<string, TriathlonEventScore>;

  const metrics: Record<string, CricketMetric> = {};
  summary.competitors.forEach((player) => {
    const totalMarks = (Object.values(player.marks) as number[]).reduce((sum, value) => sum + value, 0);
    const rounds = player.dartsThrown / 3;
    metrics[player.id] = {
      score: player.score,
      mpr: rounds > 0 ? totalMarks / rounds : 0,
      closedNumbers: CRICKET_TARGETS.filter((target) => player.marks[target] >= 3).length,
    };
  });

  applyRankPoints(
    competitors,
    Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.score ?? 0])),
    TRIATHLON_SCORING_RULES.cricket.rank.rankPoints,
    eventScores
  );

  appendBonuses(
    eventScores,
    awardBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.mpr ?? 0])),
      TRIATHLON_SCORING_RULES.cricket.bonuses.bestMpr.points,
      TRIATHLON_SCORING_RULES.cricket.bonuses.bestMpr.label,
      TRIATHLON_SCORING_RULES.cricket.bonuses.bestMpr.detail
    )
  );
  appendBonuses(
    eventScores,
    awardBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.score ?? 0])),
      TRIATHLON_SCORING_RULES.cricket.bonuses.bestScore.points,
      TRIATHLON_SCORING_RULES.cricket.bonuses.bestScore.label,
      TRIATHLON_SCORING_RULES.cricket.bonuses.bestScore.detail
    )
  );
  appendBonuses(
    eventScores,
    awardBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.closedNumbers ?? 0])),
      TRIATHLON_SCORING_RULES.cricket.bonuses.mostClosedNumbers.points,
      TRIATHLON_SCORING_RULES.cricket.bonuses.mostClosedNumbers.label,
      TRIATHLON_SCORING_RULES.cricket.bonuses.mostClosedNumbers.detail
    )
  );

  competitors.forEach((competitor) => {
    const metric = metrics[competitor.id] || { mpr: 0, score: 0, closedNumbers: 0 };
    eventScores[competitor.id].summary = `Score ${metric.score}, MPR ${metric.mpr.toFixed(2)}, ${metric.closedNumbers} numeros fermes.`;
  });

  return eventScores;
};

const buildCapitalCompetitorMetrics = (
  capitalResults: CapitalPlayerState[],
  competitors: TriathlonCompetitor[],
  sourcePlayers: Player[],
  isDoubles: boolean
) => {
  if (!isDoubles) {
    return Object.fromEntries(
      competitors.map((competitor) => {
        const state = capitalResults.find((entry) => entry.id === competitor.id);
        const successfulRounds = state?.history.filter((entry) => entry.isSuccess).length ?? 0;
        const penalties = state?.history.filter((entry) => !entry.isSuccess).length ?? 0;
        return [
          competitor.id,
          {
            score: state?.score ?? 0,
            successfulRounds,
            penalties,
          } satisfies CapitalMetric,
        ];
      })
    ) as Record<string, CapitalMetric>;
  }

  return Object.fromEntries(
    competitors.map((competitor) => {
      const memberIds = sourcePlayers.filter((player) => player.teamId === competitor.id).map((player) => player.id);
      const memberStates = capitalResults.filter((entry) => memberIds.includes(entry.id));
      return [
        competitor.id,
        {
          score: memberStates.reduce((sum, state) => sum + state.score, 0),
          successfulRounds: memberStates.reduce((sum, state) => sum + state.history.filter((entry) => entry.isSuccess).length, 0),
          penalties: memberStates.reduce((sum, state) => sum + state.history.filter((entry) => !entry.isSuccess).length, 0),
        } satisfies CapitalMetric,
      ];
    })
  ) as Record<string, CapitalMetric>;
};

const buildCapitalEventScores = (
  capitalResults: CapitalPlayerState[],
  competitors: TriathlonCompetitor[],
  sourcePlayers: Player[],
  isDoubles: boolean
) => {
  const eventScores = Object.fromEntries(
    competitors.map((competitor) => [
      competitor.id,
      {
        ...createEmptyTriathlonEvent('capital', TRIATHLON_EVENT_LABELS.capital),
      },
    ])
  ) as Record<string, TriathlonEventScore>;

  const metrics = buildCapitalCompetitorMetrics(capitalResults, competitors, sourcePlayers, isDoubles);

  applyRankPoints(
    competitors,
    Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.score ?? 0])),
    TRIATHLON_SCORING_RULES.capital.rank.rankPoints,
    eventScores
  );

  appendBonuses(
    eventScores,
    awardBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.score ?? 0])),
      TRIATHLON_SCORING_RULES.capital.bonuses.bestScore.points,
      TRIATHLON_SCORING_RULES.capital.bonuses.bestScore.label,
      TRIATHLON_SCORING_RULES.capital.bonuses.bestScore.detail
    )
  );
  appendBonuses(
    eventScores,
    awardBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.successfulRounds ?? 0])),
      TRIATHLON_SCORING_RULES.capital.bonuses.regularity.points,
      TRIATHLON_SCORING_RULES.capital.bonuses.regularity.label,
      TRIATHLON_SCORING_RULES.capital.bonuses.regularity.detail
    )
  );
  appendBonuses(
    eventScores,
    awardLowestBonus(
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.penalties ?? 0])),
      TRIATHLON_SCORING_RULES.capital.bonuses.fewestPenalties.points,
      TRIATHLON_SCORING_RULES.capital.bonuses.fewestPenalties.label,
      TRIATHLON_SCORING_RULES.capital.bonuses.fewestPenalties.detail
    )
  );

  competitors.forEach((competitor) => {
    const metric = metrics[competitor.id];
    eventScores[competitor.id].summary = `Score ${metric.score}, ${metric.successfulRounds} reussites, ${metric.penalties} penalites.`;
  });

  return eventScores;
};

export const buildTriathlonScorecards = ({
  competitors,
  sourcePlayers,
  isDoubles,
  x01Match,
  cricketSummary,
  capitalResults,
}: {
  competitors: TriathlonCompetitor[];
  sourcePlayers: Player[];
  isDoubles: boolean;
  x01Match?: MatchState | null;
  cricketSummary?: CricketMatchSummary | null;
  capitalResults?: CapitalPlayerState[] | null;
}) => {
  const scorecards = toMap(competitors);

  if (capitalResults) {
    const capitalScores = buildCapitalEventScores(capitalResults, competitors, sourcePlayers, isDoubles);
    competitors.forEach((competitor) => {
      scorecards[competitor.id].capital = capitalScores[competitor.id];
    });
  }

  if (cricketSummary) {
    const cricketScores = buildCricketEventScores(cricketSummary, competitors);
    competitors.forEach((competitor) => {
      scorecards[competitor.id].cricket = cricketScores[competitor.id];
    });
  }

  if (x01Match) {
    const x01Scores = buildX01EventScores(x01Match, competitors);
    competitors.forEach((competitor) => {
      scorecards[competitor.id].x01 = x01Scores[competitor.id];
    });
  }

  return finalizeScorecards(scorecards);
};
