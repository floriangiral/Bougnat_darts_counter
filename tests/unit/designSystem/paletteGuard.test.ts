import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { countRawPalette, findRawPalette, mapRawClass, migrateText } from '../../../scripts/design-tokens/palette.mjs';
import { scanRawPalette } from '../../../scripts/design-tokens/check.mjs';

type Palette = {
  countRawPalette: (text: string) => number;
  findRawPalette: (text: string) => string[];
  mapRawClass: (raw: string) => string | null;
  migrateText: (text: string) => { output: string; unmapped: string[] };
};
const palette: Palette = { countRawPalette, findRawPalette, mapRawClass, migrateText };
const scan = scanRawPalette as (root: string) => Array<{ file: string; found: string[] }>;

// Specs 063 (AC-03, cliquet) et 065 (migration outillée).
describe('détection des classes de palette brute', () => {
  it('compte classes de palette, opacités et valeurs arbitraires colorées', () => {
    const source = 'className="bg-gray-800 hover:text-orange-500 !border-white/10 bg-white/[0.04] shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-[#06080d] bg-surface text-fg"';
    expect(palette.findRawPalette(source)).toEqual([
      'bg-gray-800', 'text-orange-500', 'border-white/10', 'bg-white/[0.04]',
      'shadow-[0_0_10px_rgba(0,0,0,0.5)]', 'bg-[#06080d]',
    ]);
    expect(palette.countRawPalette('bg-surface-raised text-game-triple-fg border-brand-border/40')).toBe(0);
  });
});

describe('table de correspondance', () => {
  it.each([
    ['text-white', 'text-fg'],
    ['text-gray-500', 'text-fg-faint'],
    ['bg-gray-900', 'bg-surface'],
    ['bg-black/90', 'bg-overlay'],
    ['bg-black/40', 'bg-scrim'],
    ['bg-white/5', 'bg-surface-tint'],
    ['bg-white/[0.07]', 'bg-surface-tint-strong'],
    ['border-white/10', 'border-border-subtle'],
    ['border-gray-700', 'border-border-strong'],
    ['bg-orange-500/10', 'bg-brand-subtle'],
    ['text-orange-400', 'text-brand-fg-soft'],
    ['text-green-500/50', 'text-success-fg/50'],
    ['from-orange-600', 'from-brand-strong'],
    ['to-red-600', 'to-brand-2'],
  ])('%s → %s', (raw, role) => {
    expect(palette.mapRawClass(raw)).toBe(role);
  });

  it('laisse les cas métier ambigus à la migration manuelle', () => {
    expect(palette.mapRawClass('text-cyan-300')).toBeNull();
    expect(palette.mapRawClass('from-violet-500')).toBeNull();
    expect(palette.mapRawClass('bg-gray-800/40')).toBe('bg-surface-inset');
    const { output, unmapped } = palette.migrateText('hover:bg-gray-700 text-cyan-300');
    expect(output).toBe('hover:bg-surface-strong text-cyan-300');
    expect(unmapped).toEqual(['text-cyan-300']);
  });
});

describe('cliquet (scan d’un dépôt factice)', () => {
  let root = '';
  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('signale chaque fichier source contenant une couleur brute, hors tests', () => {
    root = mkdtempSync(path.join(tmpdir(), 'bd-tokens-'));
    mkdirSync(path.join(root, 'components'));
    for (const dir of ['views', 'src', 'utils']) mkdirSync(path.join(root, dir));
    writeFileSync(path.join(root, 'App.tsx'), 'const a = "bg-canvas";');
    writeFileSync(path.join(root, 'components', 'Bad.tsx'), 'const b = "bg-gray-800 text-white";');
    writeFileSync(path.join(root, 'components', 'Bad.test.tsx'), 'const c = "bg-gray-800";');
    expect(scan(root)).toEqual([{ file: path.join('components', 'Bad.tsx'), found: ['bg-gray-800', 'text-white'] }]);
  });
});
