import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Specs 063 (AC-01, AC-06), 066 (NFR-01) et 068 (AC-01, FR-01, FR-02) : structure des tokens et
// matrice de contraste des paires déclarées, calculée sur les valeurs réelles des deux thèmes.

const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), 'utf8');
const PRIMITIVES = read('src/styles/tokens/primitives.css');
const THEMES = read('src/styles/tokens/themes.css');
const BRIDGE = read('src/styles/tokens/bridge.css');
const TAILWIND = read('src/styles/tailwind.css');

const [DARK_BLOCK, LIGHT_BLOCK] = THEMES.split("[data-theme='light'] {");

const declarations = (css: string) => Object.fromEntries(
  [...css.matchAll(/--bd-([a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
);

const PRIMITIVE_VALUES = declarations(PRIMITIVES);
const DARK = { ...PRIMITIVE_VALUES, ...declarations(DARK_BLOCK) };
const LIGHT = { ...DARK, ...declarations(LIGHT_BLOCK) };
const THEMES_BY_NAME = { dark: DARK, light: LIGHT } as const;

type Rgba = [number, number, number, number];

const resolveValue = (values: Record<string, string>, name: string): string => {
  let value = values[name];
  for (let match = /^var\(--bd-([a-z0-9-]+)\)$/.exec(value ?? ''); match; match = /^var\(--bd-([a-z0-9-]+)\)$/.exec(value)) {
    value = values[match[1]];
  }
  if (!value) throw new Error(`rôle --bd-${name} non résolu`);
  return value;
};

const parseColor = (value: string): Rgba => {
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)).concat(1) as Rgba;
  }
  const parts = /rgba?\(([^)]+)\)/.exec(value)?.[1].split(',').map(Number);
  if (!parts) throw new Error(`couleur illisible : ${value}`);
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
};

const luminance = ([r, g, b]: Rgba) => {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

const contrast = (values: Record<string, string>, foreground: string, background: string) => {
  const bg = parseColor(resolveValue(values, background));
  const fgRaw = parseColor(resolveValue(values, foreground));
  const fg = [0, 1, 2].map((i) => fgRaw[i] * fgRaw[3] + bg[i] * (1 - fgRaw[3])).concat(1) as Rgba;
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

// [texte ou indicateur, fond, seuil] — 4,5 texte courant, 7 scores, 3 non-texte et texte gras d'action.
const DECLARED_PAIRS: Array<[string, string, number]> = [
  ['fg', 'canvas', 7],
  ['fg', 'surface', 7],
  ['fg', 'surface-raised', 4.5],
  ['fg-soft', 'surface', 4.5],
  ['fg-muted', 'surface', 4.5],
  ['fg-subtle', 'canvas', 4.5],
  ['fg-subtle', 'surface-raised', 4.5],
  ['fg-faint', 'canvas', 4.5],
  ['fg-faint', 'surface', 4.5],
  ['fg-faint', 'surface-raised', 4.5],
  ['fg-inverse', 'fg', 4.5],
  ['brand-fg', 'canvas', 4.5],
  ['brand-fg', 'surface', 4.5],
  ['brand-fg-soft', 'surface', 4.5],
  ['brand-fg-faint', 'surface', 4.5],
  ['on-brand', 'brand-2', 4.5],
  // Libellés d'action en capitales grasses sur le dégradé « feu » : 3:1 (le Dark d'origine est conservé).
  ['on-brand', 'brand-strong', 3],
  ['danger-fg', 'surface', 4.5],
  ['danger-fg-soft', 'surface', 4.5],
  ['success-fg', 'surface', 4.5],
  ['warning-fg', 'surface', 4.5],
  ['info-fg', 'surface', 4.5],
  ['on-danger', 'danger-strong', 4.5],
  ['on-success', 'success', 4.5],
  ['game-score', 'canvas', 7],
  ['game-score', 'surface', 7],
  ['game-score-inactive', 'canvas', 4.5],
  ['game-score-inactive', 'surface', 4.5],
  ['game-single-fg', 'game-single', 4.5],
  ['game-double-fg', 'surface-raised', 4.5],
  ['game-triple-fg', 'surface-raised', 4.5],
  ['game-bull-fg', 'surface-raised', 4.5],
  ['game-dbull-fg', 'surface-raised', 4.5],
  ['on-game', 'game-bull', 4.5],
  ['on-game', 'game-dbull', 4.5],
  ['game-bust-fg', 'surface', 4.5],
  ['game-closed-fg', 'surface', 4.5],
  ['game-win', 'surface', 3],
  ['game-active', 'canvas', 3],
  ['game-dead', 'surface', 1.5],
  ['focus-ring', 'canvas', 3],
  ['focus-ring', 'surface', 3],
  ...(['x01', 'triathlon', 'cricket', 'capital', 'gotcha', 'killer'] as const)
    .map((game): [string, string, number] => [`game-${game}-fg`, 'surface', 4.5]),
];

describe('tokens de design (spec 063)', () => {
  const darkRoles = Object.keys(declarations(DARK_BLOCK));
  const lightRoles = new Set(Object.keys(declarations(LIGHT_BLOCK)));

  it('déclare chaque rôle dans les deux thèmes (068 FR-01)', () => {
    expect(darkRoles.length).toBeGreaterThan(80);
    expect(darkRoles.filter((role) => !lightRoles.has(role))).toEqual([]);
  });

  it('expose chaque rôle de couleur au pont Tailwind et rien d’autre', () => {
    const bridged = [...BRIDGE.matchAll(/var\(--bd-([a-z0-9-]+)\)/g)].map((match) => match[1]);
    const expected = darkRoles.filter((role) => !['ambient', 'ambient-hot', 'theme-color'].includes(role));
    expect(new Set(bridged)).toEqual(new Set(expected));
    expect(BRIDGE).toContain('@theme inline');
  });

  it('couvre les rôles minimaux et l’espace game-* (FR-02, spec 066 FR-01)', () => {
    for (const role of ['canvas', 'surface', 'surface-raised', 'surface-sunken', 'scrim', 'border-subtle', 'border', 'border-strong',
      'fg', 'fg-muted', 'fg-subtle', 'fg-disabled', 'fg-inverse', 'brand', 'brand-2', 'brand-fg', 'on-brand', 'brand-subtle',
      'success', 'danger', 'warning', 'info', 'focus-ring', 'game-double', 'game-triple', 'game-bull', 'game-dbull', 'game-bust',
      'game-closed', 'game-dead', 'game-eliminated', 'game-win', 'game-active', 'game-score', 'game-score-inactive']) {
      expect(darkRoles, role).toContain(role);
    }
  });

  it('utilise des primitives hexadécimales et aucune fonction moderne (NFR-01, AC-06)', () => {
    const colors = Object.entries(PRIMITIVE_VALUES).filter(([name]) => !name.startsWith('duration'));
    expect(colors.every(([, value]) => /^#[0-9a-f]{6}$/.test(value))).toBe(true);
    for (const css of [PRIMITIVES, THEMES, BRIDGE]) {
      expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/color-mix\(|oklch\(|lab\(/);
    }
  });

  it('déclare le fond de page une seule fois, sur les rôles (FR-06)', () => {
    expect(TAILWIND.match(/^body\s*{/gm)).toHaveLength(1);
    expect(TAILWIND).toContain('background-color: var(--bd-canvas)');
  });

  it('aligne theme-color sur le canvas de chaque thème (spec 069 FR-04)', () => {
    expect(resolveValue(DARK, 'theme-color')).toBe(resolveValue(DARK, 'canvas'));
    expect(resolveValue(LIGHT, 'theme-color')).toBe(resolveValue(LIGHT, 'canvas'));
  });
});

describe('matrice de contraste (spec 068 AC-01)', () => {
  for (const theme of ['dark', 'light'] as const) {
    it.each(DECLARED_PAIRS)(`${theme} : %s sur %s ≥ %s:1`, (foreground, background, minimum) => {
      expect(contrast(THEMES_BY_NAME[theme], foreground, background)).toBeGreaterThanOrEqual(minimum);
    });
  }
});
