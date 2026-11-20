import { isPhoneClass, isTabletClass, type ViewportClass } from './viewportClass';

// Specs 073 (V2-TAB-05) et 028 (V2-TAB-06, option B) : l'orientation n'est jamais imposée
// (WCAG 1.3.4) ; sur un écran de jeu, une invite non bloquante recommande la meilleure orientation.

export type OrientationHint = 'rotate-to-landscape' | 'rotate-to-portrait' | null;

export interface OrientationHintInput {
  viewport: ViewportClass;
  isGameScreen: boolean;
  /** Fenêtre portrait sur un écran paysage (multitâche iPad) : pas d'invite (FR-07). */
  isMultitasking: boolean;
  /** « Continuer » choisi pour la partie en cours (FR-04). */
  dismissed: boolean;
}

export const resolveOrientationHint = ({
  viewport,
  isGameScreen,
  isMultitasking,
  dismissed,
}: OrientationHintInput): OrientationHint => {
  if (!isGameScreen || dismissed || viewport.input !== 'touch') return null;
  if (isTabletClass(viewport) && viewport.orientation === 'portrait' && !isMultitasking) {
    return 'rotate-to-landscape';
  }
  if (isPhoneClass(viewport) && viewport.orientation === 'landscape') {
    return 'rotate-to-portrait';
  }
  return null;
};

/** Verrou paysage Android (FR-05) : uniquement en classe tablette tactile, jamais de verrou portrait (FR-06). */
export const shouldLockLandscape = (viewport: ViewportClass, isGameScreen: boolean): boolean =>
  isGameScreen && viewport.input === 'touch' && isTabletClass(viewport);

export const ORIENTATION_HINT_DISMISS_KEY = 'bougnat-orientation-hint-dismissed';
