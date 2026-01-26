import { GameConfig, MatchState, Player, LegState, Turn, InOutRule } from '../types';

export const createMatch = (players: Player[], config: GameConfig): MatchState => {
  // Logic: In doubles, we have 4 players but only 2 scoring entities (teams).
  // In solo, teamId = playerId.
  
  const initialLeg: LegState = {
    scores: {},
    history: [],
    winnerId: null,
    startingPlayerIndex: 0,
  };

  const legsWon: Record<string, number> = {};
  const setsWon: Record<string, number> = {};

  // Initialize scores based on TEAM ID
  players.forEach(p => {
    // If multiple players have same teamId, this just overwrites/confirms the entry
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
  };
};

// Reorder players array: MatchStarter -> OtherTeamStarter -> MatchStarterPartner -> OtherTeamPartner
export const reorderPlayersForDoubles = (
    match: MatchState, 
    t1StarterId: string, 
    t2StarterId: string, 
    startingTeamId: string
): MatchState => {
    // Helper to find player by ID from the current list
    const getP = (id: string) => match.players.find(pl => pl.id === id)!;
    
    const t1Starter = getP(t1StarterId);
    const t2Starter = getP(t2StarterId);
    
    // Find partners
    const t1Partner = match.players.find(p => p.teamId === 'team1' && p.id !== t1StarterId)!;
    const t2Partner = match.players.find(p => p.teamId === 'team2' && p.id !== t2StarterId)!;

    let newOrder: Player[] = [];

    if (startingTeamId === 'team1') {
        // Team 1 Starts: T1S -> T2S -> T1P -> T2P
        newOrder = [t1Starter, t2Starter, t1Partner, t2Partner];
    } else {
        // Team 2 Starts: T2S -> T1S -> T2P -> T1P
        newOrder = [t2Starter, t1Starter, t2Partner, t1Partner];
    }
    
    return {
        ...match,
        players: newOrder,
        currentPlayerIndex: 0,
        currentLeg: {
            ...match.currentLeg,
            startingPlayerIndex: 0
        }
    };
};

const isBust = (
  currentScore: number,
  turnScore: number,
  checkOut: InOutRule
): boolean => {
  const remaining = currentScore - turnScore;

  if (remaining < 0) return true;
  if (remaining === 0) return false; 

  if (checkOut === 'Double' && remaining === 1) return true;
  if (checkOut === 'Master' && remaining === 1) return true;

  return false;
};

const isValidCheckout = (
  remaining: number,
  turnScore: number,
  checkOut: InOutRule
): boolean => {
  if (remaining - turnScore !== 0) return false;
  return true;
};

export const getMinDartsForScore = (score: number, checkOut: InOutRule = 'Double'): number => {
  if (score > 110) return 3; 
  
  if (checkOut === 'Double') {
      if (score > 110) return 3;
      if (score === 110) return 3; 
      if (score > 100) {
          if (score === 110) return 2; 
          if (score > 100) return 3;
      }
      
      if (score > 50) return 2;
      if (score === 50) return 1;
      if (score % 2 === 0 && score <= 40) return 1;
      return 2;
  } 
  else if (checkOut === 'Master') {
      if (score <= 40 && score % 2 === 0) return 1;
      if (score <= 60 && score % 3 === 0) return 1;
      if (score === 25 || score === 50) return 1;
      return 2;
  }
  else {
      if (score <= 60) return 1;
      if (score <= 120) return 2;
      return 3;
  }
};

export const submitTurn = (
  match: MatchState,
  turnScore: number,
  dartsThrown: number = 3
): MatchState => {
  if (match.status === 'finished') return match;

  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentTeamId = currentPlayer.teamId; // KEY CHANGE: Score by Team
  const currentLeg = match.currentLeg;
  const currentScore = currentLeg.scores[currentTeamId];
  
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
    dartsThrown: busted ? 3 : dartsThrown 
  };

  const newHistory = [...currentLeg.history, newTurn];
  
  // 4. Update Leg State (By Team ID)
  const newLegScores = { ...currentLeg.scores, [currentTeamId]: newTurn.remainingAfter };

  let nextMatchState = { ...match };
  
  if (legWon) {
    // --- LEG WON LOGIC (By Team ID) ---
    let newLegsWon = { ...match.legsWon, [currentTeamId]: match.legsWon[currentTeamId] + 1 };
    let newSetsWon = { ...match.setsWon };
    
    const finishedLeg: LegState = { 
      ...currentLeg, 
      scores: newLegScores, 
      history: newHistory, 
      winnerId: currentTeamId 
    };

    const newCompletedLegs = [...match.completedLegs, finishedLeg];
    
    let isMatchOver = false;

    if (match.config.matchMode === 'SETS') {
        if (newLegsWon[currentTeamId] >= match.config.legsToWin) {
            newSetsWon[currentTeamId] += 1;
            
            if (newSetsWon[currentTeamId] >= match.config.setsToWin) {
                isMatchOver = true;
            } else {
                Object.keys(newLegsWon).forEach(tid => newLegsWon[tid] = 0);
            }
        }
    } else {
        if (newLegsWon[currentTeamId] >= match.config.legsToWin) {
            isMatchOver = true;
        }
    }

    if (isMatchOver) {
      nextMatchState = {
        ...match,
        legsWon: newLegsWon,
        setsWon: newSetsWon,
        completedLegs: newCompletedLegs,
        currentLeg: finishedLeg, // Keep final state visible
        status: 'finished',
        matchWinnerId: currentTeamId
      };
    } else {
      const nextLegIndex = match.currentLeg.startingPlayerIndex + 1 < match.players.length 
        ? match.currentLeg.startingPlayerIndex + 1 
        : 0;

      const nextLeg: LegState = {
        scores: {},
        history: [],
        winnerId: null,
        startingPlayerIndex: nextLegIndex
      };
      // Initialize scores for all TEAMS
      const uniqueTeamIds = Array.from(new Set(match.players.map(p => p.teamId)));
      uniqueTeamIds.forEach(tid => nextLeg.scores[tid] = match.config.startingScore);

      nextMatchState = {
        ...match,
        legsWon: newLegsWon,
        setsWon: newSetsWon,
        completedLegs: newCompletedLegs,
        currentLeg: nextLeg,
        currentPlayerIndex: nextLegIndex
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
  if (match.currentLeg.history.length === 0) return match;

  const lastTurn = match.currentLeg.history[match.currentLeg.history.length - 1];
  const prevHistory = match.currentLeg.history.slice(0, -1);
  
  // Find which team this player belongs to
  const player = match.players.find(p => p.id === lastTurn.playerId);
  if (!player) return match;
  
  const currentTeamId = player.teamId;
  const currentScore = match.currentLeg.scores[currentTeamId];
  
  let restoredScore = currentScore;
  if (!lastTurn.isBust) {
    restoredScore = currentScore + lastTurn.score;
  }
  
  const newScores = { ...match.currentLeg.scores, [currentTeamId]: restoredScore };

  // Restore active player to the one who just played
  const playerIndex = match.players.findIndex(p => p.id === lastTurn.playerId);

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
  checkoutPercent: string; 
  highestCheckout: number;
  highestScore: number;
  bestLegDarts: number | null;
  worstLegDarts: number | null;
  scoreCounts: {
    c180: number; c160: number; c140: number; c120: number; c100: number; c80: number; c60: number; c40: number;
  };
  legsWon: number; 
}

// NOTE: stats are usually calculated per PLAYER for Averages, but per TEAM for Legs Won.
// We will pass teamId for "Legs Won" lookup, but playerId for "Throws".
export const calculatePlayerStats = (match: MatchState, playerId: string) => {
  const player = match.players.find(p => p.id === playerId);
  if (!player) return { legAvg: "0.0", legDarts: 0, matchAvg: "0.0", matchDarts: 0 };

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
    legAvgRaw: legAvg, // Keeping raw number for logic if needed
    matchAvg: matchAvg.toFixed(1),
    matchDarts
  };
};

export const calculateDetailedStats = (match: MatchState, playerId: string): DetailedPlayerStats => {
  const player = match.players.find(p => p.id === playerId);
  if (!player) return { threeDartAvg: "0.0", first9Avg: "0.0", checkoutPercent: "0", highestCheckout: 0, highestScore: 0, bestLegDarts: null, worstLegDarts: null, scoreCounts: { c180:0, c160:0, c140:0, c120:0, c100:0, c80:0, c60:0, c40:0 }, legsWon: 0 };

  const allLegs = [...match.completedLegs, match.currentLeg];
  const allTurns = allLegs.flatMap(l => l.history).filter(t => t.playerId === playerId);

  const counts = { c180: 0, c160: 0, c140: 0, c120: 0, c100: 0, c80: 0, c60: 0, c40: 0 };
  let highestScore = 0;

  allTurns.forEach(t => {
    if (t.isBust) return; 
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

  const totalScore = allTurns.reduce((acc, t) => acc + (t.isBust ? 0 : t.score), 0);
  const totalDarts = allTurns.reduce((acc, t) => acc + t.dartsThrown, 0);
  const threeDartAvg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";

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

  // Best/Worst Legs - BASED ON TEAM WIN
  let bestLeg: number | null = null;
  let worstLeg: number | null = null;
  let highestCheckout = 0;

  match.completedLegs.forEach(leg => {
    if (leg.winnerId === player.teamId) {
      // It's a won leg by this player's team
      // Count TEAM darts? Or Player Darts? usually Team Darts in doubles
      const teamDarts = leg.history
        .filter(t => {
            const p = match.players.find(pl => pl.id === t.playerId);
            return p?.teamId === player.teamId;
        })
        .reduce((acc, t) => acc + t.dartsThrown, 0);
      
      if (bestLeg === null || teamDarts < bestLeg) bestLeg = teamDarts;
      if (worstLeg === null || teamDarts > worstLeg) worstLeg = teamDarts;

      // Check for checkout score (last turn)
      const lastTurn = leg.history[leg.history.length - 1];
      if (lastTurn && lastTurn.playerId === playerId) {
        if (lastTurn.score > highestCheckout) highestCheckout = lastTurn.score;
      }
    }
  });

  const totalLegsWon = match.completedLegs.filter(l => l.winnerId === player.teamId).length + 
                       (match.legsWon[player.teamId] && match.config.matchMode === 'LEGS' ? 0 : 0);
  
  return {
    threeDartAvg,
    first9Avg,
    checkoutPercent: "N/A", 
    highestCheckout,
    highestScore,
    bestLegDarts: bestLeg,
    worstLegDarts: worstLeg,
    scoreCounts: counts,
    legsWon: totalLegsWon
  };
};