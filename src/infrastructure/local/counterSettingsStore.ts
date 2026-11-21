import {
  COUNTER_SETTINGS_STORAGE_KEY,
  parseCounterSettings,
  serializeCounterSettings,
  type CounterSettings,
} from '../../features/settings/counterSettings';

// Spec 129 : réglages locaux à l'appareil, sans compte ; un stockage indisponible n'est jamais bloquant.
export const readCounterSettings = (
  storage: Pick<Storage, 'getItem'> | null = getLocalStorage(),
): CounterSettings => {
  try {
    return parseCounterSettings(storage?.getItem(COUNTER_SETTINGS_STORAGE_KEY) ?? null);
  } catch {
    return parseCounterSettings(null);
  }
};

export const writeCounterSettings = (
  settings: CounterSettings,
  storage: Pick<Storage, 'setItem'> | null = getLocalStorage(),
): void => {
  try {
    storage?.setItem(COUNTER_SETTINGS_STORAGE_KEY, serializeCounterSettings(settings));
  } catch {
    // Navigation privée stricte ou quota atteint : le réglage s'applique sans être mémorisé.
  }
};

function getLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
