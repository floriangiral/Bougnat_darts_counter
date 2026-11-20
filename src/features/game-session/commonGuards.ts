// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-03).
import type { GameConfig, Player } from '../../../types';
import {
  isBoolean,
  isNonNegativeInteger,
  isOneOf,
  isRecord,
  isRecordOf,
  isString,
} from '../../shared/validation/guards';

const isInOutRule = isOneOf(['Open', 'Double', 'Master'] as const);
const isMatchMode = isOneOf(['LEGS', 'SETS'] as const);
const isBotLevel = isOneOf(['AMATEUR', 'LOISIR', 'CLUB', 'CONFIRME', 'PRO'] as const);
const isCricketRounds = isOneOf([10, 20, 30] as const);
const isTeamId = isOneOf(['team1', 'team2'] as const);

export const isPlayer = (value: unknown): value is Player =>
  isRecord(value)
  && isString(value.id)
  && isString(value.name)
  && isString(value.teamId)
  && (value.isBot === undefined || isBoolean(value.isBot))
  && (value.botLevel === undefined || isBotLevel(value.botLevel));

export const isGameConfig = (value: unknown): value is GameConfig =>
  isRecord(value)
  && isNonNegativeInteger(value.startingScore)
  && isInOutRule(value.checkIn)
  && isInOutRule(value.checkOut)
  && isMatchMode(value.matchMode)
  && isNonNegativeInteger(value.setsToWin)
  && isNonNegativeInteger(value.legsToWin)
  && isBoolean(value.isDoubles)
  && (value.cricketRounds === undefined || isCricketRounds(value.cricketRounds))
  && (value.initialStartingPlayerIndex === undefined || isNonNegativeInteger(value.initialStartingPlayerIndex))
  && (value.initialStartingTeamId === undefined || isTeamId(value.initialStartingTeamId))
  && (value.teamStarterIds === undefined || isRecordOf(value.teamStarterIds, isString));

/** Players are unique by id: a duplicated id would break turn rotation and scoreboards. */
export const hasUniqueIds = (entries: ReadonlyArray<{ id: string }>) =>
  new Set(entries.map((entry) => entry.id)).size === entries.length;
