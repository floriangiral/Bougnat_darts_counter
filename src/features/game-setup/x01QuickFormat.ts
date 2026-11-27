// Spec 133 : dernière partie X01 mémorisée sur l'appareil (format, composition, prénoms, robot et niveau).
// Fonctions pures, sans accès au stockage (voir src/infrastructure/local/x01QuickFormatStore.ts).
import type { InOutRule, MatchMode, X01BotLevel } from '../../../types';
import {
  isX01VisitLimitAvailable,
  X01_BOT_MATCH_PLAYERS,
  X01_CUSTOM_MAX_LEGS_OR_SETS,
  X01_CUSTOM_MAX_VISITS_LIMIT,
  X01_CUSTOM_SCORE_MAX,
  X01_SIMPLE_MAX_PLAYERS,
  type SetupState,
} from './setupModel';

export const X01_QUICK_FORMAT_VERSION = 2;
const LEGACY_X01_QUICK_FORMAT_VERSION = 1;
export const X01_QUICK_FORMAT_STORAGE_KEY = 'bougnat-x01-quick-format';

/** Au-delà, un prénom mémorisé est jugé corrompu (RM-07). */
const MAX_NAME_LENGTH = 100;

export interface X01QuickFormat {
  startingScore: number;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
  maxVisitsPerLeg: number | null;
  isDoubles: boolean;
  /** Simple : 1 à 4 prénoms ; contre le robot, 2 entrées dont seule la première est un joueur. */
  playerNames: string[];
  team1Names: string[];
  team2Names: string[];
  playAgainstBot: boolean;
  botLevel: X01BotLevel;
}

interface StoredX01QuickFormat extends X01QuickFormat {
  v: number;
}

/** Standard de la partie rapide (2.1.0) : 501, premier à 3 manches, départ libre, fin sur un double, 1 contre 1. */
export const STANDARD_X01_QUICK_FORMAT: X01QuickFormat = {
  startingScore: 501,
  matchMode: 'LEGS',
  legsToWin: 3,
  setsToWin: 3,
  checkIn: 'Open',
  checkOut: 'Double',
  maxVisitsPerLeg: null,
  isDoubles: false,
  playerNames: ['', ''],
  team1Names: ['', ''],
  team2Names: ['', ''],
  playAgainstBot: false,
  botLevel: 'AMATEUR',
};

const RULES: ReadonlySet<InOutRule> = new Set<InOutRule>(['Open', 'Double', 'Master']);
const MATCH_MODES: ReadonlySet<MatchMode> = new Set<MatchMode>(['LEGS', 'SETS']);
const BOT_LEVELS: ReadonlySet<X01BotLevel> = new Set<X01BotLevel>(['AMATEUR', 'LOISIR', 'CLUB', 'CONFIRME', 'PRO']);

export const extractX01QuickFormat = (state: SetupState): X01QuickFormat => ({
  startingScore: state.startingScore,
  matchMode: state.matchMode,
  legsToWin: state.legsToWin,
  setsToWin: state.setsToWin,
  checkIn: state.checkIn,
  checkOut: state.checkOut,
  // Comme au lancement, une limite de volées sans objet (solo) n'est pas retenue.
  maxVisitsPerLeg: isX01VisitLimitAvailable('X01', state.isDoubles, state.playerNames.length) ? state.maxVisitsPerLeg : null,
  isDoubles: state.isDoubles,
  playerNames: [...state.playerNames],
  team1Names: [...state.team1Names],
  team2Names: [...state.team2Names],
  playAgainstBot: !state.isDoubles && state.playAgainstBot,
  botLevel: state.botLevel,
});

const isIntegerInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

const isNameList = (value: unknown, min: number, max: number): value is string[] =>
  Array.isArray(value)
  && value.length >= min
  && value.length <= max
  && value.every((name) => typeof name === 'string' && name.length <= MAX_NAME_LENGTH);

const isCoherentX01QuickFormat = ({ playAgainstBot, isDoubles, checkIn, playerNames, maxVisitsPerLeg }: X01QuickFormat): boolean => {
  // Spec 046 et 052 : le robot ne joue qu'en simple à 2, avec un départ libre.
  if (playAgainstBot && (isDoubles || checkIn !== 'Open' || playerNames.length !== X01_BOT_MATCH_PLAYERS)) return false;
  // La limite de volées se départage entre plusieurs camps : sans objet en solo.
  return maxVisitsPerLeg === null || isDoubles || playerNames.length >= 2;
};

/** RM-07 : une partie hors bornes, incomplète ou incohérente est refusée (`null`). */
export const toValidX01QuickFormat = (value: unknown): X01QuickFormat | null => {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<Record<keyof X01QuickFormat, unknown>>;
  const { startingScore, matchMode, legsToWin, setsToWin, checkIn, checkOut, maxVisitsPerLeg } = candidate;
  const { isDoubles, playerNames, team1Names, team2Names, playAgainstBot, botLevel } = candidate;
  if (!isIntegerInRange(startingScore, 2, X01_CUSTOM_SCORE_MAX)) return null;
  if (!MATCH_MODES.has(matchMode as MatchMode)) return null;
  if (!isIntegerInRange(legsToWin, 1, X01_CUSTOM_MAX_LEGS_OR_SETS)) return null;
  if (!isIntegerInRange(setsToWin, 1, X01_CUSTOM_MAX_LEGS_OR_SETS)) return null;
  if (!RULES.has(checkIn as InOutRule) || !RULES.has(checkOut as InOutRule)) return null;
  if (maxVisitsPerLeg !== null && !isIntegerInRange(maxVisitsPerLeg, 1, X01_CUSTOM_MAX_VISITS_LIMIT)) return null;
  if (typeof isDoubles !== 'boolean' || typeof playAgainstBot !== 'boolean') return null;
  if (!BOT_LEVELS.has(botLevel as X01BotLevel)) return null;
  if (!isNameList(playerNames, 1, X01_SIMPLE_MAX_PLAYERS)) return null;
  if (!isNameList(team1Names, 2, 2) || !isNameList(team2Names, 2, 2)) return null;
  const format: X01QuickFormat = {
    startingScore,
    matchMode: matchMode as MatchMode,
    legsToWin,
    setsToWin,
    checkIn: checkIn as InOutRule,
    checkOut: checkOut as InOutRule,
    maxVisitsPerLeg,
    isDoubles,
    playerNames: [...playerNames],
    team1Names: [...team1Names],
    team2Names: [...team2Names],
    playAgainstBot,
    botLevel: botLevel as X01BotLevel,
  };
  return isCoherentX01QuickFormat(format) ? format : null;
};

/** Version 1 (format seul, 1 contre 1 sans robot) : relue comme telle, sans prénoms. */
const migrateLegacyFormat = (stored: Record<string, unknown>): X01QuickFormat | null => toValidX01QuickFormat({
  ...STANDARD_X01_QUICK_FORMAT,
  startingScore: stored.startingScore,
  matchMode: stored.matchMode,
  legsToWin: stored.legsToWin,
  setsToWin: stored.setsToWin,
  checkIn: stored.checkIn,
  checkOut: stored.checkOut,
  maxVisitsPerLeg: stored.maxVisitsPerLeg,
});

export const parseX01QuickFormat = (raw: string | null | undefined): X01QuickFormat | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    const stored = parsed as Record<string, unknown>;
    if (stored.v === LEGACY_X01_QUICK_FORMAT_VERSION) return migrateLegacyFormat(stored);
    if (stored.v !== X01_QUICK_FORMAT_VERSION) return null;
    return toValidX01QuickFormat(stored);
  } catch {
    return null;
  }
};

export const serializeX01QuickFormat = (format: X01QuickFormat): string =>
  JSON.stringify({ v: X01_QUICK_FORMAT_VERSION, ...format } satisfies StoredX01QuickFormat);

/** RM-08 : compare ce qui se joue (règles et composition), jamais les prénoms ni un nombre de sets inutilisé. */
export const isStandardX01QuickFormat = (format: X01QuickFormat): boolean => {
  const standard = STANDARD_X01_QUICK_FORMAT;
  return format.startingScore === standard.startingScore
    && format.matchMode === standard.matchMode
    && format.legsToWin === standard.legsToWin
    && format.checkIn === standard.checkIn
    && format.checkOut === standard.checkOut
    && format.maxVisitsPerLeg === standard.maxVisitsPerLeg
    && !format.isDoubles
    && !format.playAgainstBot
    && format.playerNames.length === standard.playerNames.length;
};
