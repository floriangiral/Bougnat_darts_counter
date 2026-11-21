import {
  parseThemePreference,
  serializeThemePreference,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '../../features/theming/themePreference';

// Spec 069 : préférence locale à l'appareil, sans compte ; un stockage indisponible n'est jamais bloquant.
export const readThemeMode = (storage: Pick<Storage, 'getItem'> | null = getLocalStorage()): ThemeMode => {
  try {
    return parseThemePreference(storage?.getItem(THEME_STORAGE_KEY) ?? null);
  } catch {
    return parseThemePreference(null);
  }
};

export const writeThemeMode = (mode: ThemeMode, storage: Pick<Storage, 'setItem'> | null = getLocalStorage()): void => {
  try {
    storage?.setItem(THEME_STORAGE_KEY, serializeThemePreference(mode));
  } catch {
    // Navigation privée stricte : le choix s'applique sans être mémorisé.
  }
};

function getLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
