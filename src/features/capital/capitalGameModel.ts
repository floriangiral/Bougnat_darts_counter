import type { CapitalDart, CapitalPlayerState, Player } from '../../../types';
import { CAPITAL_TARGETS, evaluateCapitalRound, shouldResolveCapitalRound } from '../../../utils/capitalLogic';

export type CapitalPendingResolution = {
  darts: CapitalDart[];
  playerId: string;
  target: typeof CAPITAL_TARGETS[number];
};

export type CapitalHistorySnapshot = {
  orderedPlayers: Player[];
  states: CapitalPlayerState[];
  currentPlayerIdx: number;
  currentDarts: CapitalDart[];
  pendingResolution: CapitalPendingResolution | null;
};

export type CapitalGameState = {
  orderedPlayers: Player[];
  states: CapitalPlayerState[];
  currentPlayerIdx: number;
  currentDarts: CapitalDart[];
  history: CapitalHistorySnapshot[];
  pendingResolution: CapitalPendingResolution | null;
};

export type CapitalGameAction =
  | { type: 'sync_rotation'; orderedPlayers: Player[]; currentPlayerIdx: number }
  | { type: 'set_starter'; currentPlayerIdx: number }
  | { type: 'add_dart'; dart: CapitalDart }
  | { type: 'resolve_round' }
  | { type: 'undo' };

const cloneCapitalDarts = (darts: CapitalDart[]) => darts.map((dart) => ({ ...dart }));

const cloneCapitalHistory = (history: CapitalPlayerState['history']) => history.map((entry) => ({
  ...entry,
  darts: cloneCapitalDarts(entry.darts),
}));

const cloneCapitalPlayerStates = (states: CapitalPlayerState[]) => states.map((state) => ({
  ...state,
  history: cloneCapitalHistory(state.history),
}));

const cloneCapitalOrderedPlayers = (players: Player[]) => players.map((player) => ({ ...player }));

const cloneCapitalSnapshot = (state: CapitalGameState): CapitalHistorySnapshot => ({
  orderedPlayers: cloneCapitalOrderedPlayers(state.orderedPlayers),
  states: cloneCapitalPlayerStates(state.states),
  currentPlayerIdx: state.currentPlayerIdx,
  currentDarts: cloneCapitalDarts(state.currentDarts),
  pendingResolution: state.pendingResolution
    ? {
        ...state.pendingResolution,
        darts: cloneCapitalDarts(state.pendingResolution.darts),
      }
    : null,
});

const createCapitalPlayerStates = (players: Player[]): CapitalPlayerState[] =>
  players.map((player) => ({
    id: player.id,
    name: player.name,
    score: 0,
    targetIndex: 0,
    history: [],
  }));

export const createInitialCapitalGameState = (orderedPlayers: Player[], currentPlayerIdx: number): CapitalGameState => ({
  orderedPlayers: cloneCapitalOrderedPlayers(orderedPlayers),
  states: createCapitalPlayerStates(orderedPlayers),
  currentPlayerIdx,
  currentDarts: [],
  history: [],
  pendingResolution: null,
});

export const capitalGameReducer = (state: CapitalGameState, action: CapitalGameAction): CapitalGameState => {
  switch (action.type) {
    case 'sync_rotation':
      return {
        ...state,
        orderedPlayers: cloneCapitalOrderedPlayers(action.orderedPlayers),
        currentPlayerIdx: action.currentPlayerIdx,
      };
    case 'set_starter':
      return {
        ...state,
        currentPlayerIdx: action.currentPlayerIdx,
      };
    case 'add_dart': {
      if (state.pendingResolution || state.currentDarts.length >= 3) {
        return state;
      }

      const currentPlayerId = state.orderedPlayers[state.currentPlayerIdx]?.id ?? state.states[0]?.id;
      const currentPlayer = state.states.find((entry) => entry.id === currentPlayerId);
      if (!currentPlayer) {
        return state;
      }

      const currentTarget = currentPlayer.targetIndex < CAPITAL_TARGETS.length
        ? CAPITAL_TARGETS[currentPlayer.targetIndex]
        : 'CAPITAL';
      const nextDarts = [...state.currentDarts, { ...action.dart }];
      const shouldResolve = shouldResolveCapitalRound(currentTarget, nextDarts);

      return {
        ...state,
        currentDarts: nextDarts,
        history: [...state.history, cloneCapitalSnapshot(state)],
        pendingResolution: shouldResolve
          ? {
              darts: cloneCapitalDarts(nextDarts),
              playerId: currentPlayer.id,
              target: currentTarget,
            }
          : null,
      };
    }
    case 'resolve_round': {
      if (!state.pendingResolution) {
        return state;
      }

      const { playerId, darts, target } = state.pendingResolution;
      const playerIndex = state.states.findIndex((entry) => entry.id === playerId);
      if (playerIndex < 0) {
        return {
          ...state,
          pendingResolution: null,
          currentDarts: [],
        };
      }

      const nextStates = cloneCapitalPlayerStates(state.states);
      const playerState = nextStates[playerIndex];
      const { newScore, pointsScored, isSuccess } = evaluateCapitalRound(target, darts, playerState.score);

      playerState.history.push({
        target,
        darts: cloneCapitalDarts(darts),
        pointsScored,
        isSuccess,
      });
      playerState.score = newScore;
      playerState.targetIndex += 1;

      return {
        ...state,
        states: nextStates,
        currentPlayerIdx: (state.currentPlayerIdx + 1) % state.orderedPlayers.length,
        currentDarts: [],
        pendingResolution: null,
      };
    }
    case 'undo': {
      if (state.history.length === 0) {
        return state;
      }

      const previousState = state.history[state.history.length - 1];
      return {
        orderedPlayers: cloneCapitalOrderedPlayers(previousState.orderedPlayers),
        states: cloneCapitalPlayerStates(previousState.states),
        currentPlayerIdx: previousState.currentPlayerIdx,
        currentDarts: cloneCapitalDarts(previousState.currentDarts),
        history: state.history.slice(0, -1),
        pendingResolution: previousState.pendingResolution
          ? {
              ...previousState.pendingResolution,
              darts: cloneCapitalDarts(previousState.pendingResolution.darts),
            }
          : null,
      };
    }
    default:
      return state;
  }
};

export const isCapitalGameOver = (states: CapitalPlayerState[]) => states.every((state) => state.targetIndex >= CAPITAL_TARGETS.length);

export const sortCapitalResults = (states: CapitalPlayerState[]) => [...states].sort((a, b) => b.score - a.score);