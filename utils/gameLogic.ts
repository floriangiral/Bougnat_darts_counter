
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

  const orderedPlayers = buildDoublesRotation(match.players, match.config.teamStarterIds ?? {}, nextStartingTeamId);
  const nextLeg: LegState = {
    scores: {},
    history: [],
    winnerId: null,
    startingPlayerIndex: 0,
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
          nextMatch.currentPlayerIndex = 0;
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

export const calculateDetailedStats = (match: MatchState, playerId: string) => {
  const p = match.players.find(pl => pl.id === playerId);
  if (!p) return { threeDartAvg: "0.0", first9Avg: "0.0", checkoutPercent: "0.0%", highestCheckout: 0, highestScore: 0, bestLegDarts: null, worstLegDarts: null, scoreCounts: {} as any };
  
  const teamId = p.teamId;

  const allTurns = [...match.completedLegs, match.currentLeg].flatMap(l => l.history).filter(t => t.playerId === playerId);
  const totalScore = allTurns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
  const totalDarts = allTurns.reduce((acc, t) => acc + t.dartsThrown, 0);
  const threeDartAvg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";

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

  // Checkout % : Ratio Fléchettes Min / Fléchettes réelles sur les fermetures réussies
  let totalMinDartsFinish = 0;
  let totalActualDartsFinish = 0;

  [...match.completedLegs, match.currentLeg].forEach(leg => {
    if (leg.winnerId === teamId) {
       // Trouver la DERNIÈRE fléchette de ce joueur qui a fini le Leg
       const winningTurn = leg.history[leg.history.length - 1];
       if (winningTurn && winningTurn.playerId === playerId) {
          // Le score hit lors du dernier tour est le score de départ de la visite de fermeture
          const min = getMinDartsForScore(winningTurn.score, match.config.checkOut);
          totalMinDartsFinish += min;
          totalActualDartsFinish += winningTurn.dartsThrown;
       }
    }
  });

  const checkoutPercent = totalActualDartsFinish > 0 
      ? ((totalMinDartsFinish / totalActualDartsFinish) * 100).toFixed(1) + "%" 
      : "0.0%";

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

  const highestScore = allTurns.reduce((max, t) => (t.score > max ? t.score : max), 0);

  const scoreCounts = {
    c180: allTurns.filter(t => t.score === 180).length,
    c160: allTurns.filter(t => t.score >= 160 && t.score < 180).length,
    c140: allTurns.filter(t => t.score >= 140 && t.score < 160).length,
    c120: allTurns.filter(t => t.score >= 120 && t.score < 140).length,
    c100: allTurns.filter(t => t.score >= 100 && t.score < 120).length,
    c80: allTurns.filter(t => t.score >= 80 && t.score < 100).length,
    c60: allTurns.filter(t => t.score >= 60 && t.score < 80).length,
    c40: allTurns.filter(t => t.score >= 40 && t.score < 60).length,
  };

  return {
    threeDartAvg,
    first9Avg,
    checkoutPercent,
    highestCheckout,
    highestScore,
    bestLegDarts,
    worstLegDarts,
    scoreCounts
  };
};

export const calculateDetailedStatsForTeam = (match: MatchState, teamId: string) => {
  const teamPlayers = match.players.filter((player) => player.teamId === teamId);
  if (teamPlayers.length === 0) {
    return { threeDartAvg: "0.0", first9Avg: "0.0", checkoutPercent: "0.0%", highestCheckout: 0, highestScore: 0, bestLegDarts: null, worstLegDarts: null, scoreCounts: {} as any };
  }

  const playerIds = new Set(teamPlayers.map((player) => player.id));
  const allLegs = [...match.completedLegs, match.currentLeg];
  const allTurns = allLegs.flatMap((leg) => leg.history).filter((turn) => playerIds.has(turn.playerId));
  const totalScore = allTurns.reduce((acc, turn) => acc + (turn.isBust ? 0 : turn.score), 0);
  const totalDarts = allTurns.reduce((acc, turn) => acc + turn.dartsThrown, 0);
  const threeDartAvg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";

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

  let totalMinDartsFinish = 0;
  let totalActualDartsFinish = 0;

  allLegs.forEach((leg) => {
    if (leg.winnerId !== teamId) return;
    const winningTurn = leg.history[leg.history.length - 1];
    if (!winningTurn || !playerIds.has(winningTurn.playerId)) return;
    totalMinDartsFinish += getMinDartsForScore(winningTurn.score, match.config.checkOut);
    totalActualDartsFinish += winningTurn.dartsThrown;
  });

  const checkoutPercent =
    totalActualDartsFinish > 0
      ? ((totalMinDartsFinish / totalActualDartsFinish) * 100).toFixed(1) + "%"
      : "0.0%";

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
  const highestScore = allTurns.reduce((max, turn) => (turn.score > max ? turn.score : max), 0);

  const scoreCounts = {
    c180: allTurns.filter((turn) => turn.score === 180).length,
    c160: allTurns.filter((turn) => turn.score >= 160 && turn.score < 180).length,
    c140: allTurns.filter((turn) => turn.score >= 140 && turn.score < 160).length,
    c120: allTurns.filter((turn) => turn.score >= 120 && turn.score < 140).length,
    c100: allTurns.filter((turn) => turn.score >= 100 && turn.score < 120).length,
    c80: allTurns.filter((turn) => turn.score >= 80 && turn.score < 100).length,
    c60: allTurns.filter((turn) => turn.score >= 60 && turn.score < 80).length,
    c40: allTurns.filter((turn) => turn.score >= 40 && turn.score < 60).length,
  };

  return {
    threeDartAvg,
    first9Avg,
    checkoutPercent,
    highestCheckout,
    highestScore,
    bestLegDarts,
    worstLegDarts,
    scoreCounts,
  };
};
