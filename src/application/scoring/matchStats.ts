import type { InOutRule, MatchState, Turn } from '../../../types';

const IMPOSSIBLE_TWO_DART_CHECKOUTS = new Set([99, 102, 103, 105, 106, 108, 109]);
const IMPOSSIBLE_THREE_DART_CHECKOUTS = new Set([159, 162, 163, 165, 166, 168, 169]);

const createEmptyDetailedStats = () => ({
  threeDartAvg: '0.0',
  nonOutshotAvg: '0.0',
  first9Avg: '0.0',
  checkoutPercent: '0.0%',
  checkoutSummary: '0/0 checkouts',
  checkoutBreakdown: ['1 dart: 0/0', '2 darts: 0/0', '3 darts: 0/0'],
  highestCheckout: 0,
  highestScore: 0,
  avgWinningLegDarts: '0.0',
  bestLegDarts: null as number | null,
  worstLegDarts: null as number | null,
  scoreCounts: {} as Record<string, number>,
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

const calculateDetailedStatsForParticipant = (
  match: MatchState,
  participantTeamId: string,
  isRelevantTurn: (turn: Turn) => boolean,
) => {
  const allLegs = [...match.completedLegs, match.currentLeg];
  const relevantTurns = allLegs.flatMap((leg) => leg.history).filter(isRelevantTurn);

  const totalScore = relevantTurns.reduce((acc, turn) => acc + (turn.isBust ? 0 : turn.score), 0);
  const totalDarts = relevantTurns.reduce((acc, turn) => acc + turn.dartsThrown, 0);
  const threeDartAvg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : '0.0';

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
  const first9Avg = first9Darts > 0 ? ((first9Score / first9Darts) * 3).toFixed(1) : '0.0';

  const checkoutBuckets = {
    1: { attempts: 0, made: 0 },
    2: { attempts: 0, made: 0 },
    3: { attempts: 0, made: 0 },
  } as const;

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

        const minDarts = getMinDartsForScore(remainingBeforeTurn, match.config.checkOut);
        if (isCheckoutOpportunity(remainingBeforeTurn, match.config.checkOut) && minDarts >= 1 && minDarts <= 3) {
          checkoutBuckets[minDarts].attempts += 1;
          const isWinningTurn = leg.winnerId === participantTeamId && turnIndex === leg.history.length - 1 && !turn.isBust;
          if (isWinningTurn) {
            checkoutBuckets[minDarts].made += 1;
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
  const nonOutshotAvg = nonOutshotDarts > 0 ? ((nonOutshotScore / nonOutshotDarts) * 3).toFixed(1) : '0.0';
  const checkoutPercent =
    totalCheckoutAttempts > 0
      ? `${((totalCheckoutMade / totalCheckoutAttempts) * 100).toFixed(1)}%`
      : '0.0%';
  const checkoutSummary = `${totalCheckoutMade}/${totalCheckoutAttempts} checkouts`;
  const checkoutBreakdown = [
    `1 dart: ${checkoutBuckets[1].made}/${checkoutBuckets[1].attempts}`,
    `2 darts: ${checkoutBuckets[2].made}/${checkoutBuckets[2].attempts}`,
    `3 darts: ${checkoutBuckets[3].made}/${checkoutBuckets[3].attempts}`,
  ];

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
  const avgWinningLegDarts = legDarts.length > 0
    ? String(Math.round(legDarts.reduce((sum, darts) => sum + darts, 0) / legDarts.length))
    : '0';
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
    threeDartAvg,
    nonOutshotAvg,
    first9Avg,
    checkoutPercent,
    checkoutSummary,
    checkoutBreakdown,
    highestCheckout,
    highestScore,
    avgWinningLegDarts,
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

export const calculateDetailedStats = (match: MatchState, playerId: string) => {
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

export const calculateDetailedStatsForTeam = (match: MatchState, teamId: string) => {
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
