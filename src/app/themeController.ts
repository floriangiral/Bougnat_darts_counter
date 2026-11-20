import { readThemeMode, writeThemeMode } from '../infrastructure/local/themePreferenceStore';
import { applyEffectiveTheme, systemPrefersLight, watchSystemTheme } from '../infrastructure/web/themeDocument';
import { resolveEffectiveTheme, type EffectiveTheme, type ThemeMode } from '../features/theming/themePreference';

// Spec 069 : unique point d'écriture de la préférence ; le script inline de index.html a déjà
// appliqué le thème avant le premier rendu, ce contrôleur prend le relais (choix manuel, système).
type Listener = () => void;

let currentMode: ThemeMode | null = null;
let stopWatching: (() => void) | null = null;
const listeners = new Set<Listener>();

const getWindow = () => (typeof window === 'undefined' ? undefined : window);

const apply = () => {
  if (typeof document === 'undefined') return;
  applyEffectiveTheme(document, getEffectiveTheme());
};

export const getThemeMode = (): ThemeMode => {
  currentMode ??= readThemeMode();
  return currentMode;
};

export const getEffectiveTheme = (): EffectiveTheme =>
  resolveEffectiveTheme(getThemeMode(), systemPrefersLight(getWindow()));

export const setThemeMode = (mode: ThemeMode): void => {
  currentMode = mode;
  writeThemeMode(mode);
  apply();
  listeners.forEach((listener) => listener());
};

export const subscribeThemeMode = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const startThemeSync = (): (() => void) => {
  apply();
  stopWatching?.();
  stopWatching = watchSystemTheme(getWindow(), () => {
    if (getThemeMode() === 'system') apply();
  });
  return () => {
    stopWatching?.();
    stopWatching = null;
  };
};

// Réservé aux tests : relit la préférence au prochain accès.
export const resetThemeControllerForTests = (): void => {
  currentMode = null;
  stopWatching?.();
  stopWatching = null;
  listeners.clear();
};
