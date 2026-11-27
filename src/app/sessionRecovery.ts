// Spec ref: specs/010-counter-offline-session-recovery-guarantees (Révision V2 : V2-FR-02 à V2-FR-04, V2-FR-09)
// and ADR-0003: the persisted session is validated by hand before use, migrated from the
// unversioned format when possible, and otherwise discarded (never cast blindly).
import type { GameType } from '../../utils/arenaFlow';
import { isGameRuntimeSnapshot } from '../features/game-session/gameRuntime';
import { decodeStoredSession } from '../features/game-session/storedSessionCodec';
import { isMatchRuntimeSnapshot, isMatchState } from '../features/x01/session/x01RuntimeValidation';
import { sanitizeChallengerQueue } from '../features/x01/challenger/x01ChallengerQueue';
import {
  APP_SESSION_MAX_AGE_MS,
  APP_SESSION_SCHEMA_VERSION,
  type PartnerResultStatus,
  type PersistedAppSession,
} from '../shared/session/persistedAppSession';
import {
  isArrayOf,
  isFiniteNumber,
  isNonNegativeInteger,
  isOneOf,
  isRecord,
  isString,
} from '../shared/validation/guards';
import { type AppScreen, isAppScreen } from './appScreens';

export type SessionRecoveryResult =
  | { status: 'empty' }
  | { status: 'restored'; session: PersistedAppSession }
  /** Older than APP_SESSION_MAX_AGE_MS: purged without message (decision Q6). */
  | { status: 'expired' }
  /** Unreadable, invalid, unknown version or not migratable: purged and announced. */
  | { status: 'discarded'; reason: string };

const LEGACY_SCHEMA_VERSION = 1;

const isGameType = isOneOf<GameType>(['X01', 'CRICKET', 'CAPITAL', 'KILLER', 'GOTCHA', 'TRIATHLON', 'ATC180']);

/** Game screens whose progress was not saved before schema 2 (decision Q1: purge announced). */
const LEGACY_UNRESTORABLE_SCREENS = new Set<AppScreen>(['CRICKET_GAME', 'CAPITAL_GAME', 'KILLER_GAME', 'GOTCHA_GAME', 'TRIATHLON_GAME']);

const isNullOr = <T>(guard: (value: unknown) => value is T) => (value: unknown): value is T | null =>
  value === null || guard(value);

const isOptionalNullOr = <T>(guard: (value: unknown) => value is T) => (value: unknown): value is T | null | undefined =>
  value === undefined || value === null || guard(value);

// Results only feed the statistics screens: a shallow check of what those screens iterate on.
const hasArray = (key: string) => (value: unknown): value is Record<string, unknown> =>
  isRecord(value) && Array.isArray(value[key]);

const isTriathlonData = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) && isRecord(value.globalScores) && isRecord(value.results);

const isPartnerResultStatus = (value: unknown): value is PartnerResultStatus =>
  isRecord(value)
  && isOneOf<PartnerResultStatus['state']>(['sent', 'failed'])(value.state)
  && isString(value.host);

const discarded = (reason: string): SessionRecoveryResult => ({ status: 'discarded', reason });

const resolveScreen = (session: PersistedAppSession): AppScreen => {
  const screen = session.screen as AppScreen;
  switch (screen) {
    case 'CRICKET_STATS':
      return session.cricketResults ? screen : 'GAME_SELECTION';
    case 'TRIATHLON_STATS':
      return session.triathlonData ? screen : 'GAME_SELECTION';
    case 'KILLER_STATS':
    case 'GOTCHA_STATS':
      // No view renders these screens: Killer and Gotcha show their result in the game view.
      return 'GAME_SELECTION';
    default:
      return screen;
  }
};

// Spec 136 : les places jouées du Cricket sont optionnelles.
const isCricketResults = (value: unknown): value is Record<string, unknown> =>
  hasArray('competitors')(value)
  && (value.placedIds === undefined || isArrayOf(value.placedIds, isString));

const validateSession = (value: Record<string, unknown>): string | null => {
  if (!isAppScreen(value.screen)) return 'screen';
  if (!isGameType(value.selectedGameType)) return 'selectedGameType';
  if (!isNullOr(isMatchState)(value.currentMatch)) return 'currentMatch';
  if (!isString(value.matchWinner)) return 'matchWinner';
  if (!isArrayOf(value.arenaPrefillPlayers, isString)) return 'arenaPrefillPlayers';
  if (value.arenaPrefillConfig !== undefined && !isRecord(value.arenaPrefillConfig)) return 'arenaPrefillConfig';
  if (!isNullOr(isCricketResults)(value.cricketResults)) return 'cricketResults';
  if (!isNullOr(isTriathlonData)(value.triathlonData)) return 'triathlonData';
  if (!isArrayOf(value.capitalResults, isRecord)) return 'capitalResults';
  if (!isOptionalNullOr(hasArray('players'))(value.killerResults)) return 'killerResults';
  if (!isOptionalNullOr(hasArray('players'))(value.gotchaResults)) return 'gotchaResults';
  if (!isNullOr(isMatchRuntimeSnapshot)(value.matchRuntime)) return 'matchRuntime';
  if (!isOptionalNullOr(isGameRuntimeSnapshot)(value.gameRuntime)) return 'gameRuntime';
  if (!isOptionalNullOr(isPartnerResultStatus)(value.partnerResultStatus)) return 'partnerResultStatus';
  return null;
};

/**
 * Validates a session read back from storage. `now` is the current epoch time; it decides
 * whether the session has expired (decision Q6).
 */
export const parsePersistedAppSession = (raw: unknown, now: number): SessionRecoveryResult => {
  if (raw === null || raw === undefined) return { status: 'empty' };
  if (!isRecord(raw)) return discarded('not-an-object');

  const version = raw.schemaVersion ?? LEGACY_SCHEMA_VERSION;
  if (!isNonNegativeInteger(version) || version < LEGACY_SCHEMA_VERSION || version > APP_SESSION_SCHEMA_VERSION) {
    return discarded('unknown-version');
  }

  if (version === LEGACY_SCHEMA_VERSION) {
    if (isAppScreen(raw.screen) && LEGACY_UNRESTORABLE_SCREENS.has(raw.screen)) return discarded('legacy-game');
  } else {
    if (!isFiniteNumber(raw.savedAt)) return discarded('savedAt');
    if (now - raw.savedAt > APP_SESSION_MAX_AGE_MS) return { status: 'expired' };
  }

  const decoded = decodeStoredSession(raw);
  const invalidField = validateSession(decoded);
  if (invalidField) return discarded(invalidField);

  const session = decoded as PersistedAppSession;
  // A snapshot of another game than the selected one is stale (browser back, then another game):
  // only that snapshot is dropped, the rest of the session is kept, without message.
  const gameRuntime = session.gameRuntime?.gameType === session.selectedGameType ? session.gameRuntime : null;
  return {
    status: 'restored',
    session: {
      ...session,
      schemaVersion: APP_SESSION_SCHEMA_VERSION,
      screen: resolveScreen(session),
      killerResults: session.killerResults ?? null,
      gotchaResults: session.gotchaResults ?? null,
      partnerResultStatus: session.partnerResultStatus ?? null,
      gameRuntime,
      // Spec 137 (§16) : la file est accessoire, elle est assainie sans écarter la session.
      x01ChallengerQueue: sanitizeChallengerQueue(session.x01ChallengerQueue),
    },
  };
};

/** Same as parsePersistedAppSession for the JSON text kept in localStorage. */
export const parseSerializedAppSession = (serialized: string | null, now: number): SessionRecoveryResult => {
  if (!serialized) return { status: 'empty' };
  let raw: unknown;
  try {
    raw = JSON.parse(serialized);
  } catch {
    return discarded('unreadable');
  }
  return parsePersistedAppSession(raw, now);
};
