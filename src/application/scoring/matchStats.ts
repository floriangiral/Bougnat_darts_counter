import type { InOutRule, MatchState, Turn } from '../../../types';

const IMPOSSIBLE_TWO_DART_CHECKOUTS = new Set([99, 102, 103, 105, 106, 108, 109]);
const IMPOSSIBLE_THREE_DART_CHECKOUTS = new Set([159, 162, 163, 165, 166, 168, 169]);

export type ScoreCountKey = 'c180' | 'c160' | 'c140' | 'c120' | 'c100' | 'c80' | 'c60';

export interface CheckoutBucketStats {
  attempts: number;
  made: number;
}

export interface DetailedStats {
  threeDartAverage: number;
  nonCheckoutAverage: number;
  firstNineAverage: number;
  checkoutRate: number;
  checkoutMade: number;
  checkoutAttempts: number;
  checkoutByDarts: {
    one: CheckoutBucketStats;
    two: CheckoutBucketStats;
    three: CheckoutBucketStats;
  };
  highestCheckout: number;
  highestScore: number;
  averageWinningLegDarts: number;
  bestLegDarts: number | null;
  worstLegDarts: number | null;
  scoreCounts: Record<ScoreCountKey, number>;
}

const createEmptyDetailedStats = (): DetailedStats => ({
  threeDartAverage: 0,
  nonCheckoutAverage: 0,
  firstNineAverage: 0,
  checkoutRate: 0,
  checkoutMade: 0,
  checkoutAttempts: 0,
  checkoutByDarts: {
    one: { attempts: 0, made: 0 },
    two: { attempts: 0, made: 0 },
    three: { attempts: 0, made: 0 },
  },
  highestCheckout: 0,
  highestScore: 0,
  averageWinningLegDarts: 0,
  bestLegDarts: null,
  worstLegDarts: null,
  scoreCounts: {
    c180: 0,
    c160: 0,
    c140: 0,
    c120: 0,
    c100: 0,
    c80: 0,
    c60: 0,
  },
});

const getTurnTeamId = (match: MatchState, turn: Turn) => match.players.find((player) => player.id === turn.playerId)?.teamId;

const isCheckoutOpportunity = (score: number, checkOutRule: InOutRule) => {
  if (score <= 1) return false;

  if (checkOutRule === 'Open') {
    return score <= 180;
  }

  if (checkOutRule === 'Double') {
    if (score > 170) return false;
    return !IMPOSSIBLE_THREE_DART_CHECKOUTS.has(score);
  }

  if (checkOutRule === 'Master') {
    return score <= 180;
  }

  return false;
};

const getCheckoutAttemptBucket = (dartsThrown: number): 1 | 2 | 3 => {
  if (dartsThrown <= 1) return 1;
  if (dartsThrown === 2) return 2;
  return 3;
};

const calculateDetailedStatsForParticipant = (
  match: MatchState,
  participantTeamId: string,
  isRelevantTurn: (turn: Turn) => boolean,
): DetailedStats => {
  const allLegs = [...match.completedLegs, match.currentLeg];
  const relevantTurns = allLegs.flatMap((leg) => leg.history).filter(isRelevantTurn);

  const totalScore = relevantTurns.reduce((acc, turn) => acc + (turn.isBust ? 0 : turn.score), 0);
  const totalDarts = relevantTurns.reduce((acc, turn) => acc + turn.dartsThrown, 0);
  const threeDartAverage = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;

  let nonOutshotScore = 0;
  let nonOutshotDarts = 0;

  const first9Turns: Turn[] = [];
  for (const leg of allLegs) {
    let dartsThrownInLeg = 0;
    for (const turn of leg.history) {
      if (!isRelevantTurn(turn)) continue;
      if (dartsThrownInLeg < 9) {
        first9Turns.push(turn);
      }
      dartsThrownInLeg += turn.dartsThrown;
    }
  }

  const first9Score = first9Turns.reduce((acc, turn) => acc + (turn.isBust ? 0 : turn.score), 0);
  const first9Darts = first9Turns.reduce((acc, turn) => acc + turn.dartsThrown, 0);
  const firstNineAverage = first9Darts > 0 ? (first9Score / first9Darts) * 3 : 0;

  const checkoutBuckets: Record<1 | 2 | 3, CheckoutBucketStats> = {
    1: { attempts: 0, made: 0 },
    2: { attempts: 0, made: 0 },
    3: { attempts: 0, made: 0 },
  };

  const participantTeamIds = new Set(match.players.map((player) => player.teamId));

  for (const leg of allLegs) {
    const teamScores: Record<string, number> = Object.fromEntries(
      Array.from(participantTeamIds).map((id) => [id, match.config.startingScore]),
    );

    leg.history.forEach((turn, turnIndex) => {
      const turnTeamId = getTurnTeamId(match, turn);
      if (!turnTeamId) return;

      const remainingBeforeTurn = teamScores[turnTeamId];

      if (isRelevantTurn(turn)) {
        if (!isCheckoutOpportunity(remainingBeforeTurn, match.config.checkOut)) {
          nonOutshotScore += turn.isBust ? 0 : turn.score;
          nonOutshotDarts += turn.dartsThrown;
        }

        const isWinningTurn = leg.winnerId === participantTeamId && turnIndex === leg.history.length - 1 && !turn.isBust;
        const isRealCheckoutAttempt = isCheckoutOpportunity(remainingBeforeTurn, match.config.checkOut)
          && (turn.isBust || isWinningTurn);

        if (isRealCheckoutAttempt) {
          const attemptBucket = getCheckoutAttemptBucket(turn.dartsThrown);
          checkoutBuckets[attemptBucket].attempts += 1;
          if (isWinningTurn) {
            checkoutBuckets[attemptBucket].made += 1;
          }
        }
      }

      if (!turn.isBust) {
        teamScores[turnTeamId] = turn.remainingAfter;
      }
    });
  }

  const totalCheckoutAttempts = checkoutBuckets[1].attempts + checkoutBuckets[2].attempts + checkoutBuckets[3].attempts;
  const totalCheckoutMade = checkoutBuckets[1].made + checkoutBuckets[2].made + checkoutBuckets[3].made;
  const nonCheckoutAverage = nonOutshotDarts > 0 ? (nonOutshotScore / nonOutshotDarts) * 3 : 0;
  const checkoutRate =
    totalCheckoutAttempts > 0
      ? (totalCheckoutMade / totalCheckoutAttempts) * 100
      : 0;

  const checkouts = allLegs.filter((leg) => leg.winnerId === participantTeamId);
  const highestCheckout = checkouts.reduce((max, leg) => {
    const lastTurn = leg.history[leg.history.length - 1];
    return lastTurn && !lastTurn.isBust && lastTurn.score > max ? lastTurn.score : max;
  }, 0);

  const legsConsideringCurrent = [...match.completedLegs];
  if (match.currentLeg.winnerId) {
    legsConsideringCurrent.push(match.currentLeg);
  }

  const teamLegs = legsConsideringCurrent.filter((leg) => leg.winnerId === participantTeamId);
  const legDarts = teamLegs.map((leg) =>
    leg.history
      .filter((turn) => isRelevantTurn(turn))
      .reduce((acc, turn) => acc + turn.dartsThrown, 0),
  );

  const bestLegDarts = legDarts.length > 0 ? Math.min(...legDarts) : null;
  const worstLegDarts = legDarts.length > 0 ? Math.max(...legDarts) : null;
  const averageWinningLegDarts = legDarts.length > 0
    ? Math.round(legDarts.reduce((sum, darts) => sum + darts, 0) / legDarts.length)
    : 0;
  const highestScore = relevantTurns.reduce((max, turn) => (turn.score > max ? turn.score : max), 0);

  const scoreCounts = {
    c180: relevantTurns.filter((turn) => turn.score >= 171).length,
    c160: relevantTurns.filter((turn) => turn.score >= 152 && turn.score < 171).length,
    c140: relevantTurns.filter((turn) => turn.score >= 133 && turn.score < 152).length,
    c120: relevantTurns.filter((turn) => turn.score >= 114 && turn.score < 133).length,
    c100: relevantTurns.filter((turn) => turn.score >= 95 && turn.score < 114).length,
    c80: relevantTurns.filter((turn) => turn.score >= 76 && turn.score < 95).length,
    c60: relevantTurns.filter((turn) => turn.score >= 57 && turn.score < 76).length,
  };

  return {
    threeDartAverage,
    nonCheckoutAverage,
    firstNineAverage,
    checkoutRate,
    checkoutMade: totalCheckoutMade,
    checkoutAttempts: totalCheckoutAttempts,
    checkoutByDarts: {
      one: checkoutBuckets[1],
      two: checkoutBuckets[2],
      three: checkoutBuckets[3],
    },
    highestCheckout,
    highestScore,
    averageWinningLegDarts,
    bestLegDarts,
    worstLegDarts,
    scoreCounts,
  };
};

export const getMinDartsForScore = (score: number, checkOutRule: InOutRule): number => {
  if (score === 0) return 0;

  if (checkOutRule === 'Open') {
    if (score <= 60) return 1;
    if (score <= 120) return 2;
    return 3;
  }

  if (checkOutRule === 'Double') {
    if ((score <= 40 && score % 2 === 0) || score === 50) return 1;

    if (score <= 110 && !IMPOSSIBLE_TWO_DART_CHECKOUTS.has(score)) return 2;

    return 3;
  }

  if (checkOutRule === 'Master') {
    if ((score <= 40 && score % 2 === 0) || (score <= 60 && score % 3 === 0) || score === 25 || score === 50) return 1;
    if (score <= 120) return 2;
    return 3;
  }

  return 3;
};

export const calculateDetailedStats = (match: MatchState, playerId: string): DetailedStats => {
  const player = match.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return createEmptyDetailedStats();
  }

  return calculateDetailedStatsForParticipant(
    match,
    player.teamId,
    (turn) => turn.playerId === playerId,
  );
};

export const calculateDetailedStatsForTeam = (match: MatchState, teamId: string): DetailedStats => {
  const teamPlayers = match.players.filter((player) => player.teamId === teamId);
  if (teamPlayers.length === 0) {
    return createEmptyDetailedStats();
  }

  return calculateDetailedStatsForParticipant(
    match,
    teamId,
    (turn) => getTurnTeamId(match, turn) === teamId,
  );
};
