// Spec 129 (V2-SET-01) : réglages du compteur, préférence locale à l'appareil (sans compte).
// Fonctions pures, sans accès au stockage : la lecture/écriture vit dans
// src/infrastructure/local/counterSettingsStore.ts. Les valeurs par défaut reproduisent le
// comportement d'avant la page Réglages (aide de finish masquée, voix et barre de raccourcis actives).
import { POSSIBLE_TURN_SCORES } from '../x01/scoring/possibleTurnScores';

export type ShortcutGroup = 'left' | 'right' | 'mobile';

export type X01Shortcuts = Readonly<Record<ShortcutGroup, number[]>>;

export interface X01Settings {
  /** Suggestions de finish (aide de checkout) affichées pendant la partie. */
  checkoutHints: boolean;
  /** Assistance vocale IA (seulement si la voix est disponible dans ce déploiement). */
  voiceAssist: boolean;
  /** Barre de raccourcis au-dessus du pavé sur téléphone. */
  mobileShortcutsBar: boolean;
  /** Scores rapides : colonnes gauche/droite (tablette, PC) et barre téléphone. */
  shortcuts: X01Shortcuts;
}

export interface CounterSettings {
  x01: X01Settings;
}

export const COUNTER_SETTINGS_STORAGE_KEY = 'bougnat-settings-v1';
export const COUNTER_SETTINGS_VERSION = 1;

export const DEFAULT_X01_SHORTCUTS: X01Shortcuts = {
  left: [41, 45, 60, 100],
  right: [26, 81, 85, 140],
  mobile: [45, 60, 100, 81, 85, 140],
};

export const DEFAULT_COUNTER_SETTINGS: CounterSettings = {
  x01: {
    checkoutHints: false,
    voiceAssist: true,
    mobileShortcutsBar: true,
    shortcuts: DEFAULT_X01_SHORTCUTS,
  },
};

interface StoredCounterSettings {
  v: typeof COUNTER_SETTINGS_VERSION;
  x01: X01Settings;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Un raccourci doit être un total réalisable en une volée de 3 fléchettes (0 à 180). */
export const isValidShortcutScore = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && POSSIBLE_TURN_SCORES.has(value);

const parseBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

// Un groupe invalide (taille ou score) revient entier à sa valeur par défaut : pas de mélange partiel.
const parseShortcutGroup = (value: unknown, fallback: number[]): number[] =>
  Array.isArray(value) && value.length === fallback.length && value.every(isValidShortcutScore)
    ? [...value]
    : fallback;

const parseShortcuts = (value: unknown): X01Shortcuts => {
  if (!isRecord(value)) return DEFAULT_X01_SHORTCUTS;
  return {
    left: parseShortcutGroup(value.left, DEFAULT_X01_SHORTCUTS.left),
    right: parseShortcutGroup(value.right, DEFAULT_X01_SHORTCUTS.right),
    mobile: parseShortcutGroup(value.mobile, DEFAULT_X01_SHORTCUTS.mobile),
  };
};

const parseX01Settings = (value: unknown): X01Settings => {
  const defaults = DEFAULT_COUNTER_SETTINGS.x01;
  if (!isRecord(value)) return defaults;
  return {
    checkoutHints: parseBoolean(value.checkoutHints, defaults.checkoutHints),
    voiceAssist: parseBoolean(value.voiceAssist, defaults.voiceAssist),
    mobileShortcutsBar: parseBoolean(value.mobileShortcutsBar, defaults.mobileShortcutsBar),
    shortcuts: parseShortcuts(value.shortcuts),
  };
};

/** Lit la valeur stockée ; absente, corrompue ou d'une autre version : valeurs par défaut (champ par champ). */
export const parseCounterSettings = (raw: string | null | undefined): CounterSettings => {
  if (!raw) return DEFAULT_COUNTER_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && parsed.v === COUNTER_SETTINGS_VERSION) {
      return { x01: parseX01Settings(parsed.x01) };
    }
  } catch {
    // Valeur corrompue : retour silencieux aux valeurs par défaut.
  }
  return DEFAULT_COUNTER_SETTINGS;
};

export const serializeCounterSettings = (settings: CounterSettings): string =>
  JSON.stringify({ v: COUNTER_SETTINGS_VERSION, x01: settings.x01 } satisfies StoredCounterSettings);

export type X01SettingsPatch = Partial<Omit<X01Settings, 'shortcuts'>>;

export const updateX01Settings = (settings: CounterSettings, patch: X01SettingsPatch): CounterSettings => ({
  ...settings,
  x01: { ...settings.x01, ...patch },
});

/** Remplace un raccourci ; une valeur invalide, inchangée ou un index hors limites rend les mêmes réglages. */
export const setX01Shortcut = (
  settings: CounterSettings,
  group: ShortcutGroup,
  index: number,
  value: number,
): CounterSettings => {
  const current = settings.x01.shortcuts[group];
  if (!isValidShortcutScore(value) || index < 0 || index >= current.length || current[index] === value) {
    return settings;
  }
  return {
    ...settings,
    x01: {
      ...settings.x01,
      shortcuts: {
        ...settings.x01.shortcuts,
        [group]: current.map((entry, entryIndex) => (entryIndex === index ? value : entry)),
      },
    },
  };
};

/** Saisie libre d'un raccourci : chiffres seulement, 3 au plus. */
export const sanitizeShortcutDraft = (value: string): string => value.replace(/\D/g, '').slice(0, 3);

/** Score d'un brouillon de raccourci, ou null s'il n'est pas un total réalisable. */
export const parseShortcutDraft = (draft: string): number | null => {
  if (!draft) return null;
  const parsed = Number.parseInt(draft, 10);
  return isValidShortcutScore(parsed) ? parsed : null;
};
