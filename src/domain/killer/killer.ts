import type { Player } from '../../../types';

export type KillerTarget = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 25;

export type KillerPhase = 'ASSIGN_TARGETS' | 'PLAYING' | 'FINISHED';

export type KillerPlayerState = {
  id: string;
  name: string;
  target: KillerTarget | null;
  lives: number;
  isKiller: boolean;
  isEliminated: boolean;
};

export type KillerState = {
  phase: KillerPhase;
  players: KillerPlayerState[];
  currentPlayerIndex: number;
  dartsInTurn: number;
  winnerId: string | null;
  log: string[];
};

export type KillerDartResult =
  | { type: 'MISS' }
  | { type: 'DOUBLE_HIT'; targetPlayerId: string };

export const KILLER_MAX_PLAYERS = 6;
export const KILLER_STARTING_LIVES = 3;
export const KILLER_TARGETS: KillerTarget[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

export const formatKillerTarget = (target: KillerTarget | null) => {
  if (target === null) return '-';
  return target === 25 ? 'Bull' : String(target);
};

export const createKillerState = (players: Player[], startingPlayerIndex = 0): KillerState => {
  // Spec ref: specs/017-counter-killer-game/spec.md (E1, invariants 1/5).
  if (players.length < 2 || players.length > KILLER_MAX_PLAYERS) {
    throw new Error('Killer se joue de 2 a 6 joueurs.');
  }

  return {
    phase: 'ASSIGN_TARGETS',
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      target: null,
      lives: KILLER_STARTING_LIVES,
      isKiller: false,
      isEliminated: false,
    })),
    currentPlayerIndex: Math.max(0, Math.min(startingPlayerIndex, players.length - 1)),
    dartsInTurn: 0,
    winnerId: null,
    log: ['Attribuez un numero unique a chaque joueur.'],
  };
};

export const assignKillerTarget = (state: KillerState, playerId: string, target: KillerTarget): KillerState => {
  // Spec ref: specs/017-counter-killer-game/spec.md (E2, invariant 2).
  if (state.phase !== 'ASSIGN_TARGETS') return state;
  if (state.players.some((player) => player.target === target && player.id !== playerId)) {
    return state;
  }

  const players = state.players.map((player) => (
    player.id === playerId ? { ...player, target } : player
  ));
  const allAssigned = players.every((player) => player.target !== null);
  const currentPlayerIndex = allAssigned ? 0 : findNextUnassignedPlayerIndex(players, state.currentPlayerIndex);

  return {
    ...state,
    phase: allAssigned ? 'PLAYING' : 'ASSIGN_TARGETS',
    players,
    currentPlayerIndex,
    log: [
      `${players.find((player) => player.id === playerId)?.name ?? 'Joueur'} prend le ${formatKillerTarget(target)}.`,
      ...state.log,
    ].slice(0, 5),
  };
};

export const recordKillerDart = (state: KillerState, result: KillerDartResult): KillerState => {
  // Spec ref: specs/017-counter-killer-game/spec.md (E3/E4/E5).
  if (state.phase !== 'PLAYING' || state.winnerId) return state;

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.isEliminated) {
    return advanceKillerTurn({ ...state, dartsInTurn: 3 });
  }

  const nextPlayers = state.players.map((player) => ({ ...player }));
  const actor = nextPlayers[state.currentPlayerIndex];
  let message = `${actor.name} rate.`;

  if (result.type === 'DOUBLE_HIT') {
    const targetPlayer = nextPlayers.find((player) => player.id === result.targetPlayerId);

    if (targetPlayer && !targetPlayer.isEliminated) {
      if (targetPlayer.id === actor.id) {
        if (actor.isKiller) {
          actor.lives = clampLives(actor.lives - 1);
          message = `${actor.name} touche son double et perd une vie.`;
        } else {
          actor.isKiller = true;
          actor.lives = clampLives(actor.lives + 1);
          message = `${actor.name} devient Killer.`;
        }
      } else if (actor.isKiller) {
        targetPlayer.lives = clampLives(targetPlayer.lives - 1);
        message = `${actor.name} touche ${targetPlayer.name}.`;
      } else {
        message = `${actor.name} n'est pas encore Killer.`;
      }
    }
  }

  const normalizedPlayers = nextPlayers.map((player) => ({
    ...player,
    isEliminated: player.lives <= 0,
  }));
  const alivePlayers = normalizedPlayers.filter((player) => !player.isEliminated);
  const winnerId = alivePlayers.length === 1 ? alivePlayers[0].id : null;

  if (winnerId) {
    return {
      ...state,
      phase: 'FINISHED',
      players: normalizedPlayers,
      winnerId,
      dartsInTurn: 0,
      log: [`${alivePlayers[0].name} gagne la partie.`, message, ...state.log].slice(0, 5),
    };
  }

  const nextDartsInTurn = normalizedPlayers[state.currentPlayerIndex]?.isEliminated ? 3 : state.dartsInTurn + 1;

  return advanceKillerTurn({
    ...state,
    players: normalizedPlayers,
    dartsInTurn: nextDartsInTurn,
    log: [message, ...state.log].slice(0, 5),
  });
};

const findNextUnassignedPlayerIndex = (players: KillerPlayerState[], currentIndex: number) => {
  const start = Math.max(0, currentIndex);
  const nextIndex = players.findIndex((player, index) => index >= start && player.target === null);
  if (nextIndex >= 0) return nextIndex;
  return Math.max(0, players.findIndex((player) => player.target === null));
};

const advanceKillerTurn = (state: KillerState): KillerState => {
  if (state.phase !== 'PLAYING') return state;
  if (state.dartsInTurn < 3) return state;

  return {
    ...state,
    dartsInTurn: 0,
    currentPlayerIndex: findNextAlivePlayerIndex(state.players, state.currentPlayerIndex),
  };
};

const findNextAlivePlayerIndex = (players: KillerPlayerState[], currentIndex: number) => {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const index = (currentIndex + offset) % players.length;
    if (!players[index].isEliminated) return index;
  }
  return currentIndex;
};

const clampLives = (value: number) => Math.max(0, Math.min(KILLER_STARTING_LIVES, value));
