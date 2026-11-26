import {
  parseX01QuickFormat,
  serializeX01QuickFormat,
  X01_QUICK_FORMAT_STORAGE_KEY,
  type X01QuickFormat,
} from '../../features/game-setup/x01QuickFormat';

// Spec 133 : format de la partie rapide mémorisé sur l'appareil. Un stockage indisponible ou illisible
// n'est jamais bloquant : la partie rapide propose alors le standard (RM-02, RM-07).
export const readX01QuickFormat = (
  storage: Pick<Storage, 'getItem'> | null = getLocalStorage(),
): X01QuickFormat | null => {
  try {
    return parseX01QuickFormat(storage?.getItem(X01_QUICK_FORMAT_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
};

export const writeX01QuickFormat = (
  format: X01QuickFormat,
  storage: Pick<Storage, 'setItem'> | null = getLocalStorage(),
): void => {
  try {
    storage?.setItem(X01_QUICK_FORMAT_STORAGE_KEY, serializeX01QuickFormat(format));
  } catch {
    // Navigation privée stricte ou quota atteint : le format n'est simplement pas mémorisé.
  }
};

export const clearX01QuickFormat = (
  storage: Pick<Storage, 'removeItem'> | null = getLocalStorage(),
): void => {
  try {
    storage?.removeItem(X01_QUICK_FORMAT_STORAGE_KEY);
  } catch {
    // Stockage indisponible : rien à effacer.
  }
};

function getLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
