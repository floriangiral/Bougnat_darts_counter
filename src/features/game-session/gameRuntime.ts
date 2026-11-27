// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-01 à V2-FR-03, V2-FR-06).
// Validation and clock resumption of the snapshot of a non-X01 game in progress.
import type { CapitalDart, CapitalHistoryItem, CapitalPlayerState, CricketPlayerState } from '../../../types';
import { CAPITAL_TARGETS } from '../../../utils/capitalLogic';
import { CRICKET_TARGETS } from '../../../utils/cricketLogic';
import type { Atc180Player, Atc180State, Atc180Turn } from '../../domain/atc180/atc180';
import { ATC180_HITS, isAtc180StateConsistent } from '../../domain/atc180/atc180';
import type { GotchaPlayerState, GotchaState, GotchaTurn } from '../../domain/gotcha/gotcha';
import { GOTCHA_MAX_PLAYERS } from '../../domain/gotcha/gotcha';
import type { KillerPlayerState, KillerState } from '../../domain/killer/killer';
import { KILLER_MAX_PLAYERS, KILLER_STARTING_LIVES, KILLER_TARGETS } from '../../domain/killer/killer';
import type { CapitalGameState, CapitalHistorySnapshot, CapitalPendingResolution } from '../capital/capitalGameModel';
import type { CricketGameState, CricketHistorySnapshot } from '../cricket/cricketGameModel';
import type { TriathlonFlowState, TriathlonPhase } from '../triathlon/triathlonFlow';
import { isMatchRuntimeSnapshot, isMatchState } from '../x01/session/x01RuntimeValidation';
import type {
  Atc180RuntimeSnapshot,
  CapitalRuntimeSnapshot,
  CricketRuntimeSnapshot,
  GameRuntimeSnapshot,
  GameTiming,
  GotchaRuntimeSnapshot,
  KillerRuntimeSnapshot,
  TriathlonRuntimeSnapshot,
  TriathlonStageRuntime,
} from '../../shared/session/persistedAppSession';
import {
  isArrayOf,
  isBoolean,
  isFiniteNumber,
  isIndexWithin,
  isNonNegativeInteger,
  isNonNegativeNumber,
  isNullableString,
  isOneOf,
  isRecord,
  isString,
} from '../../shared/validation/guards';
import { hasUniqueIds, isPlayer } from './commonGuards';
import { resumeElapsedSeconds, resumeGameTiming } from './gameTiming';

export const isGameTiming = (value: unknown): value is GameTiming =>
  isRecord(value)
  && isNonNegativeNumber(value.elapsedSeconds)
  && isFiniteNumber(value.measuredAt)
  && isBoolean(value.running);

/** Ids are unique, the current index is in range and the winner, if any, is a player. */
const hasConsistentRoster = (
  players: ReadonlyArray<{ id: string }>,
  currentIndex: unknown,
  winnerId: unknown,
  maxPlayers: number,
) =>
  players.length >= 2
  && players.length <= maxPlayers
  && hasUniqueIds(players)
  && isIndexWithin(currentIndex, players.length)
  && isNullableString(winnerId)
  && (winnerId === null || players.some((player) => player.id === winnerId));

const isGotchaTurn = (value: unknown): value is GotchaTurn =>
  isRecord(value)
  && isString(value.playerId)
  && isNonNegativeInteger(value.points)
  && isFiniteNumber(value.scoreBefore)
  && isFiniteNumber(value.scoreAfter)
  && isBoolean(value.isBust)
  && isArrayOf(value.gotchaVictimIds, isString);

const isGotchaPlayer = (value: unknown): value is GotchaPlayerState =>
  isRecord(value)
  && isString(value.id)
  && isString(value.name)
  && isNonNegativeInteger(value.score)
  && isArrayOf(value.history, isGotchaTurn);

const isGotchaStatus = isOneOf(['playing', 'choosing', 'finished'] as const);

// Spec 136 (RM-G6) : places jouées optionnelles (ancien format : [winnerId]), ids uniques et existants à la cible,
// vainqueur en premier ; statut cohérent avec le nombre de non classés et le joueur courant.
const hasValidGotchaPlacements = (
  players: GotchaPlayerState[],
  targetScore: number,
  winnerId: string | null,
  placedIds: unknown,
  status: unknown,
  currentPlayerIndex: number,
) => {
  if (placedIds !== undefined && !isArrayOf(placedIds, isString)) return false;
  if (status !== undefined && !isGotchaStatus(status)) return false;
  const placed = placedIds ?? (winnerId === null ? [] : [winnerId]);
  const effectiveStatus = status ?? (winnerId === null ? 'playing' : 'finished');
  const unplacedCount = players.length - placed.length;
  return new Set(placed).size === placed.length
    && placed.every((id) => players.some((player) => player.id === id && player.score === targetScore))
    && (placed[0] ?? null) === winnerId
    && (effectiveStatus === 'playing' || winnerId !== null)
    && (effectiveStatus !== 'choosing' || unplacedCount >= 2)
    && (effectiveStatus !== 'playing' || (unplacedCount >= 2 && !placed.includes(players[currentPlayerIndex].id)));
};

// Spec 136 : ordre de passage en attente (absent = déjà validé) seulement tant que personne n'a joué.
const isValidGotchaOrderFlag = (orderConfirmed: unknown, players: GotchaPlayerState[], winnerId: unknown) =>
  orderConfirmed === undefined
  || orderConfirmed === true
  || (orderConfirmed === false
    && winnerId === null
    && players.length > 2
    && players.every((player) => player.score === 0 && player.history.length === 0));

export const isGotchaState = (value: unknown): value is GotchaState =>
  isRecord(value)
  && isNonNegativeInteger(value.targetScore)
  && value.targetScore > 0
  && isArrayOf(value.players, isGotchaPlayer)
  && hasConsistentRoster(value.players, value.currentPlayerIndex, value.winnerId, GOTCHA_MAX_PLAYERS)
  && value.players.every((player) => player.score <= (value.targetScore as number))
  && isNonNegativeInteger(value.turnNumber)
  && isArrayOf(value.log, isString)
  && hasValidGotchaPlacements(
    value.players,
    value.targetScore,
    value.winnerId as string | null,
    value.placedIds,
    value.status,
    value.currentPlayerIndex as number,
  )
  && isValidGotchaOrderFlag(value.orderConfirmed, value.players, value.winnerId);

const isGotchaRuntime = (value: Record<string, unknown>): value is GotchaRuntimeSnapshot =>
  isGotchaState(value.state) && isArrayOf(value.history, isGotchaState);

const isKillerPhase = isOneOf(['ASSIGN_TARGETS', 'PLAYING', 'FINISHED'] as const);
const isKillerTarget = isOneOf(KILLER_TARGETS);

const isKillerPlayer = (value: unknown): value is KillerPlayerState =>
  isRecord(value)
  && isString(value.id)
  && isString(value.name)
  && (value.target === null || isKillerTarget(value.target))
  && isNonNegativeInteger(value.lives)
  && value.lives <= KILLER_STARTING_LIVES
  && isBoolean(value.isKiller)
  && isBoolean(value.isEliminated);

/** Spec 136 : ordre des éliminations optionnel, ids uniques de joueurs éliminés. */
const hasConsistentKillerEliminations = (players: KillerPlayerState[], eliminatedIds: unknown) => {
  if (eliminatedIds === undefined) return true;
  if (!isArrayOf(eliminatedIds, isString) || new Set(eliminatedIds).size !== eliminatedIds.length) return false;
  return eliminatedIds.every((id) => players.some((player) => player.id === id && player.isEliminated));
};

export const isKillerState = (value: unknown): value is KillerState => {
  if (!isRecord(value) || !isKillerPhase(value.phase) || !isArrayOf(value.players, isKillerPlayer)) return false;
  const targets = value.players.map((player) => player.target).filter((target) => target !== null);
  return hasConsistentRoster(value.players, value.currentPlayerIndex, value.winnerId, KILLER_MAX_PLAYERS)
    && new Set(targets).size === targets.length
    && isNonNegativeInteger(value.dartsInTurn)
    && value.dartsInTurn < 3
    && isArrayOf(value.log, isString)
    && hasConsistentKillerEliminations(value.players, value.eliminatedIds);
};

const isKillerRuntime = (value: Record<string, unknown>): value is KillerRuntimeSnapshot =>
  isKillerState(value.state) && isArrayOf(value.history, isKillerState)
  && (value.hasGameStarted === undefined || isBoolean(value.hasGameStarted));

const isAtc180Hit = isOneOf(ATC180_HITS);

const isAtc180Player = (value: unknown): value is Atc180Player =>
  isRecord(value) && isString(value.id) && isString(value.name);

const isAtc180Turn = (value: unknown): value is Atc180Turn =>
  isRecord(value)
  && isString(value.playerId)
  && isNonNegativeInteger(value.round)
  && isArrayOf(value.darts, isAtc180Hit)
  && isNonNegativeInteger(value.points);

/** Structure, puis invariants du domaine (ordre des tours et des joueurs, points, volée en cours). */
export const isAtc180State = (value: unknown): value is Atc180State =>
  isRecord(value)
  && isArrayOf(value.players, isAtc180Player)
  && isNonNegativeInteger(value.startingPlayerIndex)
  && isArrayOf(value.turns, isAtc180Turn)
  && isArrayOf(value.currentDarts, isAtc180Hit)
  && isAtc180StateConsistent(value as Atc180State);

const isAtc180Runtime = (value: Record<string, unknown>): value is Atc180RuntimeSnapshot =>
  isAtc180State(value.state) && isBoolean(value.hasGameStarted);

const isCapitalTarget = isOneOf(CAPITAL_TARGETS);
const isMultiplier = isOneOf([1, 2, 3] as const);

const isCapitalDart = (value: unknown): value is CapitalDart =>
  isRecord(value) && isNonNegativeInteger(value.value) && isMultiplier(value.multiplier);

const isCapitalHistoryItem = (value: unknown): value is CapitalHistoryItem =>
  isRecord(value)
  && isCapitalTarget(value.target)
  && isArrayOf(value.darts, isCapitalDart)
  && isFiniteNumber(value.pointsScored)
  && isBoolean(value.isSuccess);

const isCapitalPlayer = (value: unknown): value is CapitalPlayerState =>
  isRecord(value)
  && isString(value.id)
  && isString(value.name)
  && isFiniteNumber(value.score)
  && isNonNegativeInteger(value.targetIndex)
  && value.targetIndex <= CAPITAL_TARGETS.length
  && isArrayOf(value.history, isCapitalHistoryItem);

const isCapitalPendingResolution = (value: unknown): value is CapitalPendingResolution =>
  isRecord(value) && isArrayOf(value.darts, isCapitalDart) && isString(value.playerId) && isCapitalTarget(value.target);

const isCapitalSnapshot = (value: unknown): value is CapitalHistorySnapshot => {
  if (!isRecord(value) || !isArrayOf(value.orderedPlayers, isPlayer) || !isArrayOf(value.states, isCapitalPlayer)) return false;
  const { orderedPlayers, states, pendingResolution } = value;
  const stateIds = new Set(states.map((state) => state.id));
  return orderedPlayers.length > 0
    && hasUniqueIds(orderedPlayers)
    && states.length === orderedPlayers.length
    && orderedPlayers.every((player) => stateIds.has(player.id))
    && isIndexWithin(value.currentPlayerIdx, orderedPlayers.length)
    && isArrayOf(value.currentDarts, isCapitalDart)
    && value.currentDarts.length <= 3
    && (pendingResolution === null || (isCapitalPendingResolution(pendingResolution) && stateIds.has(pendingResolution.playerId)));
};

export const isCapitalGameState = (value: unknown): value is CapitalGameState =>
  isCapitalSnapshot(value) && isArrayOf((value as Record<string, unknown>).history, isCapitalSnapshot);

const isCapitalRuntime = (value: Record<string, unknown>): value is CapitalRuntimeSnapshot =>
  isCapitalGameState(value.state) && isBoolean(value.hasGameStarted);

const isCricketTarget = isOneOf(CRICKET_TARGETS);

const isCricketThrow = (value: unknown): value is CricketPlayerState['history'][number] =>
  isRecord(value)
  && (value.target === null || isCricketTarget(value.target))
  && isMultiplier(value.multiplier)
  && isBoolean(value.isMiss)
  && isFiniteNumber(value.pointsScored);

const isCricketPlayer = (value: unknown): value is CricketPlayerState =>
  isRecord(value)
  && isString(value.id)
  && isString(value.name)
  && isFiniteNumber(value.score)
  && isRecord(value.marks)
  && CRICKET_TARGETS.every((target) => isNonNegativeInteger((value.marks as Record<string, unknown>)[target]))
  && isNonNegativeInteger(value.dartsThrown)
  && isArrayOf(value.history, isCricketThrow);

/** Spec 136 : places jouées optionnelles, ids uniques de compétiteurs existants. */
const hasValidCricketPlacements = (value: Record<string, unknown>, competitorIds: ReadonlySet<string>) => {
  const { placedIds, awaitingPlacementChoice } = value;
  if (awaitingPlacementChoice !== undefined && !isBoolean(awaitingPlacementChoice)) return false;
  if (placedIds === undefined) return awaitingPlacementChoice !== true;
  return isArrayOf(placedIds, isString)
    && new Set(placedIds).size === placedIds.length
    && placedIds.every((id) => competitorIds.has(id))
    && (awaitingPlacementChoice !== true || placedIds.length > 0);
};

/** Checks one position of a Cricket game (the current one or an undo step). */
const isCricketPosition = (value: unknown, isDoubles: boolean): value is CricketHistorySnapshot => {
  if (!isRecord(value) || !isArrayOf(value.orderedPlayers, isPlayer)) return false;
  const { orderedPlayers, states, aggregateStats } = value;
  if (!isArrayOf(states, isCricketPlayer) || !isArrayOf(aggregateStats, isCricketPlayer)) return false;
  const competitorIds = new Set(states.map((state) => state.id));
  return orderedPlayers.length > 0
    && hasUniqueIds(orderedPlayers)
    && hasUniqueIds(states)
    && aggregateStats.length === states.length
    && aggregateStats.every((entry) => competitorIds.has(entry.id))
    && orderedPlayers.every((player) => competitorIds.has(isDoubles ? player.teamId : player.id))
    && isIndexWithin(value.currentThrowerIdx, orderedPlayers.length)
    && isNonNegativeInteger(value.turnDartsThrown)
    && value.turnDartsThrown < 3
    && isNullableString(value.winnerId)
    && (value.winnerId === null || competitorIds.has(value.winnerId))
    && hasValidCricketPlacements(value, competitorIds);
};

export const isCricketGameState = (value: unknown): value is CricketGameState => {
  if (!isRecord(value) || !isBoolean(value.isDoubles)) return false;
  const isDoubles = value.isDoubles;
  return isBoolean(value.isFinished)
    && isBoolean(value.hasGameStarted)
    && isNullableString(value.startingCompetitorId)
    && isNonNegativeInteger(value.roundsLimit)
    && value.roundsLimit > 0
    && (value.playPlacements === undefined || isBoolean(value.playPlacements))
    && isArrayOf(value.history, (entry): entry is CricketHistorySnapshot => isCricketPosition(entry, isDoubles))
    && isCricketPosition(value, isDoubles);
};

const isCricketRuntime = (value: Record<string, unknown>): value is CricketRuntimeSnapshot => isCricketGameState(value.state);

const TRIATHLON_PHASES: TriathlonPhase[] = ['STARTING_DRAW', 'CAPITAL', 'TRANSITION_CRICKET', 'CRICKET', 'TRANSITION_X01', 'X01', 'TIE_BREAK_X01'];
const isTriathlonPhase = isOneOf(TRIATHLON_PHASES);
const AFTER_CAPITAL = new Set<TriathlonPhase>(['TRANSITION_CRICKET', 'CRICKET', 'TRANSITION_X01', 'X01', 'TIE_BREAK_X01']);
const AFTER_CRICKET = new Set<TriathlonPhase>(['TRANSITION_X01', 'X01', 'TIE_BREAK_X01']);

const isOptionalMatch = (value: unknown) => value === undefined || isMatchState(value);

// Finished events must be present for the phase reached (the scorecards are rebuilt from them).
const hasTriathlonResultsForPhase = (results: Record<string, unknown>, phase: TriathlonPhase) =>
  (results.capital === undefined ? !AFTER_CAPITAL.has(phase) : isArrayOf(results.capital, isCapitalPlayer))
  && (results.cricket === undefined ? !AFTER_CRICKET.has(phase) : isRecord(results.cricket) && isArrayOf(results.cricket.competitors, isCricketPlayer))
  && (results.x01 === undefined ? phase !== 'TIE_BREAK_X01' : isMatchState(results.x01))
  && isOptionalMatch(results.tieBreakMatch)
  && (results.tieBreakWinnerId === undefined || isNullableString(results.tieBreakWinnerId))
  && (results.startingBull === undefined || isRecord(results.startingBull));

export const isTriathlonFlowState = (value: unknown): value is TriathlonFlowState =>
  isRecord(value)
  && isTriathlonPhase(value.phase)
  && isRecord(value.results)
  && hasTriathlonResultsForPhase(value.results, value.phase)
  && isNullableString(value.startingCompetitorId)
  && (value.phase === 'STARTING_DRAW' || value.startingCompetitorId !== null)
  && isRecord(value.starterDrawAttempts)
  && isString(value.starterDrawMessage)
  && isArrayOf(value.scorecards, isRecord);

const isTriathlonStage = (value: unknown, phase: TriathlonPhase): value is TriathlonStageRuntime => {
  if (!isRecord(value) || value.phase !== phase || !isRecord(value.runtime)) return false;
  const runtime = value.runtime;
  switch (phase) {
    case 'CAPITAL':
      return runtime.gameType === 'CAPITAL' && isGameTiming(runtime.timing) && isCapitalRuntime(runtime);
    case 'CRICKET':
      return runtime.gameType === 'CRICKET' && isGameTiming(runtime.timing) && isCricketRuntime(runtime);
    case 'X01':
    case 'TIE_BREAK_X01':
      return isMatchRuntimeSnapshot(runtime);
    default:
      return false;
  }
};

const isTriathlonRuntime = (value: Record<string, unknown>): value is TriathlonRuntimeSnapshot =>
  isTriathlonFlowState(value.flow)
  && (value.stage === null || isTriathlonStage(value.stage, value.flow.phase));

export const isGameRuntimeSnapshot = (value: unknown): value is GameRuntimeSnapshot => {
  if (!isRecord(value) || !isGameTiming(value.timing)) return false;
  switch (value.gameType) {
    case 'GOTCHA':
      return isGotchaRuntime(value);
    case 'KILLER':
      return isKillerRuntime(value);
    case 'CAPITAL':
      return isCapitalRuntime(value);
    case 'CRICKET':
      return isCricketRuntime(value);
    case 'TRIATHLON':
      return isTriathlonRuntime(value);
    case 'ATC180':
      return isAtc180Runtime(value);
    default:
      return false;
  }
};

const resumeTriathlonStage = (stage: TriathlonStageRuntime, savedAt: number | undefined): TriathlonStageRuntime => {
  if (stage.phase === 'CAPITAL') return { ...stage, runtime: { ...stage.runtime, timing: resumeGameTiming(stage.runtime.timing, savedAt) } };
  if (stage.phase === 'CRICKET') return { ...stage, runtime: { ...stage.runtime, timing: resumeGameTiming(stage.runtime.timing, savedAt) } };
  const { runtime } = stage;
  const running = runtime.hasGameStarted && runtime.match.status === 'active';
  return { ...stage, runtime: { ...runtime, elapsedSeconds: resumeElapsedSeconds(runtime.elapsedSeconds, runtime.measuredAt, running, savedAt) } };
};

/** Adds back the time played between the last snapshot and the last write (decision Q4). */
export const resumeGameRuntime = (runtime: GameRuntimeSnapshot, savedAt: number | undefined): GameRuntimeSnapshot => {
  const timing = resumeGameTiming(runtime.timing, savedAt);
  if (runtime.gameType !== 'TRIATHLON') return { ...runtime, timing };
  return { ...runtime, timing, stage: runtime.stage ? resumeTriathlonStage(runtime.stage, savedAt) : null };
};
