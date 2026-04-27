import { APP_SESSION_STORAGE_KEY, readLocalStorageJson } from '../../utils/appPersistence';

import { clearPersistedAppSessionAsync, persistAppSessionAsync, restorePersistedAppSessionAsync } from '../infrastructure';
import { env } from '../lib/env';
import type { MatchRuntimeSnapshot, PersistedAppSession } from '../shared';

// Spec: spec:counter/scoring-access-modes
export type AppAccessMode = 'local' | 'dedicated_tablet' | 'personal_phone';

export type AppScreen =
  | 'HOME'
  | 'GAME_SELECTION'
  | 'SETUP'
  | 'MATCH'
  | 'STATS'
  | 'CRICKET_GAME'
  | 'CRICKET_STATS'
  | 'CAPITAL_GAME'
  | 'CAPITAL_STATS'
  | 'KILLER_GAME'
  | 'KILLER_STATS'
  | 'GOTCHA_GAME'
  | 'GOTCHA_STATS'
  | 'TRIATHLON_GAME'
  | 'TRIATHLON_STATS';

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

const APP_SCREENS: AppScreen[] = [
  'HOME',
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
];

const ACCESS_MODES: AppAccessMode[] = ['local', 'dedicated_tablet', 'personal_phone'];

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

export const isAppScreen = (value: unknown): value is AppScreen =>
  typeof value === 'string' && APP_SCREENS.includes(value as AppScreen);

export const isAppAccessMode = (value: unknown): value is AppAccessMode =>
  typeof value === 'string' && ACCESS_MODES.includes(value as AppAccessMode);

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

export const isScreenAllowedForAccessMode = (screen: AppScreen, mode: AppAccessMode): boolean => {
  // Invariant v1.0.1: all supported modes are scoring-only surfaces.
  void mode;
  return SCORING_ONLY_SCREENS.has(screen);
};

export const isFullscreenScreen = (screen: AppScreen) => FULLSCREEN_SCREENS.includes(screen);

export const getRestoredAppSession = () =>
  typeof window === 'undefined'
    ? null
    : readLocalStorageJson<PersistedAppSession>(APP_SESSION_STORAGE_KEY);

export const getRestoredAppSessionAsync = async () =>
  typeof window === 'undefined'
    ? null
    : restorePersistedAppSessionAsync();

// Spec: spec:counter/inp-phase1-quick-wins
// Module-level debounce timer: groups rapid bursts of state changes (e.g. fast
// keypad entries during a match) into a single deferred write, keeping the
// interaction thread clear of synchronous I/O.
let _persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 300;

export const persistAppSession = (session: PersistedAppSession) => {
  if (_persistDebounceTimer !== null) {
    clearTimeout(_persistDebounceTimer);
  }
  _persistDebounceTimer = setTimeout(() => {
    _persistDebounceTimer = null;
    void persistAppSessionAsync(session);
  }, PERSIST_DEBOUNCE_MS);
};

export const clearPersistedAppSession = () => {
  void clearPersistedAppSessionAsync();
};

export type { MatchRuntimeSnapshot, PersistedAppSession };
