import type { LockOrientation, OrientationPort } from '../../application/orientation/orientationPort';

type LockableScreenOrientation = {
  type?: string;
  lock?: (orientation: LockOrientation) => Promise<void>;
  unlock?: () => void;
};

const getOrientation = (scr: Screen | undefined): LockableScreenOrientation | undefined =>
  scr?.orientation as LockableScreenOrientation | undefined;

// Chromium Android n'accepte le verrou qu'en plein écran ; Safari/iPadOS ne l'implémente pas (spec 073 §4).
export const createWebOrientationPort = (scr: Screen | undefined = globalThis.screen): OrientationPort => ({
  isSupported: () => typeof getOrientation(scr)?.lock === 'function',
  lock: async (orientation) => {
    const target = getOrientation(scr);
    if (typeof target?.lock !== 'function') return false;
    try {
      await target.lock(orientation);
      return true;
    } catch {
      return false;
    }
  },
  unlock: () => {
    try {
      getOrientation(scr)?.unlock?.();
    } catch {
      // Déjà libéré (sortie du plein écran) : rien à faire.
    }
  },
});

/** Écran physique en paysage alors que la fenêtre est en portrait : multitâche (Split View). */
export const isMultitaskingWindow = (win: Window | undefined = globalThis.window): boolean => {
  if (!win) return false;
  const type = getOrientation(win.screen)?.type;
  const legacyAngle = (win as Window & { orientation?: number }).orientation;
  let deviceLandscape = false;
  if (typeof type === 'string') {
    deviceLandscape = type.startsWith('landscape');
  } else if (typeof legacyAngle === 'number') {
    deviceLandscape = Math.abs(legacyAngle) === 90;
  }
  return deviceLandscape && win.innerWidth < win.innerHeight;
};

export const isDocumentFullscreen = (doc: Document | undefined = globalThis.document): boolean => {
  if (!doc) return false;
  const legacy = doc as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(doc.fullscreenElement ?? legacy.webkitFullscreenElement);
};
