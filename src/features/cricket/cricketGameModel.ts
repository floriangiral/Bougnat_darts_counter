import type { CricketMatchSummary, CricketPlayerState, CricketTarget, GameConfig, Player } from '../../../types';
import {
  checkCricketWin,
  haveAllPlayersReachedCricketRoundLimit,
  initCricketState,
  processCricketHit,
  resolveCricketWinnerOnRounds,
} from '../../../utils/cricketLogic';

export type CricketHistorySnapshot = {
  states: CricketPlayerState[];
  aggregateStats: CricketPlayerState[];
  currentThrowerIdx: number;
  turnDartsThrown: number;
  orderedPlayers: Player[];
  winnerId: string | null;
};

export type CricketCompetitor = {
  id: string;
  name: string;
  memberNames: string[];
};

export const cloneCricketStates = (states: CricketPlayerState[]): CricketPlayerState[] =>
  states.map((state) => ({
    ...state,
    marks: { ...state.marks },
    history: state.history.map((entry) => ({ ...entry })),
  }));

export const clonePlayers = (players: Player[]): Player[] =>
  players.map((player) => ({ ...player }));

export const buildCricketHistorySnapshot = (
  states: CricketPlayerState[],
  aggregateStats: CricketPlayerState[],
  currentThrowerIdx: number,
  turnDartsThrown: number,
  orderedPlayers: Player[],
  winnerId: string | null,
): CricketHistorySnapshot => ({
  states: cloneCricketStates(states),
  aggregateStats: cloneCricketStates(aggregateStats),
  currentThrowerIdx,
  turnDartsThrown,
  orderedPlayers: clonePlayers(orderedPlayers),
  winnerId,
});

export const buildCricketCompetitors = (players: Player[], isDoubles: boolean): CricketCompetitor[] => {
  if (!isDoubles) {
    return players.map((player) => ({
      id: player.id,
      name: player.name,
      memberNames: [player.name],
    }));
  }

  const groups = players.reduce<Record<string, string[]>>((accumulator, player) => {
    accumulator[player.teamId] = accumulator[player.teamId] || [];
    accumulator[player.teamId].push(player.name);
    return accumulator;
  }, {});

  return Object.entries(groups).map(([teamId, memberNames], index) => ({
    id: teamId,
    name: `Équipe ${index + 1}`,
    memberNames,
  }));
};

export const initAggregateCricketStats = (competitors: CricketCompetitor[]): CricketPlayerState[] =>
  competitors.map((competitor) => ({
    ...initCricketState([{ id: competitor.id, name: competitor.name, teamId: competitor.id }])[0],
  }));

export const appendAggregateCricketHit = (
  previous: CricketPlayerState[],
  competitorId: string,
  target: CricketTarget | null,
  multiplier: 1 | 2 | 3,
  pointsScored: number,
  isMiss: boolean,
) =>
  previous.map((entry) => {
    if (entry.id !== competitorId) {
      return entry;
    }

    const nextMarks = { ...entry.marks };
    if (target !== null) {
      nextMarks[target] += multiplier;
    }

    return {
      ...entry,
      score: entry.score + pointsScored,
      dartsThrown: entry.dartsThrown + 1,
      marks: nextMarks,
      history: [
        ...entry.history,
        {
          target,
          multiplier,
          isMiss,
          pointsScored,
        },
      ],
    };
  });

export const buildCricketMatchSummary = (
  competitors: CricketPlayerState[],
  winnerId: string | null,
  config: GameConfig,
  memberNamesByCompetitor: Record<string, string[]>,
  legsWon: Record<string, number>,
  setsWon: Record<string, number>,
  currentSetLegsWon: Record<string, number>,
): CricketMatchSummary => ({
  competitors,
  legsWon,
  setsWon,
  currentSetLegsWon,
  winnerId,
  config,
  isDoubles: config.isDoubles,
  memberNamesByCompetitor,
});

export const advanceCricketTurn = (turnDartsThrown: number, orderedPlayersLength: number, dartsAdded = 1) => {
  const nextDartsThrown = turnDartsThrown + dartsAdded;

  if (nextDartsThrown >= 3) {
    return {
      nextTurnDartsThrown: 0,
      shouldAdvanceThrower: true,
      nextThrowerOffset: orderedPlayersLength > 0 ? 1 % orderedPlayersLength : 0,
    };
  }

  return {
    nextTurnDartsThrown: nextDartsThrown,
    shouldAdvanceThrower: false,
    nextThrowerOffset: 0,
  };
};
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-01) and spec 058 (O1):
// the whole Cricket game lives in one JSON-serializable state driven by a pure reducer, so it
// can be published, persisted and restored after a reload (undo stack included).
export type CricketGameState = {
  orderedPlayers: Player[];
  states: CricketPlayerState[];
  aggregateStats: CricketPlayerState[];
  currentThrowerIdx: number;
  turnDartsThrown: number;
  /** Undo stack, oldest first. */
  history: CricketHistorySnapshot[];
  winnerId: string | null;
  isFinished: boolean;
  hasGameStarted: boolean;
  startingCompetitorId: string | null;
  isDoubles: boolean;
  roundsLimit: number;
};

type CricketRotation = {
  orderedPlayers: Player[];
  currentThrowerIdx: number;
  startingCompetitorId: string | null;
};

export type CricketGameAction =
  | ({ type: 'sync_rotation' } & CricketRotation)
  | ({ type: 'start' } & CricketRotation)
  | { type: 'hit'; target: CricketTarget; multiplier: 1 | 2 | 3 }
  | { type: 'misses'; count: number }
  | { type: 'undo' };

export const createInitialCricketGameState = ({
  competitors,
  rotation,
  hasGameStarted,
  isDoubles,
  roundsLimit,
}: {
  competitors: CricketCompetitor[];
  rotation: CricketRotation;
  hasGameStarted: boolean;
  isDoubles: boolean;
  roundsLimit: number;
}): CricketGameState => ({
  orderedPlayers: clonePlayers(rotation.orderedPlayers),
  states: initCricketState(competitors.map((competitor) => ({ id: competitor.id, name: competitor.name, teamId: competitor.id }))),
  aggregateStats: initAggregateCricketStats(competitors),
  currentThrowerIdx: rotation.currentThrowerIdx,
  turnDartsThrown: 0,
  history: [],
  winnerId: null,
  isFinished: false,
  hasGameStarted,
  startingCompetitorId: rotation.startingCompetitorId,
  isDoubles,
  roundsLimit,
});

export const getCricketCurrentCompetitorId = (state: CricketGameState): string => {
  const thrower = state.orderedPlayers[state.currentThrowerIdx];
  return state.isDoubles ? thrower.teamId : thrower.id;
};

const pushCricketHistory = (state: CricketGameState): CricketHistorySnapshot[] => [
  ...state.history,
  buildCricketHistorySnapshot(state.states, state.aggregateStats, state.currentThrowerIdx, state.turnDartsThrown, state.orderedPlayers, state.winnerId),
];

const advanceCricketThrower = (state: CricketGameState, dartsAdded: number): CricketGameState => {
  const transition = advanceCricketTurn(state.turnDartsThrown, state.orderedPlayers.length, dartsAdded);
  return {
    ...state,
    turnDartsThrown: transition.nextTurnDartsThrown,
    currentThrowerIdx: transition.shouldAdvanceThrower
      ? (state.currentThrowerIdx + transition.nextThrowerOffset) % state.orderedPlayers.length
      : state.currentThrowerIdx,
  };
};

// The game freezes on its end screen; the result is only sent on confirmation (spec 047).
const finishCricketGame = (state: CricketGameState, winnerId: string | null): CricketGameState => ({
  ...state,
  winnerId,
  isFinished: true,
});

const recordCricketHit = (state: CricketGameState, target: CricketTarget, multiplier: 1 | 2 | 3): CricketGameState => {
  const competitorId = getCricketCurrentCompetitorId(state);
  const result = processCricketHit(state.states, competitorId, target, multiplier);
  const aggregateStats = appendAggregateCricketHit(state.aggregateStats, competitorId, target, multiplier, result.pointsScored, false);
  const next: CricketGameState = { ...state, history: pushCricketHistory(state), states: result.newStates, aggregateStats };

  const winnerId = checkCricketWin(result.newStates);
  if (winnerId) return finishCricketGame(next, winnerId);
  if (haveAllPlayersReachedCricketRoundLimit(result.newStates, state.roundsLimit)) {
    return finishCricketGame(next, resolveCricketWinnerOnRounds(aggregateStats));
  }
  return advanceCricketThrower(next, 1);
};

const recordCricketMisses = (state: CricketGameState, requestedMissCount: number): CricketGameState => {
  const missCount = Math.max(1, Math.min(requestedMissCount, 3 - state.turnDartsThrown));
  const competitorId = getCricketCurrentCompetitorId(state);
  const states = state.states.map((entry) => (entry.id === competitorId
    ? {
        ...entry,
        dartsThrown: entry.dartsThrown + missCount,
        history: [
          ...entry.history,
          ...Array.from({ length: missCount }, () => ({ target: null, multiplier: 1 as const, isMiss: true, pointsScored: 0 })),
        ],
      }
    : entry));

  let aggregateStats = state.aggregateStats;
  for (let index = 0; index < missCount; index += 1) {
    aggregateStats = appendAggregateCricketHit(aggregateStats, competitorId, null, 1, 0, true);
  }

  const next: CricketGameState = { ...state, history: pushCricketHistory(state), states, aggregateStats };
  if (haveAllPlayersReachedCricketRoundLimit(states, state.roundsLimit)) {
    return finishCricketGame(next, resolveCricketWinnerOnRounds(aggregateStats));
  }
  return advanceCricketThrower(next, missCount);
};

const undoCricketAction = (state: CricketGameState): CricketGameState => {
  const previous = state.history.at(-1);
  if (!previous) return state;
  return {
    ...state,
    states: previous.states,
    aggregateStats: previous.aggregateStats,
    currentThrowerIdx: previous.currentThrowerIdx,
    turnDartsThrown: previous.turnDartsThrown,
    orderedPlayers: previous.orderedPlayers,
    winnerId: previous.winnerId,
    isFinished: false,
    history: state.history.slice(0, -1),
  };
};

export const cricketGameReducer = (state: CricketGameState, action: CricketGameAction): CricketGameState => {
  switch (action.type) {
    case 'sync_rotation':
      if (state.hasGameStarted) return state;
      return {
        ...state,
        orderedPlayers: clonePlayers(action.orderedPlayers),
        currentThrowerIdx: action.currentThrowerIdx,
        startingCompetitorId: action.startingCompetitorId,
      };
    case 'start':
      return {
        ...state,
        orderedPlayers: clonePlayers(action.orderedPlayers),
        currentThrowerIdx: action.currentThrowerIdx,
        startingCompetitorId: action.startingCompetitorId,
        hasGameStarted: true,
      };
    case 'hit':
      if (state.isFinished || !state.hasGameStarted) return state;
      return recordCricketHit(state, action.target, action.multiplier);
    case 'misses':
      if (state.isFinished || !state.hasGameStarted) return state;
      return recordCricketMisses(state, action.count);
    case 'undo':
      return undoCricketAction(state);
    default:
      return state;
  }
};
