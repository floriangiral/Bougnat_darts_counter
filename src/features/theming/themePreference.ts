// Spec 069 (préférence de thème) et 068 (mode Light). Fonctions pures, sans accès au DOM.
// Le script inline de index.html reproduit parseThemePreference + resolveEffectiveTheme :
// toute modification de la clé, du schéma ou des couleurs doit y être reportée (test de cohérence).

export type ThemeMode = 'system' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

export const THEME_MODES: readonly ThemeMode[] = ['system', 'dark', 'light'];
export const THEME_STORAGE_KEY = 'bougnat-theme-v1';
export const THEME_PREFERENCE_VERSION = 1;
export const DEFAULT_THEME_MODE: ThemeMode = 'system';

// Spec 068 FR-04 : le Light n'est proposé qu'une fois 100 % des écrans migrés (registre de la spec 065).
export const LIGHT_THEME_ENABLED = true;

// Couleur canvas de chaque thème (meta theme-color, spec 069 FR-04) ; identique à --bd-canvas.
export const THEME_CANVAS_COLORS: Record<EffectiveTheme, string> = {
  dark: '#06080d',
  light: '#f5f3ef',
};

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  system: 'Auto',
  dark: 'Sombre',
  light: 'Clair',
};

export interface StoredThemePreference {
  v: typeof THEME_PREFERENCE_VERSION;
  mode: ThemeMode;
}

export const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);

export const parseThemePreference = (raw: string | null | undefined): ThemeMode => {
  if (!raw) return DEFAULT_THEME_MODE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null
      && typeof parsed === 'object'
      && (parsed as { v?: unknown }).v === THEME_PREFERENCE_VERSION
      && isThemeMode((parsed as { mode?: unknown }).mode)
    ) {
      return (parsed as StoredThemePreference).mode;
    }
  } catch {
    // Valeur corrompue : retour silencieux au mode système (FR-05).
  }
  return DEFAULT_THEME_MODE;
};

export const serializeThemePreference = (mode: ThemeMode): string =>
  JSON.stringify({ v: THEME_PREFERENCE_VERSION, mode } satisfies StoredThemePreference);

export const resolveEffectiveTheme = (
  mode: ThemeMode,
  systemPrefersLight: boolean,
  lightEnabled: boolean = LIGHT_THEME_ENABLED,
): EffectiveTheme => {
  if (!lightEnabled) return 'dark';
  if (mode === 'system') return systemPrefersLight ? 'light' : 'dark';
  return mode;
};

// Barre d'état iOS : texte blanc translucide en sombre, texte noir en clair (spec 069 Q2).
export const getStatusBarStyle = (theme: EffectiveTheme): string =>
  theme === 'light' ? 'default' : 'black-translucent';
