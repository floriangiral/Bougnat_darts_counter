// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-01 à V2-FR-03, V2-FR-06).
// Validation and clock resumption of the snapshot of a non-X01 game in progress.
import type { CapitalDart, CapitalHistoryItem, CapitalPlayerState } from '../../../types';
import { CAPITAL_TARGETS } from '../../../utils/capitalLogic';
import type { GotchaPlayerState, GotchaState, GotchaTurn } from '../../domain/gotcha/gotcha';
import { GOTCHA_MAX_PLAYERS } from '../../domain/gotcha/gotcha';
import type { KillerPlayerState, KillerState } from '../../domain/killer/killer';
import { KILLER_MAX_PLAYERS, KILLER_STARTING_LIVES, KILLER_TARGETS } from '../../domain/killer/killer';
import type { CapitalGameState, CapitalHistorySnapshot, CapitalPendingResolution } from '../capital/capitalGameModel';
import type {
  CapitalRuntimeSnapshot,
  GameRuntimeSnapshot,
  GameTiming,
  GotchaRuntimeSnapshot,
  KillerRuntimeSnapshot,
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
import { resumeGameTiming } from './gameTiming';

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

export const isGotchaState = (value: unknown): value is GotchaState =>
  isRecord(value)
  && isNonNegativeInteger(value.targetScore)
  && value.targetScore > 0
  && isArrayOf(value.players, isGotchaPlayer)
  && hasConsistentRoster(value.players, value.currentPlayerIndex, value.winnerId, GOTCHA_MAX_PLAYERS)
  && value.players.every((player) => player.score <= (value.targetScore as number))
  && isNonNegativeInteger(value.turnNumber)
  && isArrayOf(value.log, isString);

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

export const isKillerState = (value: unknown): value is KillerState => {
  if (!isRecord(value) || !isKillerPhase(value.phase) || !isArrayOf(value.players, isKillerPlayer)) return false;
  const targets = value.players.map((player) => player.target).filter((target) => target !== null);
  return hasConsistentRoster(value.players, value.currentPlayerIndex, value.winnerId, KILLER_MAX_PLAYERS)
    && new Set(targets).size === targets.length
    && isNonNegativeInteger(value.dartsInTurn)
    && value.dartsInTurn < 3
    && isArrayOf(value.log, isString);
};

const isKillerRuntime = (value: Record<string, unknown>): value is KillerRuntimeSnapshot =>
  isKillerState(value.state) && isArrayOf(value.history, isKillerState);

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

export const isGameRuntimeSnapshot = (value: unknown): value is GameRuntimeSnapshot => {
  if (!isRecord(value) || !isGameTiming(value.timing)) return false;
  switch (value.gameType) {
    case 'GOTCHA':
      return isGotchaRuntime(value);
    case 'KILLER':
      return isKillerRuntime(value);
    case 'CAPITAL':
      return isCapitalRuntime(value);
    default:
      return false;
  }
};

/** Adds back the time played between the last snapshot and the last write (decision Q4). */
export const resumeGameRuntime = (runtime: GameRuntimeSnapshot, savedAt: number | undefined): GameRuntimeSnapshot => ({
  ...runtime,
  timing: resumeGameTiming(runtime.timing, savedAt),
});
