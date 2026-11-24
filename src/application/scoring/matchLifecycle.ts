// Spec: spec:counter/offline-scoring-terminal-foundation
import { GameConfig, LegState, MatchState, Player, Turn } from '../../../types';
import { isX01Bust } from '../../domain/scoring/x01CheckoutRules';
import { canX01VisitBust } from '../../domain/scoring/x01DeclaredBust';
import { isX01TeamOpened } from '../../domain/scoring/x01OpeningRules';
import { createId } from '../../shared/ids/createId';
import {
  isMultiSideSingles,
  resolveNextLegStarterIndex,
  resolveNextThrowerIndex,
  resolveNextUnplacedThrowerIndex,
  resolveSetOpeningStarterIndex,
} from './x01Rotation';

const clampStartingIndex = (players: Player[], index: number | undefined) =>
  Math.max(0, Math.min(players.length - 1, index ?? 0));

const getTeamIds = (players: Player[]) => Array.from(new Set(players.map((player) => player.teamId)));

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

const createLegState = (players: Player[], startingScore: number, startingPlayerIndex: number): LegState => {
  const leg: LegState = {
    scores: {},
    history: [],
    winnerId: null,
    startingPlayerIndex,
  };

  players.forEach((player) => {
    leg.scores[player.teamId] = startingScore;
  });

  return leg;
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
    id: createId(),
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
    ...match.config.teamStarterIds,
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
  // The starter is chosen once, before the first dart of the match; later legs follow the rotation.
  if (match.currentLeg.history.length > 0 || match.completedLegs.length > 0) return match;

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

  const nextIndex = clampStartingIndex(match.players, Number.parseInt(starterId, 10));
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

/** Spec 132 : un ordre de passage est imposé avant la première volée (3 ou 4 camps en simple). */
export const requiresThrowOrder = (match: MatchState): boolean => isMultiSideSingles(match.players, match.config);

const hasMatchProgress = (match: MatchState) => match.currentLeg.history.length > 0 || match.completedLegs.length > 0;

/**
 * Spec 132 (RM-01, RM-02) : applique l'ordre de passage validé (ids des joueurs, n° 1 en premier).
 * `players` est réordonné une seule fois et le n° 1 ouvre le match. Sans effet après la première volée
 * ou si la liste n'est pas une permutation exacte des joueurs.
 */
export const resolveMatchOrder = (match: MatchState, orderedPlayerIds: readonly string[]): MatchState => {
  if (!requiresThrowOrder(match) || hasMatchProgress(match)) return match;
  const players = orderedPlayerIds.map((id) => match.players.find((player) => player.id === id));
  const isPermutation = new Set(orderedPlayerIds).size === match.players.length
    && players.length === match.players.length
    && players.every((player) => player !== undefined);
  if (!isPermutation) return match;

  return {
    ...match,
    players,
    config: { ...match.config, initialStartingPlayerIndex: 0 },
    currentPlayerIndex: 0,
    currentLeg: { ...match.currentLeg, startingPlayerIndex: 0 },
  };
};

/** Camps classés, vainqueur du match en premier (spec 132). */
export const getPlacedTeamIds = (match: MatchState): string[] => {
  if (match.placement) return [...match.placement.finishedTeamIds];
  return match.matchWinnerId ? [match.matchWinnerId] : [];
};

/** Une place est en cours de jeu : le match a un vainqueur mais d'autres camps lancent encore. */
export const isPlacementRoundActive = (match: MatchState): boolean =>
  match.status === 'active' && Boolean(match.placement) && Boolean(match.matchWinnerId);

/** Spec 132 (RM-05) : il reste au moins deux camps non classés à départager après un match terminé. */
export const canPlayForNextPlace = (match: MatchState): boolean => {
  if (match.status !== 'finished' || !match.matchWinnerId || !requiresThrowOrder(match)) return false;
  return getTeamIds(match.players).length - getPlacedTeamIds(match).length >= 2;
};

/** Rang (à partir de 1) de la prochaine place à jouer. */
export const getNextPlaceRank = (match: MatchState): number => getPlacedTeamIds(match).length + 1;

/**
 * Spec 132 (RM-05, RM-06) : reprend la manche en cours pour la place suivante. Les camps classés ne
 * lancent plus ; le lanceur suivant est le prochain camp non classé après l'auteur de la dernière volée.
 */
export const startPlacementRound = (match: MatchState): MatchState => {
  if (!canPlayForNextPlace(match)) return match;
  const finishedTeamIds = getPlacedTeamIds(match);
  return {
    ...match,
    status: 'active',
    placement: { finishedTeamIds },
    currentPlayerIndex: resolveNextUnplacedThrowerIndex(match.players, match.currentPlayerIndex, finishedTeamIds),
  };
};

const recordPlacementOutcome = (nextMatch: MatchState, teamId: string): void => {
  const placed = [...getPlacedTeamIds(nextMatch), teamId];
  const unplaced = getTeamIds(nextMatch.players).filter((id) => !placed.includes(id));
  // Le dernier camp non classé prend automatiquement la dernière place.
  if (unplaced.length === 1) placed.push(unplaced[0]);
  nextMatch.placement = { finishedTeamIds: placed };
  nextMatch.status = 'finished';
};

const finishLeg = (match: MatchState, nextMatch: MatchState, teamId: string): void => {
  // Copies: the previous state stays untouched (undo snapshots, React state).
  nextMatch.legsWon = { ...nextMatch.legsWon };
  nextMatch.setsWon = { ...nextMatch.setsWon };
  nextMatch.currentLeg.winnerId = teamId;
  nextMatch.legsWon[teamId] += 1;

  let setJustCompleted = false;
  if (match.config.matchMode === 'SETS' && nextMatch.legsWon[teamId] === match.config.legsToWin) {
    setJustCompleted = true;
    nextMatch.setsWon[teamId] += 1;
    Object.keys(nextMatch.legsWon).forEach((tid) => (nextMatch.legsWon[tid] = 0));

    if (nextMatch.setsWon[teamId] === match.config.setsToWin) {
      nextMatch.status = 'finished';
      nextMatch.matchWinnerId = teamId;
    }
  } else if (match.config.matchMode !== 'SETS' && nextMatch.legsWon[teamId] === match.config.legsToWin) {
    nextMatch.status = 'finished';
    nextMatch.matchWinnerId = teamId;
  }

  if (nextMatch.status === 'finished') return;

  nextMatch.completedLegs = [...nextMatch.completedLegs, nextMatch.currentLeg];
  // WDF § 12.02: a new set is opened by the match opener (odd sets) or the other side (even sets).
  // Spec 132: with 3 or 4 sides, legs keep following the throwing order across sets.
  const nextStartingPlayerIndex = setJustCompleted && !isMultiSideSingles(match.players, match.config)
    ? resolveSetOpeningStarterIndex(
        match.players,
        match.config,
        nextMatch.completedLegs[0].startingPlayerIndex,
        Object.values(nextMatch.setsWon).reduce((total, sets) => total + sets, 0),
      )
    : resolveNextLegStarterIndex(match.players, match.config, match.currentLeg.startingPlayerIndex);
  nextMatch.currentLeg = createLegState(match.players, match.config.startingScore, nextStartingPlayerIndex);
  nextMatch.currentPlayerIndex = nextStartingPlayerIndex;
};

/** Volées jouées par une équipe (ou un joueur en simple) dans la manche en cours, trops compris. */
export const getTeamLegVisitCount = (match: MatchState, teamId: string): number => {
  const teamPlayerIds = new Set(match.players.filter((player) => player.teamId === teamId).map((player) => player.id));
  return match.currentLeg.history.filter((turn) => teamPlayerIds.has(turn.playerId)).length;
};

/**
 * Limite de volées par manche : quand chaque camp a joué ses volées sans fermer, la manche se
 * départage au plus près du bull (une fléchette chacun). Sans effet à un seul camp.
 */
/**
 * Camps concernés par le départage au bull : tous les camps, ou seulement les camps non classés
 * pendant le jeu d'une place (spec 132).
 */
export const getBullOffTeamIds = (match: MatchState): string[] => {
  const teamIds = getTeamIds(match.players);
  if (!isPlacementRoundActive(match)) return teamIds;
  const placed = getPlacedTeamIds(match);
  return teamIds.filter((teamId) => !placed.includes(teamId));
};

export const isLegVisitLimitReached = (match: MatchState): boolean => {
  const limit = match.config.maxVisitsPerLeg;
  if (!limit || match.status !== 'active') return false;
  // Pendant le jeu d'une place, la manche a déjà un vainqueur mais la limite reste due (spec 132).
  if (match.currentLeg.winnerId && !isPlacementRoundActive(match)) return false;
  const teamIds = getBullOffTeamIds(match);
  return teamIds.length > 1 && teamIds.every((teamId) => getTeamLegVisitCount(match, teamId) >= limit);
};

export const resolveLegByBullOff = (match: MatchState, winnerTeamId: string): MatchState => {
  if (!isLegVisitLimitReached(match) || !getBullOffTeamIds(match).includes(winnerTeamId)) return match;
  if (isPlacementRoundActive(match)) {
    const placedMatch: MatchState = { ...match };
    recordPlacementOutcome(placedMatch, winnerTeamId);
    return placedMatch;
  }

  const nextMatch: MatchState = {
    ...match,
    currentLeg: { ...match.currentLeg, decidedByBullOff: true },
  };
  finishLeg(match, nextMatch, winnerTeamId);
  return nextMatch;
};

const recordTurn = (match: MatchState, score: number, dartsThrown: number, declaredBust: boolean): MatchState => {
  if (isLegVisitLimitReached(match)) return match;
  const currentPlayer = match.players[match.currentPlayerIndex];
  const teamId = currentPlayer.teamId;
  const currentScore = match.currentLeg.scores[teamId];
  const remaining = currentScore - score;
  const isBust = declaredBust || isX01Bust(currentScore, score, match.config.checkOut);
  const turn: Turn = {
    playerId: currentPlayer.id,
    score: isBust ? 0 : score,
    isBust,
    remainingAfter: isBust ? currentScore : remaining,
    dartsThrown,
  };
  const newScores = { ...match.currentLeg.scores };
  if (!isBust) newScores[teamId] = remaining;

  const nextMatch: MatchState = {
    ...match,
    currentLeg: {
      ...match.currentLeg,
      history: [...match.currentLeg.history, turn],
      scores: newScores,
    },
  };

  if (isPlacementRoundActive(match)) {
    if (remaining === 0 && !isBust) recordPlacementOutcome(nextMatch, teamId);
    else nextMatch.currentPlayerIndex = resolveNextUnplacedThrowerIndex(match.players, match.currentPlayerIndex, getPlacedTeamIds(match));
  } else if (remaining === 0 && !isBust) {
    finishLeg(match, nextMatch, teamId);
  } else {
    nextMatch.currentPlayerIndex = resolveNextThrowerIndex(
      match.players,
      match.config,
      nextMatch.currentLeg.history,
      match.currentPlayerIndex,
    );
  }

  return nextMatch;
};

export const submitTurn = (match: MatchState, score: number, dartsThrown: number): MatchState =>
  recordTurn(match, score, dartsThrown, false);

export const canSubmitBustTurn = (match: MatchState): boolean => {
  const player = match.players[match.currentPlayerIndex];
  const legClosed = Boolean(match.currentLeg.winnerId) && !isPlacementRoundActive(match);
  if (match.status !== 'active' || legClosed || !player || isLegVisitLimitReached(match)) return false;
  return canX01VisitBust(match.currentLeg.scores[player.teamId], match.config.checkIn, match.config.checkOut, isX01TeamOpened(match, player.teamId));
};

/** Enregistre trois fléchettes seulement si une volée trop est possible. */
export const submitBustTurn = (match: MatchState): MatchState =>
  canSubmitBustTurn(match) ? recordTurn(match, 0, 3, true) : match;

export const undoTurn = (match: MatchState): MatchState => {
  if (match.currentLeg.history.length === 0) return match;

  const newHistory = match.currentLeg.history.slice(0, -1);
  const lastTurn = match.currentLeg.history.at(-1);
  if (!lastTurn) return match;
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

/**
 * Spec 045 (Q4) : une partie sauvegardée avant la correction peut laisser une équipe à 1 en
 * Master-Out, reste impossible à finir. La dernière visite qui a laissé 1 devient un trop
 * (score 0, reste de début de visite), comme le moteur l'aurait enregistrée.
 */
export const normalizeRestoredX01Match = (restored: MatchState): MatchState => {
  // The robot cannot attest an opening: a legacy robot match restored with a Double/Master-In plays Open-In.
  const match = restored.config.checkIn !== 'Open' && restored.players.some((player) => player.isBot)
    ? { ...restored, config: { ...restored.config, checkIn: 'Open' as const } }
    : restored;
  if (match.status !== 'active' || match.config.checkOut !== 'Master') return match;

  let history = match.currentLeg.history;
  const scores = { ...match.currentLeg.scores };
  let changed = false;

  for (const [teamId, remaining] of Object.entries(match.currentLeg.scores)) {
    if (remaining !== 1) continue;
    const teamPlayerIds = new Set(match.players.filter((player) => player.teamId === teamId).map((player) => player.id));
    const isTeamTurn = (turn: Turn) => teamPlayerIds.has(turn.playerId);
    let stuckTurnIndex = history.length - 1;
    while (stuckTurnIndex >= 0) {
      const turn = history[stuckTurnIndex];
      if (isTeamTurn(turn) && !turn.isBust && turn.score > 0 && turn.remainingAfter === 1) break;
      stuckTurnIndex -= 1;
    }
    if (stuckTurnIndex < 0) continue;

    const restoredScore = 1 + history[stuckTurnIndex].score;
    history = history.map((turn, index) => {
      if (index === stuckTurnIndex) return { ...turn, score: 0, isBust: true, remainingAfter: restoredScore };
      if (index > stuckTurnIndex && isTeamTurn(turn)) return { ...turn, remainingAfter: restoredScore };
      return turn;
    });
    scores[teamId] = restoredScore;
    changed = true;
  }

  return changed ? { ...match, currentLeg: { ...match.currentLeg, history, scores } } : match;
};
