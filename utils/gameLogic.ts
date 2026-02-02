
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

export const createMatch = (players: Player[], config: GameConfig): MatchState => {
  const initialLeg: LegState = {
    scores: {},
    history: [],
    winnerId: null,
    startingPlayerIndex: 0,
  };

  const legsWon: Record<string, number> = {};
  const setsWon: Record<string, number> = {};

  players.forEach(p => {
    initialLeg.scores[p.teamId] = config.startingScore;
    legsWon[p.teamId] = 0;
    setsWon[p.teamId] = 0;
  });

  return {
    id: crypto.randomUUID(),
    config,
    players,
    legsWon,
    setsWon,
    completedLegs: [],
    currentLeg: initialLeg,
    status: 'active',
    matchWinnerId: null,
    currentPlayerIndex: 0,
    duration: 0,
  };
};

export const reorderPlayersForDoubles = (
    match: MatchState, 
    t1StarterId: string, 
    t2StarterId: string, 
    startingTeamId: string
): MatchState => {
    const getP = (id: string) => match.players.find(pl => pl.id === id)!;
    
    const t1Starter = getP(t1StarterId);
    const t2Starter = getP(t2StarterId);
    
    const t1Partner = match.players.find(p => p.teamId === 'team1' && p.id !== t1StarterId)!;
    const t2Partner = match.players.find(p => p.teamId === 'team2' && p.id !== t2StarterId)!;

    let newOrder: Player[] = [];

    if (startingTeamId === 'team1') {
        newOrder = [t1Starter, t2Starter, t1Partner, t2Partner];
    } else {
        newOrder = [t2Starter, t1Starter, t2Partner, t1Partner];
    }

    return {
        ...match,
        players: newOrder,
        currentPlayerIndex: 0
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
      const nextStartingPlayerIndex = (match.currentLeg.startingPlayerIndex + 1) % match.players.length;
      const nextLeg: LegState = {
        scores: {},
        history: [],
        winnerId: null,
        startingPlayerIndex: nextStartingPlayerIndex,
      };
      match.players.forEach(p => {
        nextLeg.scores[p.teamId] = match.config.startingScore;
      });
      nextMatch.completedLegs = [...nextMatch.completedLegs, nextMatch.currentLeg];
      nextMatch.currentLeg = nextLeg;
      nextMatch.currentPlayerIndex = nextStartingPlayerIndex;
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
