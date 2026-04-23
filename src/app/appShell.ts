import { APP_SESSION_STORAGE_KEY, readLocalStorageJson, writeLocalStorageJson } from '../../utils/appPersistence';

import { clearPersistedAppSessionAsync, persistAppSessionAsync, restorePersistedAppSessionAsync } from '../infrastructure';
import { env } from '../lib/env';
import type { MatchRuntimeSnapshot, PersistedAppSession } from '../shared';

export type AppAccessMode = 'social' | 'dedicated_tablet' | 'personal_phone';

export type AppScreen =
  | 'HOME'
  | 'AUTH'
  | 'AUTH_CALLBACK'
  | 'DASHBOARD'
  | 'LOBBY'
  | 'RESUME_LOBBY'
  | 'CREATE_LOBBY'
  | 'CHALLENGE_FRIEND'
  | 'JOIN_WITH_CODE'
  | 'LOBBY_ROOM'
  | 'FRIENDS'
  | 'PROFILE'
  | 'HISTORY'
  | 'MY_STATS'
  | 'GAME_SELECTION'
  | 'SETUP'
  | 'MATCH'
  | 'STATS'
  | 'CRICKET_GAME'
  | 'CRICKET_STATS'
  | 'CAPITAL_GAME'
  | 'CAPITAL_STATS'
  | 'TRIATHLON_GAME'
  | 'TRIATHLON_STATS';

export const FULLSCREEN_SCREENS: AppScreen[] = ['MATCH', 'CRICKET_GAME', 'CAPITAL_GAME', 'TRIATHLON_GAME'];

export const LIVE_UPDATE_PROTECTED_SCREENS: AppScreen[] = [
  'SETUP',
  'MATCH',
  'STATS',
  'CRICKET_GAME',
  'CRICKET_STATS',
  'CAPITAL_GAME',
  'CAPITAL_STATS',
  'TRIATHLON_GAME',
  'TRIATHLON_STATS',
  'CREATE_LOBBY',
  'JOIN_WITH_CODE',
  'LOBBY_ROOM',
  'RESUME_LOBBY',
];

const APP_SCREENS: AppScreen[] = [
  'HOME',
  'AUTH',
  'AUTH_CALLBACK',
  'DASHBOARD',
  'LOBBY',
  'RESUME_LOBBY',
  'CREATE_LOBBY',
  'CHALLENGE_FRIEND',
  'JOIN_WITH_CODE',
  'LOBBY_ROOM',
  'FRIENDS',
  'PROFILE',
  'HISTORY',
  'MY_STATS',
  'GAME_SELECTION',
  'SETUP',
  'MATCH',
  'STATS',
  'CRICKET_GAME',
  'CRICKET_STATS',
  'CAPITAL_GAME',
  'CAPITAL_STATS',
  'TRIATHLON_GAME',
  'TRIATHLON_STATS',
];

const ACCESS_MODES: AppAccessMode[] = ['social', 'dedicated_tablet', 'personal_phone'];

const SCORING_ONLY_SCREENS = new Set<AppScreen>([
  'GAME_SELECTION',
  'SETUP',
  'MATCH',
  'STATS',
  'CRICKET_GAME',
  'CRICKET_STATS',
  'CAPITAL_GAME',
  'CAPITAL_STATS',
  'TRIATHLON_GAME',
  'TRIATHLON_STATS',
]);

export const isAppScreen = (value: unknown): value is AppScreen =>
  typeof value === 'string' && APP_SCREENS.includes(value as AppScreen);

export const isAppAccessMode = (value: unknown): value is AppAccessMode =>
  typeof value === 'string' && ACCESS_MODES.includes(value as AppAccessMode);

export const resolveAppAccessMode = (value: string | null | undefined): AppAccessMode => {
  if (!value) return 'social';
  return isAppAccessMode(value) ? value : 'social';
};

export const getAppAccessMode = (
  options: {
    search?: string;
    envMode?: string;
  } = {},
): AppAccessMode => {
  const search = options.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(search);
  const queryMode = resolveAppAccessMode(params.get('mode'));
  if (queryMode !== 'social') {
    return queryMode;
  }
  return resolveAppAccessMode(options.envMode ?? env.VITE_APP_ACCESS_MODE);
};

export const isScreenAllowedForAccessMode = (screen: AppScreen, mode: AppAccessMode): boolean => {
  if (mode === 'social') return true;
  if (screen === 'AUTH_CALLBACK') return true;
  return SCORING_ONLY_SCREENS.has(screen);
};

export const isFullscreenScreen = (screen: AppScreen) => FULLSCREEN_SCREENS.includes(screen);

export const getRestoredAppSession = () =>
  typeof window === 'undefined' || window.location.pathname === '/auth/callback'
    ? null
    : readLocalStorageJson<PersistedAppSession>(APP_SESSION_STORAGE_KEY);

export const getRestoredAppSessionAsync = async () =>
  typeof window === 'undefined' || window.location.pathname === '/auth/callback'
    ? null
    : restorePersistedAppSessionAsync();

export const persistAppSession = (session: PersistedAppSession) => {
  writeLocalStorageJson(APP_SESSION_STORAGE_KEY, session);
  void persistAppSessionAsync(session);
};

export const clearPersistedAppSession = () => {
  void clearPersistedAppSessionAsync();
};

export type { MatchRuntimeSnapshot, PersistedAppSession };
