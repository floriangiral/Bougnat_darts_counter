import type { AppAccessMode } from '../../app/appShell';

// Spec 070 (V2-TAB-01, ADR 0007) : unique classification de la présentation, sans user-agent.
// La structure dépend de la taille et de l'orientation ; la modalité tactile ne change que les
// planchers de cibles et les états de survol (FR-03).

export type WidthClass = 'compact' | 'medium' | 'expanded' | 'large';
export type HeightClass = 'compact' | 'medium' | 'expanded';
export type ViewportOrientation = 'portrait' | 'landscape';
export type InputModality = 'touch' | 'pointer';
export type LayoutDensity = 'tight' | 'compact' | 'comfortable' | 'spacious';
export type LayoutRecipe = 'stack' | 'stack-wide' | 'arena' | 'phone-landscape';
/** Présentation historique dérivée (data-layout), conservée jusqu'à la fin de la migration CSS (FR-06). */
export type LayoutMode = 'smartphone' | 'tablet' | 'default';

export interface ViewportInput {
  width: number;
  height: number;
  /** `any-pointer: coarse` ; `null` si matchMedia est indisponible. */
  isTouch: boolean | null;
  accessMode: AppAccessMode;
}

export interface ViewportClass {
  widthClass: WidthClass;
  heightClass: HeightClass;
  orientation: ViewportOrientation;
  input: InputModality;
  density: LayoutDensity;
  recipe: LayoutRecipe;
  layoutMode: LayoutMode;
}

export const WIDTH_MEDIUM = 600;
export const WIDTH_EXPANDED = 840;
export const WIDTH_LARGE = 1200;
export const HEIGHT_MEDIUM = 480;
export const HEIGHT_EXPANDED = 900;
export const DENSITY_COMPACT = 600;
export const DENSITY_COMFORTABLE = 760;
export const DENSITY_SPACIOUS = 900;
/** Une fenêtre de bureau plus étroite garde la présentation téléphone (comportement antérieur conservé). */
export const DESKTOP_NARROW_WIDTH = 768;

const resolveWidthClass = (width: number): WidthClass => {
  if (width >= WIDTH_LARGE) return 'large';
  if (width >= WIDTH_EXPANDED) return 'expanded';
  if (width >= WIDTH_MEDIUM) return 'medium';
  return 'compact';
};

const resolveHeightClass = (height: number): HeightClass => {
  if (height >= HEIGHT_EXPANDED) return 'expanded';
  if (height >= HEIGHT_MEDIUM) return 'medium';
  return 'compact';
};

const resolveDensity = (height: number): LayoutDensity => {
  if (height >= DENSITY_SPACIOUS) return 'spacious';
  if (height >= DENSITY_COMFORTABLE) return 'comfortable';
  if (height >= DENSITY_COMPACT) return 'compact';
  return 'tight';
};

const resolveRecipe = (width: number, orientation: ViewportOrientation, heightClass: HeightClass): LayoutRecipe => {
  if (orientation === 'landscape') {
    if (heightClass === 'compact') return 'phone-landscape';
    if (width >= WIDTH_EXPANDED) return 'arena';
    return 'stack';
  }
  return width >= WIDTH_EXPANDED ? 'stack-wide' : 'stack';
};

const resolveLayoutMode = (
  width: number,
  input: InputModality,
  recipe: LayoutRecipe,
  widthClass: WidthClass,
): LayoutMode => {
  if (input === 'pointer') {
    return width < DESKTOP_NARROW_WIDTH ? 'smartphone' : 'default';
  }
  if (recipe === 'phone-landscape' || (recipe === 'stack' && widthClass === 'compact')) {
    return 'smartphone';
  }
  return 'tablet';
};

const SAFE_FALLBACK: ViewportClass = {
  widthClass: 'compact',
  heightClass: 'medium',
  orientation: 'portrait',
  input: 'touch',
  density: 'comfortable',
  recipe: 'stack',
  layoutMode: 'smartphone',
};

export const resolveViewportClass = ({ width, height, isTouch, accessMode }: ViewportInput): ViewportClass => {
  // §14 : valeurs nulles ou invalides → recette stack, modalité tactile (choix sûr).
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return SAFE_FALLBACK;
  }

  // Q1 : dedicated_tablet ne force que la modalité tactile, jamais la structure.
  const input: InputModality = isTouch !== false || accessMode === 'dedicated_tablet' ? 'touch' : 'pointer';
  const orientation: ViewportOrientation = width >= height ? 'landscape' : 'portrait';
  const widthClass = resolveWidthClass(width);
  const heightClass = resolveHeightClass(height);
  const recipe = resolveRecipe(width, orientation, heightClass);

  return {
    widthClass,
    heightClass,
    orientation,
    input,
    density: resolveDensity(height),
    recipe,
    layoutMode: resolveLayoutMode(width, input, recipe, widthClass),
  };
};

/** Recettes où le paysage est la présentation recommandée en partie (spec 073). */
export const isTabletClass = (viewport: ViewportClass): boolean => viewport.layoutMode === 'tablet';

export const isPhoneClass = (viewport: ViewportClass): boolean =>
  viewport.input === 'touch' && viewport.layoutMode === 'smartphone';

/** Attributs posés sur la racine (contrat consommé par la CSS et les tests E2E). */
export const getViewportDataAttributes = (viewport: ViewportClass): Record<string, string> => ({
  'data-layout': viewport.layoutMode,
  'data-size-w': viewport.widthClass,
  'data-size-h': viewport.heightClass,
  'data-orientation': viewport.orientation,
  'data-input': viewport.input,
  'data-density': viewport.density,
  'data-recipe': viewport.recipe,
});
