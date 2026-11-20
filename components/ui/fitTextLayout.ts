// Calcul pur de la taille d'un nom ajusté à sa case (FitText) : aucune dépendance au DOM.

export type FitTextMode = 'fit' | 'wrap' | 'auto';

export interface FitTextLayout {
  /** fit : une ligne à fontPx ; wrap : deux lignes équilibrées à fontPx ; auto : mesure impossible. */
  mode: FitTextMode;
  /** Taille à appliquer en px, ou null pour garder la taille prévue par la feuille de style. */
  fontPx: number | null;
}

export interface FitTextMeasure {
  /** Largeur intérieure de la case (padding exclu), en px. */
  availableWidth: number;
  /** Largeur du texte sur une ligne, mesurée à referenceFontPx. */
  naturalWidth: number;
  referenceFontPx: number;
  maxFontPx: number;
  minFontPx: number;
}

export const DEFAULT_FIT_MIN_FONT_PX = 14;

/** Marge de sécurité (arrondis du moteur de rendu) retirée de la largeur disponible. */
export const FIT_SAFETY_PX = 1;

const isPositive = (value: number) => Number.isFinite(value) && value > 0;

/** Arrondi au demi-pixel inférieur : la taille retenue ne dépasse jamais la place mesurée. */
const floorToHalfPx = (value: number) => Math.floor(value * 2) / 2;

export const computeFitTextLayout = ({
  availableWidth,
  naturalWidth,
  referenceFontPx,
  maxFontPx,
  minFontPx,
}: FitTextMeasure): FitTextLayout => {
  const max = isPositive(maxFontPx) ? maxFontPx : null;
  if (!isPositive(availableWidth) || !isPositive(naturalWidth) || !isPositive(referenceFontPx) || max === null) {
    return { mode: 'auto', fontPx: max };
  }

  const min = Math.min(isPositive(minFontPx) ? minFontPx : DEFAULT_FIT_MIN_FONT_PX, max);
  const usableWidth = availableWidth - FIT_SAFETY_PX;
  const idealFontPx = floorToHalfPx((usableWidth / naturalWidth) * referenceFontPx);

  if (idealFontPx >= max) return { mode: 'fit', fontPx: max };
  if (idealFontPx >= min) return { mode: 'fit', fontPx: idealFontPx };
  return { mode: 'wrap', fontPx: min };
};

/** Plus petite valeur strictement positive parmi les plafonds connus (prop, variable CSS, style). */
export const resolveMaxFontPx = (...candidates: Array<number | null | undefined>): number => {
  const valid = candidates.filter((value): value is number => typeof value === 'number' && isPositive(value));
  return valid.length > 0 ? Math.min(...valid) : Number.NaN;
};
