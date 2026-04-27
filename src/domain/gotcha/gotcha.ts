import type { Player } from '../../../types';

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
};

export const GOTCHA_MAX_PLAYERS = 6;
export const GOTCHA_MAX_VISIT_SCORE = 180;
export const DEFAULT_GOTCHA_TARGET_SCORE = 301;

export const createGotchaState = (
  players: Player[],
  targetScore = DEFAULT_GOTCHA_TARGET_SCORE,
  startingPlayerIndex = 0,
): GotchaState => {
  // Spec ref: specs/019-counter-gotcha-game/spec.md (E1, invariants 1/2).
  if (players.length < 2 || players.length > GOTCHA_MAX_PLAYERS) {
    throw new Error('Gotcha se joue de 2 a 6 joueurs.');
  }
  if (targetScore <= 0) {
    throw new Error('Le score cible Gotcha doit etre positif.');
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
  };
};

export const recordGotchaTurn = (state: GotchaState, points: number): GotchaState => {
  // Spec ref: specs/019-counter-gotcha-game/spec.md (E2/E3/E4).
  if (state.winnerId) return state;
  if (!Number.isInteger(points) || points < 0 || points > GOTCHA_MAX_VISIT_SCORE) {
    return {
      ...state,
      log: [`Visite refusee : saisis un total entre 0 et ${GOTCHA_MAX_VISIT_SCORE}.`, ...state.log].slice(0, 6),
    };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return state;

  const scoreBefore = currentPlayer.score;
  const proposedScore = scoreBefore + points;
  const isBust = proposedScore > state.targetScore;

  if (isBust) {
    const turn = buildGotchaTurn(currentPlayer.id, points, scoreBefore, scoreBefore, true, []);
    const players = appendTurnToCurrentPlayer(state.players, currentPlayer.id, turn);

    return advanceGotchaTurn({
      ...state,
      players,
      log: [`${currentPlayer.name} casse. Score conserve : ${scoreBefore}.`, ...state.log].slice(0, 6),
    });
  }

  if (proposedScore === state.targetScore) {
    const turn = buildGotchaTurn(currentPlayer.id, points, scoreBefore, proposedScore, false, []);
    const players = appendTurnToCurrentPlayer(
      updatePlayerScore(state.players, currentPlayer.id, proposedScore),
      currentPlayer.id,
      turn,
    );

    return {
      ...state,
      players,
      winnerId: currentPlayer.id,
      log: [`${currentPlayer.name} atteint ${state.targetScore}.`, ...state.log].slice(0, 6),
    };
  }

  const victimIds = proposedScore > 0
    ? state.players
      .filter((player) => player.id !== currentPlayer.id && player.score === proposedScore)
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
        : `${currentPlayer.name} monte a ${proposedScore}.`,
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

const advanceGotchaTurn = (state: GotchaState): GotchaState => ({
  ...state,
  currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  turnNumber: state.turnNumber + 1,
});
