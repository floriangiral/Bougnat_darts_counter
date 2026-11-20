import { describe, expect, it } from 'vitest';
import {
  getViewportDataAttributes,
  resolveViewportClass,
  type LayoutMode,
  type LayoutRecipe,
  type ViewportInput,
} from '../../../src/features/layout/viewportClass';

const touch = (width: number, height: number): ViewportInput => ({ width, height, isTouch: true, accessMode: 'local' });
const pointer = (width: number, height: number): ViewportInput => ({ width, height, isTouch: false, accessMode: 'local' });

// Spec 070 AC-01 : profils du rapport d'audit 06 (barres de navigateur incluses) et profils historiques.
const TRUTH_TABLE: Array<[string, ViewportInput, LayoutRecipe, LayoutMode]> = [
  ['iPad 10,2" Safari paysage', touch(1080, 750), 'arena', 'tablet'],
  ['iPad 10,2" PWA paysage', touch(1080, 810), 'arena', 'tablet'],
  ['iPad 10,2" portrait', touch(810, 1010), 'stack', 'tablet'],
  ['iPad Pro 12,9" paysage', touch(1366, 950), 'arena', 'tablet'],
  ['iPad Pro 12,9" portrait', touch(1024, 1292), 'stack-wide', 'tablet'],
  ['Galaxy Tab Chrome paysage', touch(1280, 696), 'arena', 'tablet'],
  ['Galaxy Tab paysage barres réduites', touch(1280, 752), 'arena', 'tablet'],
  ['Galaxy Tab plein écran', touch(1280, 800), 'arena', 'tablet'],
  ['Galaxy Tab portrait', touch(800, 1176), 'stack', 'tablet'],
  ['petite tablette paysage', touch(960, 520), 'arena', 'tablet'],
  ['tablette 7" paysage', touch(1024, 600), 'arena', 'tablet'],
  ['tablette 7" portrait', touch(600, 880), 'stack', 'tablet'],
  ['iPad mini portrait', touch(744, 1133), 'stack', 'tablet'],
  ['téléphone portrait', touch(390, 844), 'stack', 'smartphone'],
  ['téléphone paysage', touch(844, 390), 'phone-landscape', 'smartphone'],
  ['grand téléphone paysage', touch(932, 430), 'phone-landscape', 'smartphone'],
  ['petit téléphone', touch(320, 568), 'stack', 'smartphone'],
  ['portable 125 % (pointeur fin)', pointer(1536, 620), 'arena', 'default'],
  ['bureau (pointeur fin)', pointer(1440, 900), 'arena', 'default'],
  ['fenêtre de bureau étroite', pointer(700, 900), 'stack', 'smartphone'],
];

describe('resolveViewportClass', () => {
  it.each(TRUTH_TABLE)('%s → recette %s, présentation %s', (_label, input, recipe, layoutMode) => {
    expect(resolveViewportClass(input)).toMatchObject({ recipe, layoutMode });
  });

  it('dérive les classes de largeur, de hauteur et la densité des seuils nommés', () => {
    expect(resolveViewportClass(touch(1080, 750))).toEqual({
      widthClass: 'expanded',
      heightClass: 'medium',
      orientation: 'landscape',
      input: 'touch',
      density: 'compact',
      recipe: 'arena',
      layoutMode: 'tablet',
    });
    expect(resolveViewportClass(touch(1366, 950))).toMatchObject({ widthClass: 'large', heightClass: 'expanded', density: 'spacious' });
    expect(resolveViewportClass(touch(960, 520)).density).toBe('tight');
    expect(resolveViewportClass(touch(1280, 800)).density).toBe('comfortable');
    expect(resolveViewportClass(touch(390, 844))).toMatchObject({ widthClass: 'compact', orientation: 'portrait' });
    expect(resolveViewportClass(touch(700, 700))).toMatchObject({ widthClass: 'medium', orientation: 'landscape', recipe: 'stack' });
  });

  it('dedicated_tablet ne force que la modalité tactile, jamais la structure (Q1)', () => {
    expect(resolveViewportClass({ ...pointer(1440, 900), accessMode: 'dedicated_tablet' })).toMatchObject({
      input: 'touch',
      layoutMode: 'tablet',
      recipe: 'arena',
    });
    expect(resolveViewportClass({ ...touch(390, 844), accessMode: 'dedicated_tablet' })).toMatchObject({
      layoutMode: 'smartphone',
      recipe: 'stack',
    });
  });

  it('retombe sur stack tactile pour des valeurs nulles et sur tactile sans matchMedia (§14)', () => {
    expect(resolveViewportClass(touch(0, 0))).toMatchObject({ recipe: 'stack', input: 'touch' });
    expect(resolveViewportClass(touch(Number.NaN, 800))).toMatchObject({ recipe: 'stack', input: 'touch' });
    expect(resolveViewportClass({ width: 1080, height: 750, isTouch: null, accessMode: 'local' }).input).toBe('touch');
  });

  it('publie le contrat d’attributs racine', () => {
    expect(getViewportDataAttributes(resolveViewportClass(touch(1080, 750)))).toEqual({
      'data-layout': 'tablet',
      'data-size-w': 'expanded',
      'data-size-h': 'medium',
      'data-orientation': 'landscape',
      'data-input': 'touch',
      'data-density': 'compact',
      'data-recipe': 'arena',
    });
  });
});
