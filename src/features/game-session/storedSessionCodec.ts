// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-05) — compact storage of undo steps.
// Along a game, completed X01 legs and per-player histories (Cricket darts, Capital rounds, Gotcha
// visits) only grow: in every undo step they are a prefix of the current game. On write, each step
// keeps only the length of that prefix, and only the last PERSISTED_UNDO_LIMIT steps are kept; on
// read, the prefixes are rebuilt from the current game before validation. An inconsistent length
// yields an invalid step, so the session is rejected by the validators.
import {
  PERSISTED_UNDO_LIMIT,
  type GameRuntimeSnapshot,
  type MatchRuntimeSnapshot,
  type PersistedAppSession,
  type TriathlonStageRuntime,
} from '../../shared/session/persistedAppSession';
import { isNonNegativeInteger, isRecord } from '../../shared/validation/guards';

type WithHistory = { history: unknown[] };

const compactPlayers = <T extends WithHistory>(players: T[]): T[] =>
  players.map((player) => ({ ...player, history: [], historyLength: player.history.length }));

const lastSteps = <T>(steps: T[]): T[] => steps.slice(-PERSISTED_UNDO_LIMIT);

const encodeMatchRuntime = (runtime: MatchRuntimeSnapshot): MatchRuntimeSnapshot => {
  if (!runtime.undoStack) return runtime;
  return {
    ...runtime,
    undoStack: lastSteps(runtime.undoStack).map((step) => ({
      ...step,
      match: { ...step.match, completedLegs: [] },
      completedLegsCount: step.match.completedLegs.length,
    })),
  };
};

const encodeGameRuntime = (runtime: GameRuntimeSnapshot): GameRuntimeSnapshot => {
  switch (runtime.gameType) {
    case 'CRICKET':
      return {
        ...runtime,
        state: {
          ...runtime.state,
          history: lastSteps(runtime.state.history).map((step) => ({
            ...step,
            states: compactPlayers(step.states),
            aggregateStats: compactPlayers(step.aggregateStats),
          })),
        },
      };
    case 'CAPITAL':
      return {
        ...runtime,
        state: { ...runtime.state, history: lastSteps(runtime.state.history).map((step) => ({ ...step, states: compactPlayers(step.states) })) },
      };
    case 'GOTCHA':
      // Newest first: the first entries are the most recent steps.
      return {
        ...runtime,
        history: runtime.history.slice(0, PERSISTED_UNDO_LIMIT).map((step) => ({ ...step, players: compactPlayers(step.players) })),
      };
    case 'KILLER':
      return { ...runtime, history: runtime.history.slice(0, PERSISTED_UNDO_LIMIT) };
    case 'TRIATHLON':
      return { ...runtime, stage: runtime.stage ? encodeTriathlonStage(runtime.stage) : null };
  }
};

const encodeTriathlonStage = (stage: TriathlonStageRuntime): TriathlonStageRuntime => {
  switch (stage.phase) {
    case 'CAPITAL':
      return { ...stage, runtime: encodeGameRuntime(stage.runtime) as typeof stage.runtime };
    case 'CRICKET':
      return { ...stage, runtime: encodeGameRuntime(stage.runtime) as typeof stage.runtime };
    default:
      return { ...stage, runtime: encodeMatchRuntime(stage.runtime) };
  }
};

/** Session as written to storage: bounded, compact undo steps. */
export const encodeSessionForStorage = (session: PersistedAppSession): PersistedAppSession => ({
  ...session,
  matchRuntime: session.matchRuntime ? encodeMatchRuntime(session.matchRuntime) : session.matchRuntime,
  ...(session.gameRuntime ? { gameRuntime: encodeGameRuntime(session.gameRuntime) } : {}),
});

// --- Read side: works on untrusted JSON, validation happens afterwards. ---

const expandPlayers = (players: unknown, currentPlayers: unknown): unknown => {
  if (!Array.isArray(players) || !Array.isArray(currentPlayers)) return players;
  return players.map((player: unknown) => {
    if (!isRecord(player) || !('historyLength' in player)) return player;
    const { historyLength, ...rest } = player;
    const current: unknown = currentPlayers.find((entry: unknown) => isRecord(entry) && entry.id === player.id);
    if (!isNonNegativeInteger(historyLength) || !isRecord(current) || !Array.isArray(current.history) || historyLength > current.history.length) {
      return null;
    }
    return { ...rest, history: current.history.slice(0, historyLength) };
  });
};

const mapSteps = (steps: unknown, expand: (step: Record<string, unknown>) => unknown): unknown =>
  (Array.isArray(steps) ? steps.map((step: unknown) => (isRecord(step) ? expand(step) : step)) : steps);

const decodeMatchRuntime = (runtime: unknown): unknown => {
  if (!isRecord(runtime) || !isRecord(runtime.match) || !Array.isArray(runtime.match.completedLegs)) return runtime;
  const legs: unknown[] = runtime.match.completedLegs;
  return {
    ...runtime,
    undoStack: mapSteps(runtime.undoStack, (step) => {
      if (!('completedLegsCount' in step)) return step;
      const { completedLegsCount, ...rest } = step;
      if (!isNonNegativeInteger(completedLegsCount) || completedLegsCount > legs.length || !isRecord(rest.match)) return null;
      return { ...rest, match: { ...rest.match, completedLegs: legs.slice(0, completedLegsCount) } };
    }),
  };
};

const decodeStateHistory = (runtime: Record<string, unknown>, playerKeys: string[]): unknown => {
  const state = runtime.state;
  if (!isRecord(state)) return runtime;
  const history = mapSteps(state.history, (step) => {
    const expanded: Record<string, unknown> = { ...step };
    playerKeys.forEach((key) => {
      expanded[key] = expandPlayers(step[key], state[key]);
    });
    return expanded;
  });
  return { ...runtime, state: { ...state, history } };
};

const decodeGameRuntime = (runtime: unknown): unknown => {
  if (!isRecord(runtime)) return runtime;
  switch (runtime.gameType) {
    case 'CRICKET':
      return decodeStateHistory(runtime, ['states', 'aggregateStats']);
    case 'CAPITAL':
      return decodeStateHistory(runtime, ['states']);
    case 'GOTCHA':
      return isRecord(runtime.state)
        ? { ...runtime, history: mapSteps(runtime.history, (step) => ({ ...step, players: expandPlayers(step.players, (runtime.state as Record<string, unknown>).players) })) }
        : runtime;
    case 'TRIATHLON': {
      const stage = runtime.stage;
      if (!isRecord(stage)) return runtime;
      const decodedStage = stage.phase === 'CAPITAL' || stage.phase === 'CRICKET'
        ? decodeGameRuntime(stage.runtime)
        : decodeMatchRuntime(stage.runtime);
      return { ...runtime, stage: { ...stage, runtime: decodedStage } };
    }
    default:
      return runtime;
  }
};

/** Rebuilds the compact undo steps of a stored session (before its validation). */
export const decodeStoredSession = (raw: Record<string, unknown>): Record<string, unknown> => ({
  ...raw,
  matchRuntime: decodeMatchRuntime(raw.matchRuntime),
  ...(raw.gameRuntime === undefined ? {} : { gameRuntime: decodeGameRuntime(raw.gameRuntime) }),
});
