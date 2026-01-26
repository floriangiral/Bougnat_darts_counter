import { GameConfig, MatchState, Player, LegState, Turn, InOutRule } from '../types';

export const createMatch = (players: Player[], config: GameConfig): MatchState => {
  const initialLeg: LegState = {
    scores: {},
    history: [],
    winnerId: null,
    startingPlayerIndex: 0,
  };

  players.forEach(p => {
    initialLeg.scores[p.id] = config.startingScore;
  });

  const legsWon: Record<string, number> = {};
  players.forEach(p => (legsWon[p.id] = 0));

  return {
    id: crypto.randomUUID(),
    config,
    players,
    legsWon,
    completedLegs: [],
    currentLeg: initialLeg,
    status: 'active',
    matchWinnerId: null,
    currentPlayerIndex: 0,
  };
};

const isBust = (
  currentScore: number,
  turnScore: number,
  checkOut: InOutRule
): boolean => {
  const remaining = currentScore - turnScore;

  if (remaining < 0) return true;
  if (remaining === 0) return false; // Potential checkout, validated elsewhere

  // If Double Out, you cannot leave yourself with 1
  if (checkOut === 'Double' && remaining === 1) return true;

  // If Master Out, you cannot leave yourself with 1 (Double or Triple needed)
  if (checkOut === 'Master' && remaining === 1) return true;

  return false;
};

// Check if the current throw sequence is a valid checkout
const isValidCheckout = (
  remaining: number,
  turnScore: number,
  checkOut: InOutRule
): boolean => {
  if (remaining - turnScore !== 0) return false;
  return true;
};

// Helper to determine minimum darts required for a score
export const getMinDartsForScore = (score: number): number => {
  if (score > 110) return 3; // Max 2-dart checkout is 110 (T20, Bull)
  if (score > 50) return 2;  // Max 1-dart checkout is 50 (Bull)
  return 1;
};

export const submitTurn = (
  match: MatchState,
  turnScore: number,
  dartsThrown: number = 3
): MatchState => {
  if (match.status === 'finished') return match;

  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentLeg = match.currentLeg;
  const currentScore = currentLeg.scores[currentPlayer.id];
  
  // 1. Calculate Bust
  const busted = isBust(currentScore, turnScore, match.config.checkOut);
  
  // 2. Determine new score
  let newScore = currentScore;
  let legWon = false;

  if (!busted) {
    newScore = currentScore - turnScore;
    if (newScore === 0) {
      legWon = isValidCheckout(currentScore, turnScore, match.config.checkOut);
    }
  }

  // 3. Update History
  const newTurn: Turn = {
    playerId: currentPlayer.id,
    score: turnScore,
    isBust: busted,
    remainingAfter: busted ? currentScore : newScore,
    dartsThrown: busted ? 3 : dartsThrown // If bust, always counts as 3 darts usually, or user specific logic? Standard is 3 unless specified, but for simplicity we assume 3 on bust/normal turn, and variable on checkout.
  };

  const newHistory = [...currentLeg.history, newTurn];
  
  // 4. Update Leg State
  const newLegScores = { ...currentLeg.scores, [currentPlayer.id]: newTurn.remainingAfter };

  let nextMatchState = { ...match };
  
  if (legWon) {
    // Handle Leg Win
    const newLegsWon = { ...match.legsWon, [currentPlayer.id]: match.legsWon[currentPlayer.id] + 1 };
    
    // Create the finished leg object to store in history
    const finishedLeg: LegState = { 
      ...currentLeg, 
      scores: newLegScores, 
      history: newHistory, 
      winnerId: currentPlayer.id 
    };

    const newCompletedLegs = [...match.completedLegs, finishedLeg];

    // Check Match Win
    if (newLegsWon[currentPlayer.id] >= match.config.legsToWin) {
      // Match Finished
      nextMatchState = {
        ...match,
        legsWon: newLegsWon,
        completedLegs: newCompletedLegs,
        currentLeg: finishedLeg, // Keep final state visible
        status: 'finished',
        matchWinnerId: currentPlayer.id
      };
    } else {
      // New Leg Setup
      const nextLegIndex = match.currentLeg.startingPlayerIndex + 1 < match.players.length 
        ? match.currentLeg.startingPlayerIndex + 1 
        : 0;

      const nextLeg: LegState = {
        scores: {},
        history: [],
        winnerId: null,
        startingPlayerIndex: nextLegIndex
      };
      match.players.forEach(p => nextLeg.scores[p.id] = match.config.startingScore);

      nextMatchState = {
        ...match,
        legsWon: newLegsWon,
        completedLegs: newCompletedLegs,
        currentLeg: nextLeg,
        currentPlayerIndex: nextLegIndex // Next leg starter
      };
    }
  } else {
    // Continue Leg
    const nextPlayerIndex = (match.currentPlayerIndex + 1) % match.players.length;
    nextMatchState = {
      ...match,
      currentLeg: {
        ...currentLeg,
        scores: newLegScores,
        history: newHistory
      },
      currentPlayerIndex: nextPlayerIndex
    };
  }

  return nextMatchState;
};

export const undoTurn = (match: MatchState): MatchState => {
  // Simplistic Undo: only works within the current leg for now
  if (match.currentLeg.history.length === 0) return match;

  const lastTurn = match.currentLeg.history[match.currentLeg.history.length - 1];
  const prevHistory = match.currentLeg.history.slice(0, -1);
  
  const targetPlayerId = lastTurn.playerId;
  const currentScore = match.currentLeg.scores[targetPlayerId];
  
  let restoredScore = currentScore;
  if (!lastTurn.isBust) {
    restoredScore = currentScore + lastTurn.score;
  }
  
  const newScores = { ...match.currentLeg.scores, [targetPlayerId]: restoredScore };

  // Restore active player to the one who just played
  const playerIndex = match.players.findIndex(p => p.id === targetPlayerId);

  return {
    ...match,
    currentLeg: {
      ...match.currentLeg,
      scores: newScores,
      history: prevHistory
    },
    currentPlayerIndex: playerIndex,
    status: 'active',
    matchWinnerId: null
  };
};

export const switchStartPlayer = (match: MatchState): MatchState => {
  if (match.currentLeg.history.length > 0) return match;

  const nextIndex = (match.currentPlayerIndex + 1) % match.players.length;

  return {
    ...match,
    currentPlayerIndex: nextIndex,
    currentLeg: {
      ...match.currentLeg,
      startingPlayerIndex: nextIndex
    }
  };
};

// --- STATISTICS ENGINE ---

export interface DetailedPlayerStats {
  threeDartAvg: string;
  first9Avg: string;
  checkoutPercent: string; // Placeholder for now as we don't track missed doubles
  highestCheckout: number;
  highestScore: number;
  bestLegDarts: number | null;
  worstLegDarts: number | null;
  scoreCounts: {
    c180: number;
    c160: number; // 160-179
    c140: number; // 140-159
    c120: number; // 120-139
    c100: number; // 100-119
    c80: number;  // 80-99
    c60: number;  // 60-79
    c40: number;  // 40-59
  };
  legsWon: number;
}

export const calculatePlayerStats = (match: MatchState, playerId: string) => {
  // Basic stats for the score card
  const calculateAvg = (turns: Turn[]) => {
    const playerTurns = turns.filter(t => t.playerId === playerId);
    if (playerTurns.length === 0) return 0.0;
    
    const totalScore = playerTurns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
    const totalDarts = playerTurns.reduce((acc, t) => acc + t.dartsThrown, 0);
    
    if (totalDarts === 0) return 0.0;
    return (totalScore / totalDarts) * 3;
  };

  const calculateTotalDarts = (turns: Turn[]) => {
      return turns
          .filter(t => t.playerId === playerId)
          .reduce((acc, t) => acc + t.dartsThrown, 0);
  }

  // Current Leg Stats
  const legAvg = calculateAvg(match.currentLeg.history);
  const legDarts = calculateTotalDarts(match.currentLeg.history);

  // Match Stats (All turns)
  const allLegs = [...match.completedLegs, match.currentLeg];
  const allTurns = allLegs.flatMap(l => l.history);
  
  const matchAvg = calculateAvg(allTurns);
  const matchDarts = calculateTotalDarts(allTurns);

  return {
    legAvg: legAvg.toFixed(1),
    legDarts,
    matchAvg: matchAvg.toFixed(1),
    matchDarts
  };
};

export const calculateDetailedStats = (match: MatchState, playerId: string): DetailedPlayerStats => {
  const allLegs = [...match.completedLegs, match.currentLeg];
  const allTurns = allLegs.flatMap(l => l.history).filter(t => t.playerId === playerId);

  // 1. Scoring Counts
  const counts = {
    c180: 0, c160: 0, c140: 0, c120: 0, c100: 0, c80: 0, c60: 0, c40: 0
  };
  let highestScore = 0;

  allTurns.forEach(t => {
    if (t.isBust) return; // Ignore bust scores for high scores? Usually yes.
    const s = t.score;
    if (s > highestScore) highestScore = s;

    if (s === 180) counts.c180++;
    else if (s >= 160) counts.c160++;
    else if (s >= 140) counts.c140++;
    else if (s >= 120) counts.c120++;
    else if (s >= 100) counts.c100++;
    else if (s >= 80) counts.c80++;
    else if (s >= 60) counts.c60++;
    else if (s >= 40) counts.c40++;
  });

  // 2. 3-Dart Average
  const totalScore = allTurns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
  const totalDarts = allTurns.reduce((acc, t) => acc + t.dartsThrown, 0);
  const threeDartAvg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";

  // 3. First 9 Avg
  let f9TotalScore = 0;
  let f9TotalDarts = 0;

  allLegs.forEach(leg => {
    const playerTurns = leg.history.filter(t => t.playerId === playerId);
    let dartsCounted = 0;
    for (const turn of playerTurns) {
      if (dartsCounted >= 9) break;
      f9TotalScore += turn.isBust ? 0 : turn.score;
      f9TotalDarts += turn.dartsThrown;
      dartsCounted += turn.dartsThrown;
    }
  });
  const first9Avg = f9TotalDarts > 0 ? ((f9TotalScore / f9TotalDarts) * 3).toFixed(1) : "0.0";

  // 4. Best/Worst Legs (Darts thrown in WON legs)
  let bestLeg: number | null = null;
  let worstLeg: number | null = null;
  let highestCheckout = 0;

  match.completedLegs.forEach(leg => {
    if (leg.winnerId === playerId) {
      // It's a won leg, count darts
      const darts = leg.history.filter(t => t.playerId === playerId).reduce((acc, t) => acc + t.dartsThrown, 0);
      
      if (bestLeg === null || darts < bestLeg) bestLeg = darts;
      if (worstLeg === null || darts > worstLeg) worstLeg = darts;

      // Check for checkout score (last turn)
      const lastTurn = leg.history[leg.history.length - 1];
      if (lastTurn && lastTurn.playerId === playerId) {
        if (lastTurn.score > highestCheckout) highestCheckout = lastTurn.score;
      }
    }
  });

  // 5. Checkout % (Placeholder logic: Legs Won / Legs Won + Legs Lost is NOT CO%, strictly it is N/A without input)
  // For MVP, we will show "N/A" unless we want to use Win %
  const legsWonCount = match.legsWon[playerId] || 0;
  // const legsPlayed = match.completedLegs.length; // Not accurate for CO%
  
  return {
    threeDartAvg,
    first9Avg,
    checkoutPercent: "N/A", // Requires dart-by-dart miss tracking
    highestCheckout,
    highestScore,
    bestLegDarts: bestLeg,
    worstLegDarts: worstLeg,
    scoreCounts: counts,
    legsWon: legsWonCount
  };
};