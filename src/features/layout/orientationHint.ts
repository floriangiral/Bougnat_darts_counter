import { isPhoneClass, type ViewportClass } from './viewportClass';

// Spec 028 (V2-TAB-06, option B) : l'orientation n'est jamais imposée (WCAG 1.3.4) ; sur un écran de
// jeu, un téléphone tenu en paysage reçoit une invite non bloquante à revenir en portrait.
// Décision PO du 2026-11-20 (spec 073 rejetée) : sur tablette, le portrait est la présentation de
// référence — aucune invite ni aucun verrou ne pousse vers le paysage, qui reste simplement supporté.

export type OrientationHint = 'rotate-to-portrait' | null;

export interface OrientationHintInput {
  viewport: ViewportClass;
  isGameScreen: boolean;
  /** « Continuer en paysage » choisi pour la partie en cours. */
  dismissed: boolean;
}

export const resolveOrientationHint = ({ viewport, isGameScreen, dismissed }: OrientationHintInput): OrientationHint => {
  if (!isGameScreen || dismissed) return null;
  return isPhoneClass(viewport) && viewport.orientation === 'landscape' ? 'rotate-to-portrait' : null;
};

export const ORIENTATION_HINT_DISMISS_KEY = 'bougnat-orientation-hint-dismissed';
