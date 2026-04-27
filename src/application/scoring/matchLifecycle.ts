// Spec: spec:counter/offline-scoring-terminal-foundation
import { GameConfig, LegState, MatchState, Player, Turn } from '../../../types';

const clampStartingIndex = (players: Player[], index: number | undefined) =>
  Math.max(0, Math.min(players.length - 1, index ?? 0));

export const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const buildDoublesRotation = (
  players: Player[],
  teamStarterIds: Record<string, string>,
  startingTeamId: string,
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
    orderedPlayers.findIndex((player) => player.id === nextStartingPlayerId),
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
  config: GameConfig,
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

  orderedPlayers.forEach((player) => {
    initialLeg.scores[player.teamId] = config.startingScore;
    legsWon[player.teamId] = 0;
    setsWon[player.teamId] = 0;
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
  startingTeamId: string,
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
      initialStartingTeamId: startingTeamId as 'team1' | 'team2',
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
        initialStartingTeamId: starterId as 'team1' | 'team2',
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
        Object.keys(nextMatch.legsWon).forEach((tid) => (nextMatch.legsWon[tid] = 0));
        if (nextMatch.setsWon[teamId] === match.config.setsToWin) {
          nextMatch.status = 'finished';
          nextMatch.matchWinnerId = teamId;
        }
      }
    } else if (nextMatch.legsWon[teamId] === match.config.legsToWin) {
      nextMatch.status = 'finished';
      nextMatch.matchWinnerId = teamId;
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
  const playerIndex = match.players.findIndex((player) => player.id === lastTurn.playerId);
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
