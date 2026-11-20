import { APP_SESSION_STORAGE_KEY, removeLocalStorageItem } from '../../utils/appPersistence';

import { normalizeRestoredX01Match } from '../application/scoring/matchLifecycle';
import { resumeElapsedSeconds } from '../features/game-session/gameTiming';
import { clearPersistedAppSessionAsync, persistAppSessionAsync, restorePersistedAppSessionAsync } from '../infrastructure';
import { env } from '../lib/env';
import { APP_SESSION_SCHEMA_VERSION, type PersistedAppSession } from '../shared';

import { type AppScreen } from './appScreens';
import { parsePersistedAppSession, parseSerializedAppSession, type SessionRecoveryResult } from './sessionRecovery';

export { isAppScreen, type AppScreen } from './appScreens';

// Spec: spec:counter/scoring-access-modes
export type AppAccessMode = 'local' | 'dedicated_tablet' | 'personal_phone';

export const FULLSCREEN_SCREENS: AppScreen[] = ['MATCH', 'CRICKET_GAME', 'CAPITAL_GAME', 'KILLER_GAME', 'GOTCHA_GAME', 'TRIATHLON_GAME'];

export const LIVE_UPDATE_PROTECTED_SCREENS: AppScreen[] = [
  'SETUP',
  'MATCH',
  'STATS',
  'CRICKET_GAME',
  'CRICKET_STATS',
  'CAPITAL_GAME',
  'CAPITAL_STATS',
  'KILLER_GAME',
  'KILLER_STATS',
  'GOTCHA_GAME',
  'GOTCHA_STATS',
  'TRIATHLON_GAME',
  'TRIATHLON_STATS',
];

const ACCESS_MODES = new Set<AppAccessMode>(['local', 'dedicated_tablet', 'personal_phone']);

const SCORING_ONLY_SCREENS = new Set<AppScreen>([
  'GAME_SELECTION',
  'SETUP',
  'MATCH',
  'STATS',
  'CRICKET_GAME',
  'CRICKET_STATS',
  'CAPITAL_GAME',
  'CAPITAL_STATS',
  'KILLER_GAME',
  'KILLER_STATS',
  'GOTCHA_GAME',
  'GOTCHA_STATS',
  'TRIATHLON_GAME',
  'TRIATHLON_STATS',
]);

export const isAppAccessMode = (value: unknown): value is AppAccessMode =>
  typeof value === 'string' && ACCESS_MODES.has(value as AppAccessMode);

export const resolveAppAccessMode = (value: string | null | undefined): AppAccessMode => {
  if (!value) return 'local';
  return isAppAccessMode(value) ? value : 'local';
};

export const getAppAccessMode = (
  options: {
    search?: string;
    envMode?: string;
  } = {},
): AppAccessMode => {
  // Invariant: query param mode has precedence over env to keep runtime mode explicit and testable.
  const search = options.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(search);
  const queryMode = resolveAppAccessMode(params.get('mode'));
  if (queryMode !== 'local') {
    return queryMode;
  }
  return resolveAppAccessMode(options.envMode ?? env.VITE_APP_ACCESS_MODE);
};

export const isScreenAllowedForAccessMode = (screen: AppScreen, _mode: AppAccessMode): boolean => {
  // Invariant v1.0.1: all supported modes are scoring-only surfaces.
  return SCORING_ONLY_SCREENS.has(screen);
};

export const isFullscreenScreen = (screen: AppScreen) => FULLSCREEN_SCREENS.includes(screen);

// Spec 045 (Q4) : une partie X01 restaurée ne doit pas rester bloquée sur un reste impossible.
const normalizeRestoredAppSession = (session: PersistedAppSession | null): PersistedAppSession | null => {
  if (!session) return session;
  return {
    ...session,
    currentMatch: session.currentMatch ? normalizeRestoredX01Match(session.currentMatch) : session.currentMatch,
    matchRuntime: session.matchRuntime
      ? {
          ...session.matchRuntime,
          match: normalizeRestoredX01Match(session.matchRuntime.match),
          elapsedSeconds: resumeElapsedSeconds(
            session.matchRuntime.elapsedSeconds,
            session.matchRuntime.measuredAt,
            session.matchRuntime.hasGameStarted && session.matchRuntime.match.status === 'active',
            session.savedAt,
          ),
        }
      : session.matchRuntime,
  };
};

export type RestoredAppSession = {
  session: PersistedAppSession | null;
  /** True when a stored session was unreadable, invalid or not migratable (spec 010, V2-FR-04). */
  discarded: boolean;
};

const NO_SESSION: RestoredAppSession = { session: null, discarded: false };

// Invalid or expired data is deleted right away so it is not read again on the next start.
const settleRecovery = (result: SessionRecoveryResult): RestoredAppSession => {
  if (result.status === 'restored') {
    return { session: normalizeRestoredAppSession(result.session), discarded: false };
  }
  if (result.status !== 'empty') {
    removeLocalStorageItem(APP_SESSION_STORAGE_KEY);
    clearPersistedAppSession();
  }
  return { session: null, discarded: result.status === 'discarded' };
};

const readStoredSessionText = () => {
  try {
    return window.localStorage.getItem(APP_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Synchronous restore from the localStorage fallback, used for the first render. */
export const restoreAppSession = (now = Date.now()): RestoredAppSession =>
  typeof window === 'undefined' ? NO_SESSION : settleRecovery(parseSerializedAppSession(readStoredSessionText(), now));

/** Restore from IndexedDB, used when the localStorage fallback was empty. */
export const restoreAppSessionAsync = async (now = Date.now()): Promise<RestoredAppSession> =>
  typeof window === 'undefined' ? NO_SESSION : settleRecovery(parsePersistedAppSession(await restorePersistedAppSessionAsync(), now));

export const getRestoredAppSession = () => restoreAppSession().session;

export const getRestoredAppSessionAsync = async () => (await restoreAppSessionAsync()).session;

// Spec 010 (V2-FR-08): a session that could not be saved anywhere is reported once per page.
type PersistenceFailureListener = () => void;
const persistenceFailureListeners = new Set<PersistenceFailureListener>();
let hasReportedPersistenceFailure = false;

const reportPersistenceFailure = () => {
  if (hasReportedPersistenceFailure) return;
  hasReportedPersistenceFailure = true;
  persistenceFailureListeners.forEach((listener) => listener());
};

export const onAppSessionPersistenceFailure = (listener: PersistenceFailureListener) => {
  persistenceFailureListeners.add(listener);
  return () => {
    persistenceFailureListeners.delete(listener);
  };
};

const writeSession = (session: PersistedAppSession) => {
  const stamped: PersistedAppSession = { ...session, schemaVersion: APP_SESSION_SCHEMA_VERSION, savedAt: Date.now() };
  persistAppSessionAsync(stamped)
    .then((saved) => {
      if (saved === false) reportPersistenceFailure();
    })
    .catch(reportPersistenceFailure);
};

// Spec: spec:counter/inp-phase1-quick-wins
// Module-level debounce timer: groups rapid bursts of state changes (e.g. fast
// keypad entries during a match) into a single deferred write, keeping the
// interaction thread clear of synchronous I/O.
let _persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingPersistedSession: PersistedAppSession | null = null;
const PERSIST_DEBOUNCE_MS = 300;

const writePendingSession = () => {
  const session = _pendingPersistedSession;
  _pendingPersistedSession = null;
  if (session) writeSession(session);
};

/**
 * Schedules a write of the session. Callers only invoke it on a business change (validated
 * action, screen change, end of game), never on a clock tick (spec 010, V2-FR-05).
 */
export const persistAppSession = (session: PersistedAppSession) => {
  if (_persistDebounceTimer !== null) {
    clearTimeout(_persistDebounceTimer);
  }
  _pendingPersistedSession = session;
  _persistDebounceTimer = setTimeout(() => {
    _persistDebounceTimer = null;
    writePendingSession();
  }, PERSIST_DEBOUNCE_MS);
};

/**
 * Writes the pending debounced session right away. Used before leaving the page (spec 030
 * external return navigation), so the session left behind matches what the players saw.
 * The local storage fallback is written synchronously by the repository.
 */
export const flushAppSessionPersistence = () => {
  if (_persistDebounceTimer === null) return;
  clearTimeout(_persistDebounceTimer);
  _persistDebounceTimer = null;
  writePendingSession();
};

/**
 * Writes the given session now, dropping any pending debounced write. Used when the page is
 * hidden or closed (spec 010, V2-FR-05/06): `savedAt` then marks when the app stopped
 * counting time, so the time spent closed is not added to a game clock (decision Q4).
 */
export const persistAppSessionNow = (session: PersistedAppSession) => {
  if (_persistDebounceTimer !== null) {
    clearTimeout(_persistDebounceTimer);
    _persistDebounceTimer = null;
  }
  _pendingPersistedSession = null;
  writeSession(session);
};

export const clearPersistedAppSession = () => {
  clearPersistedAppSessionAsync().catch(() => undefined);
};

export type { MatchRuntimeSnapshot, PersistedAppSession } from '../shared';
