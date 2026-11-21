import { CapitalPlayerState, CricketMatchSummary, MatchState, Player } from '../types';
import { calculateDetailedStats, calculateDetailedStatsForTeam } from '../src/application/scoring/matchStats';
import { isCheckoutPossible } from '../src/features/x01/scoring/checkoutEligibility';
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
  firstNineAvg: number;
  threeDartAvg: number;
  tonPlusVisits: number;
  totalDarts: number;
  remaining: number;
};

type CricketMetric = {
  score: number;
  mpr: number;
  closedNumbers: number;
  fullClose: number;
};

type CapitalMetric = {
  score: number;
  bestChallenge: number;
  successfulRounds: number;
  penalties: number;
};

const parseStatNumber = (value: string | number | null | undefined) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = String(value).replaceAll('%', '').replaceAll(',', '.');
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

const awardBonus = (
  metrics: Record<string, number>,
  points: number,
  label: string,
  detailFactory: (metric: number) => string
) => {
  const values = Object.values(metrics);
  if (values.length === 0) return new Map<string, TriathlonBonusLine[]>();
  const bestValue = Math.max(...values);
  // RM-02 : pas de bonus sans valeur positive ni quand tous les compétiteurs sont à égalité.
  if (bestValue <= 0 || values.every((value) => value === bestValue)) return new Map<string, TriathlonBonusLine[]>();

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
  const values = Object.values(metrics);
  if (values.length === 0) return new Map<string, TriathlonBonusLine[]>();

  const bestValue = Math.min(...values);
  if (values.every((value) => value === bestValue)) return new Map<string, TriathlonBonusLine[]>();
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

const createEventScores = (competitors: TriathlonCompetitor[], key: TriathlonEventKey) =>
  Object.fromEntries(
    competitors.map((competitor) => [competitor.id, createEmptyTriathlonEvent(key, TRIATHLON_EVENT_LABELS[key])])
  ) as Record<string, TriathlonEventScore>;

const setBasePoints = (eventScores: Record<string, TriathlonEventScore>, competitorId: string, basePoints: number) => {
  eventScores[competitorId].basePoints = basePoints;
  eventScores[competitorId].totalPoints = basePoints;
};

const resolveX01TeamId = (match: MatchState, competitorId: string) =>
  match.players.find((player) => player.id === competitorId)?.teamId ?? competitorId;

const buildX01EventScores = (
  match: MatchState,
  competitors: TriathlonCompetitor[]
) => {
  const rules = TRIATHLON_SCORING_RULES.x01;
  const eventScores = createEventScores(competitors, 'x01');

  const metrics: Record<string, X01Metric> = {};
  competitors.forEach((competitor) => {
    const stats = match.config.isDoubles
      ? calculateDetailedStatsForTeam(match, competitor.id)
      : calculateDetailedStats(match, competitor.id);

    const playerIds = new Set(match.players.filter((player) => player.teamId === competitor.id || player.id === competitor.id).map((player) => player.id));
    const turns = [...match.completedLegs, match.currentLeg]
      .flatMap((leg) => leg.history)
      .filter((turn) => playerIds.has(turn.playerId));

    metrics[competitor.id] = {
      firstNineAvg: stats.firstNineAverage,
      threeDartAvg: parseStatNumber(stats.threeDartAverage),
      tonPlusVisits: turns.filter((turn) => !turn.isBust && turn.score >= rules.tonPlusThreshold).length,
      totalDarts: turns.reduce((sum, turn) => sum + turn.dartsThrown, 0),
      remaining: match.currentLeg.scores[resolveX01TeamId(match, competitor.id)] ?? match.config.startingScore,
    };
  });

  const winnerId = competitors.some((competitor) => competitor.id === match.matchWinnerId) ? match.matchWinnerId : null;
  competitors.forEach((competitor) => {
    if (competitor.id === winnerId) {
      setBasePoints(eventScores, competitor.id, rules.winnerBasePoints);
      return;
    }
    // Défaite serrée : à la fin du 501, le reste du perdant est finissable en une visite selon la règle de sortie.
    const isInCheckoutPosition = isCheckoutPossible(metrics[competitor.id].remaining, match.config.checkOut);
    setBasePoints(eventScores, competitor.id, isInCheckoutPosition ? rules.closeLossBasePoints : rules.standardLossBasePoints);
  });

  const metricOf = (pick: (metric: X01Metric) => number) =>
    Object.fromEntries(competitors.map((competitor) => [competitor.id, pick(metrics[competitor.id])]));
  const { bestFirstNineAverage, bestAverage, mostTonPlusVisits } = rules.bonuses;
  appendBonuses(eventScores, awardBonus(metricOf((metric) => metric.firstNineAvg), bestFirstNineAverage.points, bestFirstNineAverage.label, bestFirstNineAverage.detail));
  appendBonuses(eventScores, awardBonus(metricOf((metric) => metric.threeDartAvg), bestAverage.points, bestAverage.label, bestAverage.detail));
  appendBonuses(eventScores, awardBonus(metricOf((metric) => metric.tonPlusVisits), mostTonPlusVisits.points, mostTonPlusVisits.label, mostTonPlusVisits.detail));

  competitors.forEach((competitor) => {
    const metric = metrics[competitor.id];
    const details = `Moyenne ${metric.threeDartAvg.toFixed(1)}, 9 premières ${metric.firstNineAvg.toFixed(1)}, ${metric.tonPlusVisits} visites à 100 ou plus, ${metric.totalDarts} fléchettes.`;
    eventScores[competitor.id].summary = competitor.id === winnerId
      ? `Victoire 501. ${details}`
      : `Défaite 501 (reste ${metric.remaining}). ${details}`;
  });

  return eventScores;
};

const resolveCricketBasePoints = (competitorId: string, winnerId: string | null) => {
  const rules = TRIATHLON_SCORING_RULES.cricket;
  if (!winnerId) return rules.drawBasePoints;
  return competitorId === winnerId ? rules.winnerBasePoints : rules.loserBasePoints;
};

const resolveCricketOutcomeLabel = (competitorId: string, winnerId: string | null) => {
  if (!winnerId) return 'Égalité Cricket.';
  return competitorId === winnerId ? 'Victoire Cricket.' : 'Défaite Cricket.';
};

const buildCricketEventScores = (summary: CricketMatchSummary, competitors: TriathlonCompetitor[]) => {
  const eventScores = createEventScores(competitors, 'cricket');

  const metrics: Record<string, CricketMetric> = {};
  summary.competitors.forEach((player) => {
    const totalMarks = (Object.values(player.marks)).reduce((sum, value) => sum + value, 0);
    const rounds = player.dartsThrown / 3;
    const closedNumbers = CRICKET_TARGETS.filter((target) => player.marks[target] >= 3).length;
    metrics[player.id] = {
      score: player.score,
      mpr: rounds > 0 ? totalMarks / rounds : 0,
      closedNumbers,
      fullClose: closedNumbers === CRICKET_TARGETS.length ? 1 : 0,
    };
  });

  // Le rang suit le vainqueur réel ; sans vainqueur reconnu (égalité déclarée), chacun reçoit les points d'égalité.
  const winnerId = competitors.some((competitor) => competitor.id === summary.winnerId) ? summary.winnerId : null;
  competitors.forEach((competitor) => {
    setBasePoints(eventScores, competitor.id, resolveCricketBasePoints(competitor.id, winnerId));
  });

  const metricOf = (pick: (metric: CricketMetric) => number) =>
    Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id] ? pick(metrics[competitor.id]) : 0]));
  const { bestMpr, fullClose, mostClosedNumbers } = TRIATHLON_SCORING_RULES.cricket.bonuses;
  appendBonuses(eventScores, awardBonus(metricOf((metric) => metric.mpr), bestMpr.points, bestMpr.label, bestMpr.detail));
  appendBonuses(eventScores, awardBonus(metricOf((metric) => metric.fullClose), fullClose.points, fullClose.label, fullClose.detail));
  appendBonuses(eventScores, awardBonus(metricOf((metric) => metric.closedNumbers), mostClosedNumbers.points, mostClosedNumbers.label, mostClosedNumbers.detail));

  competitors.forEach((competitor) => {
    const metric = metrics[competitor.id] || { mpr: 0, score: 0, closedNumbers: 0 };
    const outcome = resolveCricketOutcomeLabel(competitor.id, winnerId);
    eventScores[competitor.id].summary = `${outcome} Score ${metric.score}, MPR ${metric.mpr.toFixed(2)}, ${metric.closedNumbers} numéros fermés.`;
  });

  return eventScores;
};

const getBestCapitalChallenge = (state: CapitalPlayerState) =>
  Math.max(0, ...state.history.filter((entry) => entry.isSuccess).map((entry) => entry.pointsScored));

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
        const bestChallenge = state ? getBestCapitalChallenge(state) : 0;
        const penalties = state?.history.filter((entry) => !entry.isSuccess).length ?? 0;
        return [
          competitor.id,
          {
            score: state?.score ?? 0,
            bestChallenge,
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
      const memberIdsSet = new Set(memberIds);
      const memberStates = capitalResults.filter((entry) => memberIdsSet.has(entry.id));
      return [
        competitor.id,
        {
          score: memberStates.reduce((sum, state) => sum + state.score, 0),
          bestChallenge: Math.max(0, ...memberStates.map(getBestCapitalChallenge)),
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
      Object.fromEntries(competitors.map((competitor) => [competitor.id, metrics[competitor.id]?.bestChallenge ?? 0])),
      TRIATHLON_SCORING_RULES.capital.bonuses.bestChallenge.points,
      TRIATHLON_SCORING_RULES.capital.bonuses.bestChallenge.label,
      TRIATHLON_SCORING_RULES.capital.bonuses.bestChallenge.detail
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
    eventScores[competitor.id].summary = `Score ${metric.score}, ${metric.successfulRounds} réussites, ${metric.penalties} pénalités.`;
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
