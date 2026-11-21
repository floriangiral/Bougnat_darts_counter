import { useSyncExternalStore } from 'react';
import type { ThemeMode } from '../features/theming/themePreference';
import { getThemeMode, setThemeMode, subscribeThemeMode } from './themeController';

export const useThemeMode = (): [ThemeMode, (mode: ThemeMode) => void] => {
  const mode = useSyncExternalStore(subscribeThemeMode, getThemeMode, getThemeMode);
  return [mode, setThemeMode];
};
