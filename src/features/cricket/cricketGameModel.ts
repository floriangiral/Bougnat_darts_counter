import type { CricketMatchSummary, CricketPlayerState, CricketTarget, GameConfig, Player } from '../../../types';
import {
  checkCricketWin,
  haveAllPlayersReachedCricketRoundLimit,
  initCricketState,
  processCricketHit,
  rankCricketCompetitors,
  resolveCricketWinnerOnRounds,
} from '../../../utils/cricketLogic';
import type { RankedCricketCompetitor } from '../../../utils/cricketLogic';
import { formatRankOrdinal } from '../rankings/finalRanking';
import { orderPlayers } from '../game-setup/throwOrder';

export type CricketHistorySnapshot = {
  states: CricketPlayerState[];
  aggregateStats: CricketPlayerState[];
  currentThrowerIdx: number;
  turnDartsThrown: number;
  orderedPlayers: Player[];
  winnerId: string | null;
  /** Places jouées à cet instant (spec 136), absentes hors places jouées. */
  placedIds?: string[];
  awaitingPlacementChoice?: boolean;
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
  placedIds: string[] = [],
): CricketMatchSummary => ({
  competitors,
  legsWon,
  setsWon,
  currentSetLegsWon,
  winnerId,
  config,
  isDoubles: config.isDoubles,
  memberNamesByCompetitor,
  ...(placedIds.length > 0 ? { placedIds: [...placedIds] } : {}),
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
  /** Spec 136 : Cricket autonome en simple à plus de deux joueurs, les places suivantes peuvent se jouer. */
  playPlacements?: boolean;
  /** Places jouées dans l'ordre, vainqueur en premier ; ces joueurs ne lancent plus. */
  placedIds?: string[];
  /** Fenêtre « Jouer la place suivante » / « Terminer la partie » ouverte. */
  awaitingPlacementChoice?: boolean;
};

type CricketRotation = {
  orderedPlayers: Player[];
  currentThrowerIdx: number;
  startingCompetitorId: string | null;
};

export type CricketGameAction =
  | ({ type: 'sync_rotation' } & CricketRotation)
  /** `competitorOrder` : ordre de passage complet choisi (spec 136), appliqué aussi aux colonnes. */
  | ({ type: 'start'; competitorOrder?: string[] } & CricketRotation)
  | { type: 'hit'; target: CricketTarget; multiplier: 1 | 2 | 3 }
  | { type: 'misses'; count: number }
  | { type: 'undo' }
  | { type: 'play_next_place' }
  | { type: 'finish_placements' };

export const createInitialCricketGameState = ({
  competitors,
  rotation,
  hasGameStarted,
  isDoubles,
  roundsLimit,
  playPlacements = false,
}: {
  competitors: CricketCompetitor[];
  rotation: CricketRotation;
  hasGameStarted: boolean;
  isDoubles: boolean;
  roundsLimit: number;
  playPlacements?: boolean;
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
  ...(playPlacements && !isDoubles && competitors.length > 2
    ? { playPlacements: true, placedIds: [], awaitingPlacementChoice: false }
    : {}),
});

export const getCricketCurrentCompetitorId = (state: CricketGameState): string => {
  const thrower = state.orderedPlayers[state.currentThrowerIdx];
  return state.isDoubles ? thrower.teamId : thrower.id;
};

const pushCricketHistory = (state: CricketGameState): CricketHistorySnapshot[] => [
  ...state.history,
  {
    ...buildCricketHistorySnapshot(state.states, state.aggregateStats, state.currentThrowerIdx, state.turnDartsThrown, state.orderedPlayers, state.winnerId),
    ...(state.playPlacements
      ? { placedIds: [...(state.placedIds ?? [])], awaitingPlacementChoice: state.awaitingPlacementChoice ?? false }
      : {}),
  },
];

const getUnplacedCricketEntries = <T extends { id: string }>(state: CricketGameState, entries: T[]): T[] => {
  const placedIds = new Set(state.placedIds ?? []);
  return entries.filter((entry) => !placedIds.has(entry.id));
};

/** Premier lanceur non classé à partir de `fromIdx` (spec 136, RM-C2). */
const findNextUnplacedThrowerIdx = (state: CricketGameState, fromIdx: number): number => {
  const count = state.orderedPlayers.length;
  const placedIds = new Set(state.placedIds ?? []);
  for (let offset = 0; offset < count; offset += 1) {
    const index = (fromIdx + offset) % count;
    const player = state.orderedPlayers[index];
    if (!placedIds.has(state.isDoubles ? player.teamId : player.id)) return index;
  }
  return fromIdx % count;
};

const advanceCricketThrower = (state: CricketGameState, dartsAdded: number): CricketGameState => {
  const transition = advanceCricketTurn(state.turnDartsThrown, state.orderedPlayers.length, dartsAdded);
  return {
    ...state,
    turnDartsThrown: transition.nextTurnDartsThrown,
    currentThrowerIdx: transition.shouldAdvanceThrower
      ? findNextUnplacedThrowerIdx(state, state.currentThrowerIdx + transition.nextThrowerOffset)
      : state.currentThrowerIdx,
  };
};

// The game freezes on its end screen; the result is only sent on confirmation (spec 047).
const finishCricketGame = (state: CricketGameState, winnerId: string | null): CricketGameState => ({
  ...state,
  winnerId,
  isFinished: true,
});

// Spec 136 (RM-C3 à RM-C5) : la place est acquise ; on propose la suivante tant qu'il reste au moins
// deux joueurs non classés qui peuvent encore lancer, sinon la partie se termine.
const placeCricketCompetitor = (state: CricketGameState, placedId: string): CricketGameState => {
  const placedIds = [...(state.placedIds ?? []), placedId];
  const winnerId = state.winnerId ?? placedId;
  const placed: CricketGameState = { ...state, placedIds, winnerId };
  const remaining = getUnplacedCricketEntries(placed, placed.states);
  if (remaining.length < 2 || haveAllPlayersReachedCricketRoundLimit(remaining, state.roundsLimit)) {
    return finishCricketGame(placed, winnerId);
  }
  return { ...placed, awaitingPlacementChoice: true };
};

const resolveCricketWin = (state: CricketGameState, winnerId: string): CricketGameState =>
  state.playPlacements ? placeCricketCompetitor(state, winnerId) : finishCricketGame(state, winnerId);

const finishCricketOnRoundLimit = (state: CricketGameState): CricketGameState =>
  finishCricketGame(state, state.winnerId ?? resolveCricketWinnerOnRounds(getUnplacedCricketEntries(state, state.aggregateStats)));

const playNextCricketPlace = (state: CricketGameState): CricketGameState => {
  if (!state.awaitingPlacementChoice || state.isFinished) return state;
  const resumed: CricketGameState = {
    ...state,
    awaitingPlacementChoice: false,
    turnDartsThrown: 0,
    currentThrowerIdx: findNextUnplacedThrowerIdx(state, state.currentThrowerIdx + 1),
  };
  // Un joueur qui avait tout fermé derrière le classé peut déjà mener les non classés.
  const nextPlacedId = checkCricketWin(getUnplacedCricketEntries(resumed, resumed.states));
  return nextPlacedId ? placeCricketCompetitor(resumed, nextPlacedId) : resumed;
};

const finishCricketPlacements = (state: CricketGameState): CricketGameState => {
  if (!state.awaitingPlacementChoice || state.isFinished) return state;
  return { ...finishCricketGame(state, state.winnerId), awaitingPlacementChoice: false };
};

const recordCricketHit = (state: CricketGameState, target: CricketTarget, multiplier: 1 | 2 | 3): CricketGameState => {
  const competitorId = getCricketCurrentCompetitorId(state);
  const result = processCricketHit(state.states, competitorId, target, multiplier);
  const aggregateStats = appendAggregateCricketHit(state.aggregateStats, competitorId, target, multiplier, result.pointsScored, false);
  const next: CricketGameState = { ...state, history: pushCricketHistory(state), states: result.newStates, aggregateStats };

  const unplacedStates = getUnplacedCricketEntries(next, result.newStates);
  const winnerId = checkCricketWin(unplacedStates);
  if (winnerId) return resolveCricketWin(next, winnerId);
  if (haveAllPlayersReachedCricketRoundLimit(unplacedStates, state.roundsLimit)) {
    return finishCricketOnRoundLimit(next);
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
  if (haveAllPlayersReachedCricketRoundLimit(getUnplacedCricketEntries(next, states), state.roundsLimit)) {
    return finishCricketOnRoundLimit(next);
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
    ...(state.playPlacements
      ? { placedIds: previous.placedIds ?? [], awaitingPlacementChoice: previous.awaitingPlacementChoice ?? false }
      : {}),
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
        ...(action.competitorOrder
          ? { states: orderPlayers(state.states, action.competitorOrder), aggregateStats: orderPlayers(state.aggregateStats, action.competitorOrder) }
          : {}),
        orderedPlayers: clonePlayers(action.orderedPlayers),
        currentThrowerIdx: action.currentThrowerIdx,
        startingCompetitorId: action.startingCompetitorId,
        hasGameStarted: true,
      };
    case 'hit':
      if (state.isFinished || !state.hasGameStarted || state.awaitingPlacementChoice) return state;
      return recordCricketHit(state, action.target, action.multiplier);
    case 'misses':
      if (state.isFinished || !state.hasGameStarted || state.awaitingPlacementChoice) return state;
      return recordCricketMisses(state, action.count);
    case 'undo':
      return undoCricketAction(state);
    case 'play_next_place':
      return playNextCricketPlace(state);
    case 'finish_placements':
      return finishCricketPlacements(state);
    default:
      return state;
  }
};

/** Classement complet de fin : places jouées d'abord, puis les autres calculés avec ex æquo (spec 136). */
export const getCricketFinalRanking = (state: CricketGameState): RankedCricketCompetitor[] =>
  rankCricketCompetitors(state.aggregateStats, state.winnerId, state.placedIds);

/** Texte de la fenêtre de choix après une place jouée (spec 136), ou null si elle est fermée. */
export const getCricketPlacementPrompt = (state: CricketGameState): { title: string; playLabel: string } | null => {
  const placedIds = state.placedIds ?? [];
  const lastPlacedId = placedIds.at(-1);
  if (!state.awaitingPlacementChoice || !lastPlacedId) return null;
  const name = state.states.find((entry) => entry.id === lastPlacedId)?.name ?? '';
  const place = placedIds.length;
  return {
    title: place === 1 ? `${name} gagne la partie !` : `${name} termine ${formatRankOrdinal(place)}`,
    playLabel: `Jouer la ${formatRankOrdinal(place + 1)} place`,
  };
};
