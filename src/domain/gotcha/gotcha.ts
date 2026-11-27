import type { Player } from '../../../types';
import { isReachableTotal } from '../scoring/reachableTotals';

export type GotchaPlayerState = {
  id: string;
  name: string;
  score: number;
  history: GotchaTurn[];
};

export type GotchaTurn = {
  playerId: string;
  points: number;
  scoreBefore: number;
  scoreAfter: number;
  isBust: boolean;
  gotchaVictimIds: string[];
};

export type GotchaState = {
  targetScore: number;
  players: GotchaPlayerState[];
  currentPlayerIndex: number;
  winnerId: string | null;
  turnNumber: number;
  log: string[];
  /** Spec 136 : joueurs classés en jouant, dans l'ordre d'arrivée (vainqueur en premier). */
  placedIds?: string[];
  /** Spec 136 : absent = 'finished' s'il y a un vainqueur (ancien format), sinon 'playing'. */
  status?: GotchaStatus;
  /** Spec 136 : `false` tant que l'ordre de passage (au-delà de 2 joueurs) n'est pas validé ; absent = validé. */
  orderConfirmed?: boolean;
};

export type GotchaStatus = 'playing' | 'choosing' | 'finished';

export const GOTCHA_MAX_PLAYERS = 6;
export const GOTCHA_MAX_VISIT_SCORE = 180;
export const DEFAULT_GOTCHA_TARGET_SCORE = 301;

// Spec ref: specs/054-counter-impossible-totals-validation (RM-01, FR-01).
export const isGotchaVisitScoreReachable = (points: number): boolean => isReachableTotal(points, 3);

export const createGotchaState = (
  players: Player[],
  targetScore = DEFAULT_GOTCHA_TARGET_SCORE,
  startingPlayerIndex = 0,
): GotchaState => {
  // Spec ref: specs/019-counter-gotcha-game/spec.md (E1, invariants 1/2).
  if (players.length < 2 || players.length > GOTCHA_MAX_PLAYERS) {
    throw new Error('Gotcha se joue de 2 à 6 joueurs.');
  }
  if (targetScore <= 0) {
    throw new Error('Le score cible Gotcha doit être positif.');
  }

  return {
    targetScore,
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      score: 0,
      history: [],
    })),
    currentPlayerIndex: Math.max(0, Math.min(startingPlayerIndex, players.length - 1)),
    winnerId: null,
    turnNumber: 1,
    log: [`Objectif exact : ${targetScore}.`],
    placedIds: [],
    status: 'playing',
    orderConfirmed: players.length <= 2,
  };
};

export const isGotchaOrderPending = (state: GotchaState): boolean => state.orderConfirmed === false;

/**
 * Spec 136 : applique l'ordre de passage choisi. `orderedPlayers` doit être une permutation de
 * `state.players` (voir la façade, qui la construit avec `orderPlayers`).
 */
export const applyGotchaThrowOrder = (state: GotchaState, orderedPlayers: GotchaPlayerState[]): GotchaState => {
  if (!isGotchaOrderPending(state)) return state;
  const ids = new Set(orderedPlayers.map((player) => player.id));
  if (orderedPlayers.length !== state.players.length || state.players.some((player) => !ids.has(player.id))) {
    throw new Error("L'ordre de passage doit contenir chaque joueur une seule fois.");
  }
  return { ...state, players: orderedPlayers, currentPlayerIndex: 0, orderConfirmed: true };
};

// Spec ref: specs/136 (RM-G3, RM-G5, RM-G6) : compatibilité avec les parties sauvegardées sans ces champs.
export const getGotchaStatus = (state: GotchaState): GotchaStatus =>
  state.status ?? (state.winnerId ? 'finished' : 'playing');

export const getGotchaPlacedIds = (state: GotchaState): string[] => {
  if (state.placedIds) return state.placedIds;
  return state.winnerId ? [state.winnerId] : [];
};

export const isGotchaFinished = (state: GotchaState): boolean => getGotchaStatus(state) === 'finished';

export const isGotchaAwaitingPlacementChoice = (state: GotchaState): boolean =>
  getGotchaStatus(state) === 'choosing';

/** Spec 136 (RM-G1) : on poursuit la partie en cours pour la place suivante. */
export const continueGotchaForNextPlace = (state: GotchaState): GotchaState => {
  if (!isGotchaAwaitingPlacementChoice(state)) return state;
  return advanceGotchaTurn({ ...state, placedIds: getGotchaPlacedIds(state), status: 'playing' });
};

/** Spec 136 (RM-G4) : les non classés seront classés au score. */
export const finishGotchaPlacements = (state: GotchaState): GotchaState => {
  if (!isGotchaAwaitingPlacementChoice(state)) return state;
  return { ...state, placedIds: getGotchaPlacedIds(state), status: 'finished' };
};

export const recordGotchaTurn = (state: GotchaState, points: number): GotchaState => {
  // Spec ref: specs/019-counter-gotcha-game/spec.md (E2/E3/E4).
  if (getGotchaStatus(state) !== 'playing' || isGotchaOrderPending(state)) return state;
  if (!Number.isInteger(points) || points < 0 || points > GOTCHA_MAX_VISIT_SCORE) {
    return {
      ...state,
      log: [`Visite refusée : saisis un total entre 0 et ${GOTCHA_MAX_VISIT_SCORE}.`, ...state.log].slice(0, 6),
    };
  }
  if (!isGotchaVisitScoreReachable(points)) {
    return {
      ...state,
      log: ['Visite refusée : score impossible en 3 fléchettes.', ...state.log].slice(0, 6),
    };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const placedIds = getGotchaPlacedIds(state);
  if (!currentPlayer || placedIds.includes(currentPlayer.id)) return state;

  const scoreBefore = currentPlayer.score;
  const proposedScore = scoreBefore + points;
  const isBust = proposedScore > state.targetScore;

  if (isBust) {
    const turn = buildGotchaTurn(currentPlayer.id, points, scoreBefore, scoreBefore, true, []);
    const players = appendTurnToCurrentPlayer(state.players, currentPlayer.id, turn);

    return advanceGotchaTurn({
      ...state,
      players,
      log: [`${currentPlayer.name} casse. Score conservé : ${scoreBefore}.`, ...state.log].slice(0, 6),
    });
  }

  if (proposedScore === state.targetScore) {
    const turn = buildGotchaTurn(currentPlayer.id, points, scoreBefore, proposedScore, false, []);
    const players = appendTurnToCurrentPlayer(
      updatePlayerScore(state.players, currentPlayer.id, proposedScore),
      currentPlayer.id,
      turn,
    );

    const nextPlacedIds = [...placedIds, currentPlayer.id];
    const unplacedCount = state.players.length - nextPlacedIds.length;

    return {
      ...state,
      players,
      winnerId: state.winnerId ?? currentPlayer.id,
      placedIds: nextPlacedIds,
      status: unplacedCount >= 2 ? 'choosing' : 'finished',
      log: [`${currentPlayer.name} atteint ${state.targetScore}.`, ...state.log].slice(0, 6),
    };
  }

  const victimIds = proposedScore > 0
    ? state.players
      .filter((player) => (
        player.id !== currentPlayer.id && !placedIds.includes(player.id) && player.score === proposedScore
      ))
      .map((player) => player.id)
    : [];
  const turn = buildGotchaTurn(currentPlayer.id, points, scoreBefore, proposedScore, false, victimIds);
  let players = updatePlayerScore(state.players, currentPlayer.id, proposedScore);
  players = players.map((player) => (
    victimIds.includes(player.id) ? { ...player, score: 0 } : player
  ));
  players = appendTurnToCurrentPlayer(players, currentPlayer.id, turn);

  const victimNames = victimIds
    .map((id) => state.players.find((player) => player.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return advanceGotchaTurn({
    ...state,
    players,
    log: [
      victimIds.length > 0
        ? `${currentPlayer.name} fait Gotcha sur ${victimNames}.`
        : `${currentPlayer.name} monte à ${proposedScore}.`,
      ...state.log,
    ].slice(0, 6),
  });
};

const buildGotchaTurn = (
  playerId: string,
  points: number,
  scoreBefore: number,
  scoreAfter: number,
  isBust: boolean,
  gotchaVictimIds: string[],
): GotchaTurn => ({
  playerId,
  points,
  scoreBefore,
  scoreAfter,
  isBust,
  gotchaVictimIds,
});

const updatePlayerScore = (players: GotchaPlayerState[], playerId: string, score: number) =>
  players.map((player) => (player.id === playerId ? { ...player, score } : player));

const appendTurnToCurrentPlayer = (players: GotchaPlayerState[], playerId: string, turn: GotchaTurn) =>
  players.map((player) => (
    player.id === playerId ? { ...player, history: [...player.history, turn] } : player
  ));

// Spec 136 (RM-G2) : les joueurs classés sortent de la rotation.
const advanceGotchaTurn = (state: GotchaState): GotchaState => {
  const placed = new Set(getGotchaPlacedIds(state));
  const count = state.players.length;
  let nextIndex = (state.currentPlayerIndex + 1) % count;
  for (let step = 1; step < count && placed.has(state.players[nextIndex].id); step += 1) {
    nextIndex = (nextIndex + 1) % count;
  }
  return { ...state, currentPlayerIndex: nextIndex, turnNumber: state.turnNumber + 1 };
};
