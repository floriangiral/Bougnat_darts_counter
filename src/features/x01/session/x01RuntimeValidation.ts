// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-03) — X01 part of a restored session.
import type { LegState, MatchState, Turn } from '../../../../types';
import type { MatchRuntimeSnapshot, X01UndoSnapshot } from '../../../shared/session/persistedAppSession';
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
  isRecordOf,
  isString,
} from '../../../shared/validation/guards';
import { hasUniqueIds, isGameConfig, isPlayer } from '../../game-session/commonGuards';

const isMatchStatus = isOneOf(['active', 'finished'] as const);

const isTurn = (value: unknown): value is Turn =>
  isRecord(value)
  && isString(value.playerId)
  && isFiniteNumber(value.score)
  && isBoolean(value.isBust)
  && isFiniteNumber(value.remainingAfter)
  && isNonNegativeInteger(value.dartsThrown);

const isLegState = (value: unknown): value is LegState =>
  isRecord(value)
  && isRecordOf(value.scores, isFiniteNumber)
  && isArrayOf(value.history, isTurn)
  && isNullableString(value.winnerId)
  && isNonNegativeInteger(value.startingPlayerIndex);

export const isMatchState = (value: unknown): value is MatchState => {
  if (!isRecord(value) || !isString(value.id) || !isGameConfig(value.config)) return false;
  const { players, currentLeg } = value;
  if (!isArrayOf(players, isPlayer) || players.length === 0 || !hasUniqueIds(players)) return false;
  if (!isLegState(currentLeg)) return false;

  return players.every((player) => isFiniteNumber(currentLeg.scores[player.teamId]))
    && isIndexWithin(currentLeg.startingPlayerIndex, players.length)
    && isRecordOf(value.setsWon, isFiniteNumber)
    && isRecordOf(value.legsWon, isFiniteNumber)
    && isArrayOf(value.completedLegs, isLegState)
    && isMatchStatus(value.status)
    && isNullableString(value.matchWinnerId)
    && isIndexWithin(value.currentPlayerIndex, players.length)
    && isNonNegativeNumber(value.duration);
};

const isX01UndoSnapshot = (value: unknown): value is X01UndoSnapshot =>
  isRecord(value)
  && isMatchState(value.match)
  && isNonNegativeNumber(value.elapsedSeconds)
  && isBoolean(value.showWinnerScreen)
  && isBoolean(value.hasGameStarted);

export const isMatchRuntimeSnapshot = (value: unknown): value is MatchRuntimeSnapshot =>
  isRecord(value)
  && isMatchState(value.match)
  && isBoolean(value.hasGameStarted)
  && isNonNegativeNumber(value.elapsedSeconds)
  && (value.measuredAt === undefined || isFiniteNumber(value.measuredAt))
  && (value.undoStack === undefined || isArrayOf(value.undoStack, isX01UndoSnapshot));
