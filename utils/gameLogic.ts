
import { GameConfig, MatchState, Player, LegState, Turn, InOutRule } from '../types';

// Helper for time formatting (used in MatchView and Stats)
export const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const clampStartingIndex = (players: Player[], index: number | undefined) =>
  Math.max(0, Math.min(players.length - 1, index ?? 0));

export const buildDoublesRotation = (
  players: Player[],
  teamStarterIds: Record<string, string>,
  startingTeamId: string
): Player[] => {
  const teamIds = Array.from(new Set(players.map((player) => player.teamId)));
  const otherTeamId = teamIds.find((teamId) => teamId !== startingTeamId);

  if (!otherTeamId) {
    return [...players];
  }

  const startingTeamPlayers = players.filter((player) => player.teamId === startingTeamId);
  const otherTeamPlayers = players.filter((player) => player.teamId === otherTeamId);

  if (startingTeamPlayers.length < 2 || otherTeamPlayers.length < 2) {
    return [...players];
  }

  const startingStarter =
    startingTeamPlayers.find((player) => player.id === teamStarterIds[startingTeamId]) ?? startingTeamPlayers[0];
  const otherStarter =
    otherTeamPlayers.find((player) => player.id === teamStarterIds[otherTeamId]) ?? otherTeamPlayers[0];
  const startingPartner =
    startingTeamPlayers.find((player) => player.id !== startingStarter.id) ?? startingTeamPlayers[1];
  const otherPartner =
    otherTeamPlayers.find((player) => player.id !== otherStarter.id) ?? otherTeamPlayers[1];

  return [startingStarter, otherStarter, startingPartner, otherPartner];
};

const buildNextDoublesLegState = (match: MatchState) => {
  const currentStartingTeamId =
    match.players[match.currentLeg.startingPlayerIndex]?.teamId
    ?? match.config.initialStartingTeamId
    ?? match.players[0]?.teamId;
  const nextStartingTeamId = match.players.find((player) => player.teamId !== currentStartingTeamId)?.teamId;

  if (!currentStartingTeamId || !nextStartingTeamId) {
    return null;
  }

  const orderedPlayers = [...match.players];
  const nextStartingPlayerId =
    match.config.teamStarterIds?.[nextStartingTeamId]
    ?? orderedPlayers.find((player) => player.teamId === nextStartingTeamId)?.id;
  const nextStartingPlayerIndex = Math.max(
    0,
    orderedPlayers.findIndex((player) => player.id === nextStartingPlayerId)
  );
  const nextLeg: LegState = {
    scores: {},
    history: [],
    winnerId: null,
    startingPlayerIndex: nextStartingPlayerIndex,
  };

  orderedPlayers.forEach((player) => {
    nextLeg.scores[player.teamId] = match.config.startingScore;
  });

  return {
    orderedPlayers,
    nextLeg,
  };
};

export const getOrderedPlayersAndStarter = (
  players: Player[],
  config: GameConfig
): { orderedPlayers: Player[]; startingPlayerIndex: number } => {
  let orderedPlayers = [...players];
  let startingPlayerIndex = clampStartingIndex(players, config.initialStartingPlayerIndex);

  if (config.isDoubles && config.initialStartingTeamId) {
    orderedPlayers = buildDoublesRotation(players, config.teamStarterIds ?? {}, config.initialStartingTeamId);
    startingPlayerIndex = 0;
  }

  return { orderedPlayers, startingPlayerIndex };
};

export const createMatch = (players: Player[], config: GameConfig): MatchState => {
  const { orderedPlayers, startingPlayerIndex: initialStartingPlayerIndex } = getOrderedPlayersAndStarter(players, config);

  const initialLeg: LegState = {
    scores: {},
    history: [],
    winnerId: null,
    startingPlayerIndex: initialStartingPlayerIndex,
  };

  const legsWon: Record<string, number> = {};
  const setsWon: Record<string, number> = {};

  orderedPlayers.forEach(p => {
    initialLeg.scores[p.teamId] = config.startingScore;
    legsWon[p.teamId] = 0;
    setsWon[p.teamId] = 0;
  });

  return {
    id: crypto.randomUUID(),
    config,
    players: orderedPlayers,
    legsWon,
    setsWon,
    completedLegs: [],
    currentLeg: initialLeg,
    status: 'active',
    matchWinnerId: null,
    currentPlayerIndex: initialStartingPlayerIndex,
    duration: 0,
  };
};

export const reorderPlayersForDoubles = (
    match: MatchState, 
    t1StarterId: string, 
    t2StarterId: string, 
    startingTeamId: string
): MatchState => {
    const teamStarterIds = {
      ...(match.config.teamStarterIds ?? {}),
      team1: t1StarterId,
      team2: t2StarterId,
    };
    const newOrder = buildDoublesRotation(match.players, teamStarterIds, startingTeamId);

    return {
        ...match,
        config: {
          ...match.config,
          initialStartingTeamId: startingTeamId,
          teamStarterIds,
        },
        players: newOrder,
        currentPlayerIndex: 0,
        currentLeg: {
          ...match.currentLeg,
          startingPlayerIndex: 0,
        },
    };
};

export const resolveMatchStart = (match: MatchState, starterId: string): MatchState => {
  if (match.currentLeg.history.length > 0) return match;

  if (match.config.isDoubles) {
    const teamStarterIds = match.config.teamStarterIds ?? {};
    const teamIds = Array.from(new Set(match.players.map((player) => player.teamId)));
    const [teamOneId, teamTwoId] = teamIds;

    if (!teamOneId || !teamTwoId) {
      return match;
    }

    const nextTeamStarterIds = {
      [teamOneId]: teamStarterIds[teamOneId] ?? match.players.find((player) => player.teamId === teamOneId)?.id ?? '',
      [teamTwoId]: teamStarterIds[teamTwoId] ?? match.players.find((player) => player.teamId === teamTwoId)?.id ?? '',
    };

    const orderedPlayers = buildDoublesRotation(match.players, nextTeamStarterIds, starterId);

    return {
      ...match,
      config: {
        ...match.config,
        initialStartingTeamId: starterId,
        teamStarterIds: nextTeamStarterIds,
      },
      players: orderedPlayers,
      currentPlayerIndex: 0,
      currentLeg: {
        ...match.currentLeg,
        startingPlayerIndex: 0,
      },
    };
  }

  const nextIndex = clampStartingIndex(match.players, parseInt(starterId, 10));
  return {
    ...match,
    config: {
      ...match.config,
      initialStartingPlayerIndex: nextIndex,
    },
    currentPlayerIndex: nextIndex,
    currentLeg: {
      ...match.currentLeg,
      startingPlayerIndex: nextIndex,
    },
  };
};

export const submitTurn = (match: MatchState, score: number, dartsThrown: number): MatchState => {
  const currentPlayer = match.players[match.currentPlayerIndex];
  const teamId = currentPlayer.teamId;
  const currentScore = match.currentLeg.scores[teamId];
  const remaining = currentScore - score;

  let isBust = false;
  if (remaining < 0) isBust = true;
  if (match.config.checkOut === 'Double' && remaining === 1) isBust = true;

  const turn: Turn = {
    playerId: currentPlayer.id,
    score: isBust ? 0 : score,
    isBust,
    remainingAfter: isBust ? currentScore : remaining,
    dartsThrown,
  };

  const newHistory = [...match.currentLeg.history, turn];
  const newScores = { ...match.currentLeg.scores };
  if (!isBust) {
    newScores[teamId] = remaining;
  }

  let nextMatch = {
    ...match,
    currentLeg: {
      ...match.currentLeg,
      history: newHistory,
      scores: newScores,
    },
  };

  if (remaining === 0 && !isBust) {
    nextMatch.currentLeg.winnerId = teamId;
    nextMatch.legsWon[teamId] += 1;

    if (match.config.matchMode === 'SETS') {
      if (nextMatch.legsWon[teamId] === match.config.legsToWin) {
        nextMatch.setsWon[teamId] += 1;
        Object.keys(nextMatch.legsWon).forEach(tid => nextMatch.legsWon[tid] = 0);
        if (nextMatch.setsWon[teamId] === match.config.setsToWin) {
          nextMatch.status = 'finished';
          nextMatch.matchWinnerId = teamId;
        }
      }
    } else {
      if (nextMatch.legsWon[teamId] === match.config.legsToWin) {
        nextMatch.status = 'finished';
        nextMatch.matchWinnerId = teamId;
      }
    }

    if (nextMatch.status !== 'finished') {
      nextMatch.completedLegs = [...nextMatch.completedLegs, nextMatch.currentLeg];

      if (match.config.isDoubles) {
        const nextDoublesLeg = buildNextDoublesLegState(match);

        if (nextDoublesLeg) {
          nextMatch.players = nextDoublesLeg.orderedPlayers;
          nextMatch.currentLeg = nextDoublesLeg.nextLeg;
          nextMatch.currentPlayerIndex = nextDoublesLeg.nextLeg.startingPlayerIndex;
        }
      } else {
        const nextStartingPlayerIndex = (match.currentLeg.startingPlayerIndex + 1) % match.players.length;
        const nextLeg: LegState = {
          scores: {},
          history: [],
          winnerId: null,
          startingPlayerIndex: nextStartingPlayerIndex,
        };
        match.players.forEach((player) => {
          nextLeg.scores[player.teamId] = match.config.startingScore;
        });
        nextMatch.currentLeg = nextLeg;
        nextMatch.currentPlayerIndex = nextStartingPlayerIndex;
      }
    }
  } else {
    nextMatch.currentPlayerIndex = (match.currentPlayerIndex + 1) % match.players.length;
  }

  return nextMatch;
};

export const undoTurn = (match: MatchState): MatchState => {
  if (match.currentLeg.history.length === 0) return match;

  const newHistory = match.currentLeg.history.slice(0, -1);
  const lastTurn = match.currentLeg.history[match.currentLeg.history.length - 1];
  const playerIndex = match.players.findIndex(p => p.id === lastTurn.playerId);
  const teamId = match.players[playerIndex].teamId;

  const newScores = { ...match.currentLeg.scores };
  if (!lastTurn.isBust) {
    newScores[teamId] += lastTurn.score;
  }

  return {
    ...match,
    currentPlayerIndex: playerIndex,
    currentLeg: {
      ...match.currentLeg,
      history: newHistory,
      scores: newScores,
    },
  };
};

export const switchStartPlayer = (match: MatchState): MatchState => {
  if (match.currentLeg.history.length > 0) return match;
  const nextIdx = (match.currentPlayerIndex + 1) % match.players.length;
  return {
    ...match,
    currentPlayerIndex: nextIdx,
    currentLeg: {
      ...match.currentLeg,
      startingPlayerIndex: nextIdx,
    },
  };
};

/**
 * Calcule le nombre de fléchettes minimum théorique pour un score de fermeture donné
 */
export const getMinDartsForScore = (score: number, checkOutRule: InOutRule): number => {
  if (score === 0) return 0;

  if (checkOutRule === 'Open') {
    if (score <= 60) return 1;
    if (score <= 120) return 2;
    return 3;
  }

  if (checkOutRule === 'Double') {
    // 1 fléchette (Double 1 à 20 + Bullseye)
    if ((score <= 40 && score % 2 === 0) || score === 50) return 1;
    
    // 2 fléchettes (Maximum possible : T20 + D20 = 100, ou T20 + Bull = 110)
    // Cas particuliers de scores non finissables en 2 fléchettes
    const impossibleInTwo = [99, 102, 103, 105, 106, 108, 109];
    if (score <= 110 && !impossibleInTwo.includes(score)) return 2;
    
    // 3 fléchettes (Max checkout standard 170)
    return 3;
  }

  if (checkOutRule === 'Master') {
    // 1 fléchette (Double, Triple ou Bullseye)
    if ((score <= 40 && score % 2 === 0) || (score <= 60 && score % 3 === 0) || score === 25 || score === 50) return 1;
    if (score <= 120) return 2;
    return 3;
  }

  return 3;
};

const isCheckoutOpportunity = (score: number, checkOutRule: InOutRule) => {
  if (score <= 1) return false;

  if (checkOutRule === 'Open') {
    return score <= 180;
  }

  if (checkOutRule === 'Double') {
    if (score > 170) return false;
    const impossibleInThree = new Set([159, 162, 163, 165, 166, 168, 169]);
    return !impossibleInThree.has(score);
  }

  if (checkOutRule === 'Master') {
    return score <= 180;
  }

  return false;
};

export const calculateDetailedStats = (match: MatchState, playerId: string) => {
  const p = match.players.find(pl => pl.id === playerId);
  if (!p) return {
    threeDartAvg: "0.0",
    nonOutshotAvg: "0.0",
    first9Avg: "0.0",
    checkoutPercent: "0.0%",
    checkoutSummary: "0/0 checkouts",
    checkoutBreakdown: ["1 dart: 0/0", "2 darts: 0/0", "3 darts: 0/0"],
    highestCheckout: 0,
    highestScore: 0,
    avgWinningLegDarts: "0.0",
    bestLegDarts: null,
    worstLegDarts: null,
    scoreCounts: {} as any,
  };
  
  const teamId = p.teamId;

  const allTurns = [...match.completedLegs, match.currentLeg].flatMap(l => l.history).filter(t => t.playerId === playerId);
  const totalScore = allTurns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
  const totalDarts = allTurns.reduce((acc, t) => acc + t.dartsThrown, 0);
  const threeDartAvg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";
  let nonOutshotScore = 0;
  let nonOutshotDarts = 0;

  // First 9 Avg
  const first9Turns: Turn[] = [];
  [...match.completedLegs, match.currentLeg].forEach(leg => {
      let teamDartsInLeg = 0;
      leg.history.forEach(t => {
          if (t.playerId === playerId) {
              if (teamDartsInLeg < 9) first9Turns.push(t);
              teamDartsInLeg += t.dartsThrown;
          }
      });
  });
  const first9Score = first9Turns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
  const first9Darts = first9Turns.reduce((acc, t) => acc + t.dartsThrown, 0);
  const first9Avg = first9Darts > 0 ? ((first9Score / first9Darts) * 3).toFixed(1) : "0.0";

  const checkoutBuckets = {
    1: { attempts: 0, made: 0 },
    2: { attempts: 0, made: 0 },
    3: { attempts: 0, made: 0 },
  } as const;

  [...match.completedLegs, match.currentLeg].forEach((leg) => {
    const teamScores: Record<string, number> = Object.fromEntries(
      Array.from(new Set(match.players.map((player) => player.teamId))).map((id) => [id, match.config.startingScore])
    );

    leg.history.forEach((turn, turnIndex) => {
      const turnTeamId = match.players.find((pl) => pl.id === turn.playerId)?.teamId;
      if (!turnTeamId) return;

      const remainingBeforeTurn = teamScores[turnTeamId];

      if (turn.playerId === playerId) {
        if (!isCheckoutOpportunity(remainingBeforeTurn, match.config.checkOut)) {
          nonOutshotScore += turn.isBust ? 0 : turn.score;
          nonOutshotDarts += turn.dartsThrown;
        }

        const minDarts = getMinDartsForScore(remainingBeforeTurn, match.config.checkOut);
        if (isCheckoutOpportunity(remainingBeforeTurn, match.config.checkOut) && minDarts >= 1 && minDarts <= 3) {
          checkoutBuckets[minDarts].attempts += 1;
          const isWinningTurn = leg.winnerId === teamId && turnIndex === leg.history.length - 1 && !turn.isBust;
          if (isWinningTurn) {
            checkoutBuckets[minDarts].made += 1;
          }
        }
      }

      if (!turn.isBust) {
        teamScores[turnTeamId] = turn.remainingAfter;
      }
    });
  });

  const totalCheckoutAttempts = checkoutBuckets[1].attempts + checkoutBuckets[2].attempts + checkoutBuckets[3].attempts;
  const totalCheckoutMade = checkoutBuckets[1].made + checkoutBuckets[2].made + checkoutBuckets[3].made;
  const nonOutshotAvg = nonOutshotDarts > 0 ? ((nonOutshotScore / nonOutshotDarts) * 3).toFixed(1) : "0.0";
  const checkoutPercent = totalCheckoutAttempts > 0
    ? ((totalCheckoutMade / totalCheckoutAttempts) * 100).toFixed(1) + "%"
    : "0.0%";
  const checkoutSummary = `${totalCheckoutMade}/${totalCheckoutAttempts} checkouts`;
  const checkoutBreakdown = [
    `1 dart: ${checkoutBuckets[1].made}/${checkoutBuckets[1].attempts}`,
    `2 darts: ${checkoutBuckets[2].made}/${checkoutBuckets[2].attempts}`,
    `3 darts: ${checkoutBuckets[3].made}/${checkoutBuckets[3].attempts}`,
  ];

  // Pour les checkouts, on inclut aussi la leg courante si elle est finie
  const checkouts = [...match.completedLegs, match.currentLeg].filter(l => l.winnerId === teamId);
  const highestCheckout = checkouts.reduce((max, l) => {
      const lastTurn = l.history[l.history.length - 1];
      return (lastTurn && !lastTurn.isBust && lastTurn.score > max) ? lastTurn.score : max;
  }, 0);

  // Pour Best/Worst Leg, on doit s'assurer de prendre en compte la leg courante si elle est gagnée
  // (C'est critique pour les matchs en 1 manche)
  const legsConsideringCurrent = [...match.completedLegs];
  if (match.currentLeg.winnerId) {
      legsConsideringCurrent.push(match.currentLeg);
  }
  const teamLegs = legsConsideringCurrent.filter(l => l.winnerId === teamId);
  
  // Calculer le nombre total de fléchettes lancées par l'ÉQUIPE pour gagner la manche
  const legDarts = teamLegs.map(l => 
    l.history
      .filter(t => match.players.find(pl => pl.id === t.playerId)?.teamId === teamId)
      .reduce((acc, t) => acc + t.dartsThrown, 0)
  );
  
  const bestLegDarts = legDarts.length > 0 ? Math.min(...legDarts) : null;
  const worstLegDarts = legDarts.length > 0 ? Math.max(...legDarts) : null;
  const avgWinningLegDarts = legDarts.length > 0
    ? String(Math.round(legDarts.reduce((sum, darts) => sum + darts, 0) / legDarts.length))
    : "0";

  const highestScore = allTurns.reduce((max, t) => (t.score > max ? t.score : max), 0);

  const scoreCounts = {
    c180: allTurns.filter(t => t.score >= 171).length,
    c160: allTurns.filter(t => t.score >= 152 && t.score < 171).length,
    c140: allTurns.filter(t => t.score >= 133 && t.score < 152).length,
    c120: allTurns.filter(t => t.score >= 114 && t.score < 133).length,
    c100: allTurns.filter(t => t.score >= 95 && t.score < 114).length,
    c80: allTurns.filter(t => t.score >= 76 && t.score < 95).length,
    c60: allTurns.filter(t => t.score >= 57 && t.score < 76).length,
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
    scoreCounts
  };
};

export const calculateDetailedStatsForTeam = (match: MatchState, teamId: string) => {
  const teamPlayers = match.players.filter((player) => player.teamId === teamId);
  if (teamPlayers.length === 0) {
    return {
      threeDartAvg: "0.0",
      nonOutshotAvg: "0.0",
      first9Avg: "0.0",
      checkoutPercent: "0.0%",
      checkoutSummary: "0/0 checkouts",
      checkoutBreakdown: ["1 dart: 0/0", "2 darts: 0/0", "3 darts: 0/0"],
      highestCheckout: 0,
      highestScore: 0,
      avgWinningLegDarts: "0.0",
      bestLegDarts: null,
      worstLegDarts: null,
      scoreCounts: {} as any,
    };
  }

  const playerIds = new Set(teamPlayers.map((player) => player.id));
  const allLegs = [...match.completedLegs, match.currentLeg];
  const allTurns = allLegs.flatMap((leg) => leg.history).filter((turn) => playerIds.has(turn.playerId));
  const totalScore = allTurns.reduce((acc, turn) => acc + (turn.isBust ? 0 : turn.score), 0);
  const totalDarts = allTurns.reduce((acc, turn) => acc + turn.dartsThrown, 0);
  const threeDartAvg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";
  let nonOutshotScore = 0;
  let nonOutshotDarts = 0;

  const first9AvgByLeg = allLegs.flatMap((leg) => {
    const teamTurns = leg.history.filter((turn) => playerIds.has(turn.playerId));
    const firstTurns: Turn[] = [];
    let dartsCount = 0;

    for (const turn of teamTurns) {
      if (dartsCount >= 9) break;
      firstTurns.push(turn);
      dartsCount += turn.dartsThrown;
    }

    return firstTurns;
  });
  const first9Score = first9AvgByLeg.reduce((acc, turn) => acc + (turn.isBust ? 0 : turn.score), 0);
  const first9Darts = first9AvgByLeg.reduce((acc, turn) => acc + turn.dartsThrown, 0);
  const first9Avg = first9Darts > 0 ? ((first9Score / first9Darts) * 3).toFixed(1) : "0.0";

  const checkoutBuckets = {
    1: { attempts: 0, made: 0 },
    2: { attempts: 0, made: 0 },
    3: { attempts: 0, made: 0 },
  } as const;

  allLegs.forEach((leg) => {
    const teamScores: Record<string, number> = Object.fromEntries(
      Array.from(new Set(match.players.map((player) => player.teamId))).map((id) => [id, match.config.startingScore])
    );

    leg.history.forEach((turn, turnIndex) => {
      const turnTeamId = match.players.find((player) => player.id === turn.playerId)?.teamId;
      if (!turnTeamId) return;

      const remainingBeforeTurn = teamScores[turnTeamId];

      if (turnTeamId === teamId) {
        if (!isCheckoutOpportunity(remainingBeforeTurn, match.config.checkOut)) {
          nonOutshotScore += turn.isBust ? 0 : turn.score;
          nonOutshotDarts += turn.dartsThrown;
        }

        const minDarts = getMinDartsForScore(remainingBeforeTurn, match.config.checkOut);
        if (isCheckoutOpportunity(remainingBeforeTurn, match.config.checkOut) && minDarts >= 1 && minDarts <= 3) {
          checkoutBuckets[minDarts].attempts += 1;
          const isWinningTurn = leg.winnerId === teamId && turnIndex === leg.history.length - 1 && !turn.isBust;
          if (isWinningTurn) {
            checkoutBuckets[minDarts].made += 1;
          }
        }
      }

      if (!turn.isBust) {
        teamScores[turnTeamId] = turn.remainingAfter;
      }
    });
  });

  const totalCheckoutAttempts = checkoutBuckets[1].attempts + checkoutBuckets[2].attempts + checkoutBuckets[3].attempts;
  const totalCheckoutMade = checkoutBuckets[1].made + checkoutBuckets[2].made + checkoutBuckets[3].made;
  const nonOutshotAvg = nonOutshotDarts > 0 ? ((nonOutshotScore / nonOutshotDarts) * 3).toFixed(1) : "0.0";
  const checkoutPercent =
    totalCheckoutAttempts > 0
      ? ((totalCheckoutMade / totalCheckoutAttempts) * 100).toFixed(1) + "%"
      : "0.0%";
  const checkoutSummary = `${totalCheckoutMade}/${totalCheckoutAttempts} checkouts`;
  const checkoutBreakdown = [
    `1 dart: ${checkoutBuckets[1].made}/${checkoutBuckets[1].attempts}`,
    `2 darts: ${checkoutBuckets[2].made}/${checkoutBuckets[2].attempts}`,
    `3 darts: ${checkoutBuckets[3].made}/${checkoutBuckets[3].attempts}`,
  ];

  const checkouts = allLegs.filter((leg) => leg.winnerId === teamId);
  const highestCheckout = checkouts.reduce((max, leg) => {
    const lastTurn = leg.history[leg.history.length - 1];
    return lastTurn && !lastTurn.isBust && lastTurn.score > max ? lastTurn.score : max;
  }, 0);

  const legsConsideringCurrent = [...match.completedLegs];
  if (match.currentLeg.winnerId) {
    legsConsideringCurrent.push(match.currentLeg);
  }

  const teamLegs = legsConsideringCurrent.filter((leg) => leg.winnerId === teamId);
  const legDarts = teamLegs.map((leg) =>
    leg.history
      .filter((turn) => playerIds.has(turn.playerId))
      .reduce((acc, turn) => acc + turn.dartsThrown, 0)
  );

  const bestLegDarts = legDarts.length > 0 ? Math.min(...legDarts) : null;
  const worstLegDarts = legDarts.length > 0 ? Math.max(...legDarts) : null;
  const avgWinningLegDarts = legDarts.length > 0
    ? String(Math.round(legDarts.reduce((sum, darts) => sum + darts, 0) / legDarts.length))
    : "0";
  const highestScore = allTurns.reduce((max, turn) => (turn.score > max ? turn.score : max), 0);

  const scoreCounts = {
    c180: allTurns.filter((turn) => turn.score >= 171).length,
    c160: allTurns.filter((turn) => turn.score >= 152 && turn.score < 171).length,
    c140: allTurns.filter((turn) => turn.score >= 133 && turn.score < 152).length,
    c120: allTurns.filter((turn) => turn.score >= 114 && turn.score < 133).length,
    c100: allTurns.filter((turn) => turn.score >= 95 && turn.score < 114).length,
    c80: allTurns.filter((turn) => turn.score >= 76 && turn.score < 95).length,
    c60: allTurns.filter((turn) => turn.score >= 57 && turn.score < 76).length,
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
