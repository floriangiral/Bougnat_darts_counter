// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-01 à V2-FR-03, V2-FR-06).
// Validation and clock resumption of the snapshot of a non-X01 game in progress.
import type { GotchaPlayerState, GotchaState, GotchaTurn } from '../../domain/gotcha/gotcha';
import { GOTCHA_MAX_PLAYERS } from '../../domain/gotcha/gotcha';
import type {
  GameRuntimeSnapshot,
  GameTiming,
  GotchaRuntimeSnapshot,
} from '../../shared/session/persistedAppSession';
import {
  isArrayOf,
  isBoolean,
  isFiniteNumber,
  isIndexWithin,
  isNonNegativeInteger,
  isNonNegativeNumber,
  isNullableString,
  isRecord,
  isString,
} from '../../shared/validation/guards';
import { hasUniqueIds } from './commonGuards';
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

export const isGameRuntimeSnapshot = (value: unknown): value is GameRuntimeSnapshot => {
  if (!isRecord(value) || !isGameTiming(value.timing)) return false;
  switch (value.gameType) {
    case 'GOTCHA':
      return isGotchaRuntime(value);
    default:
      return false;
  }
};

/** Adds back the time played between the last snapshot and the last write (decision Q4). */
export const resumeGameRuntime = (runtime: GameRuntimeSnapshot, savedAt: number | undefined): GameRuntimeSnapshot => ({
  ...runtime,
  timing: resumeGameTiming(runtime.timing, savedAt),
});
