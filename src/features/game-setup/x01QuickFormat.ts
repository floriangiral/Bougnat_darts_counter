// Spec 133 : format de la partie rapide X01 mémorisé sur l'appareil. Fonctions pures, sans accès au stockage
// (voir src/infrastructure/local/x01QuickFormatStore.ts). Ni prénoms ni robot ne sont mémorisés (Q1).
import type { InOutRule, MatchMode } from '../../../types';
import { X01_CUSTOM_MAX_VISITS_LIMIT, X01_CUSTOM_SCORE_MAX, type SetupState } from './setupModel';

export const X01_QUICK_FORMAT_VERSION = 1;
export const X01_QUICK_FORMAT_STORAGE_KEY = 'bougnat-x01-quick-format';

/** Borne haute des manches et sets mémorisés : au-delà, la valeur est jugée corrompue (RM-07). */
const MAX_LEGS_OR_SETS = 99;

export interface X01QuickFormat {
  startingScore: number;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
  maxVisitsPerLeg: number | null;
}

interface StoredX01QuickFormat extends X01QuickFormat {
  v: number;
}

/** Standard de la partie rapide (2.1.0) : 501, premier à 3 manches, départ libre, fin sur un double. */
export const STANDARD_X01_QUICK_FORMAT: X01QuickFormat = {
  startingScore: 501,
  matchMode: 'LEGS',
  legsToWin: 3,
  setsToWin: 3,
  checkIn: 'Open',
  checkOut: 'Double',
  maxVisitsPerLeg: null,
};

const RULES: ReadonlySet<InOutRule> = new Set<InOutRule>(['Open', 'Double', 'Master']);
const MATCH_MODES: ReadonlySet<MatchMode> = new Set<MatchMode>(['LEGS', 'SETS']);

/** Q2 : seuls les formats en simple à 2 joueurs, sans robot, sont mémorisés et proposés en partie rapide. */
export const isX01QuickFormatEligible = (state: Pick<SetupState, 'isDoubles' | 'playerNames' | 'playAgainstBot'>): boolean =>
  !state.isDoubles && state.playerNames.length === 2 && !state.playAgainstBot;

export const extractX01QuickFormat = (state: SetupState): X01QuickFormat => ({
  startingScore: state.startingScore,
  matchMode: state.matchMode,
  legsToWin: state.legsToWin,
  setsToWin: state.setsToWin,
  checkIn: state.checkIn,
  checkOut: state.checkOut,
  maxVisitsPerLeg: state.maxVisitsPerLeg,
});

const isIntegerInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

/** RM-07 : un format hors bornes ou incomplet est refusé (`null`). */
export const toValidX01QuickFormat = (value: unknown): X01QuickFormat | null => {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Partial<Record<keyof X01QuickFormat, unknown>>;
  const { startingScore, matchMode, legsToWin, setsToWin, checkIn, checkOut, maxVisitsPerLeg } = candidate;
  if (!isIntegerInRange(startingScore, 2, X01_CUSTOM_SCORE_MAX)) return null;
  if (!MATCH_MODES.has(matchMode as MatchMode)) return null;
  if (!isIntegerInRange(legsToWin, 1, MAX_LEGS_OR_SETS)) return null;
  if (!isIntegerInRange(setsToWin, 1, MAX_LEGS_OR_SETS)) return null;
  if (!RULES.has(checkIn as InOutRule) || !RULES.has(checkOut as InOutRule)) return null;
  if (maxVisitsPerLeg !== null && !isIntegerInRange(maxVisitsPerLeg, 1, X01_CUSTOM_MAX_VISITS_LIMIT)) return null;
  return {
    startingScore,
    matchMode: matchMode as MatchMode,
    legsToWin,
    setsToWin,
    checkIn: checkIn as InOutRule,
    checkOut: checkOut as InOutRule,
    maxVisitsPerLeg,
  };
};

export const parseX01QuickFormat = (raw: string | null | undefined): X01QuickFormat | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || (parsed as { v?: unknown }).v !== X01_QUICK_FORMAT_VERSION) {
      return null;
    }
    return toValidX01QuickFormat(parsed);
  } catch {
    return null;
  }
};

export const serializeX01QuickFormat = (format: X01QuickFormat): string =>
  JSON.stringify({ v: X01_QUICK_FORMAT_VERSION, ...format } satisfies StoredX01QuickFormat);

/** RM-08 : compare ce qui se joue (le nombre de sets n'a de sens qu'en mode sets). */
export const isStandardX01QuickFormat = (format: X01QuickFormat): boolean => {
  const standard = STANDARD_X01_QUICK_FORMAT;
  return format.startingScore === standard.startingScore
    && format.matchMode === standard.matchMode
    && format.legsToWin === standard.legsToWin
    && format.checkIn === standard.checkIn
    && format.checkOut === standard.checkOut
    && format.maxVisitsPerLeg === standard.maxVisitsPerLeg;
};
