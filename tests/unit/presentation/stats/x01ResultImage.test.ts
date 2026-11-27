// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MatchState } from '../../../../types';
import { buildX01ResultImageModel } from '../../../../src/presentation/stats/x01ResultImageModel.fr';
import type { X01ResultImageModel } from '../../../../src/presentation/stats/x01ResultImageModel.fr';
import {
  createX01ResultImage,
  layoutX01ResultSheet,
  paintX01ResultSheet,
  SHEET_WIDTH,
} from '../../../../src/presentation/stats/x01ResultImage.fr';
import type { MeasureText, SheetOp, X01ResultSheet } from '../../../../src/presentation/stats/x01ResultImage.fr';
import { parseQrSvgModules, X01_RESULT_QR_MODULES, X01_RESULT_QR_URL } from '../../../../src/presentation/stats/x01ResultQr';
import qr from '../../../../src/presentation/stats/x01ResultQr.svg?raw';
import { baseConfig, player, playMatch } from './x01ResultSheetFixtures';

const now = new Date(2026, 10, 27);
// Largeur moyenne d'un caractère proche de celle d'Arial gras.
const measure: MeasureText = (text, size) => Array.from(text).length * size * 0.56;
const qrcode = createRequire(import.meta.url)('qrcode') as {
  toString: (value: string, options: object) => Promise<string>;
  create: (value: string, options: object) => { modules: { size: number; get: (row: number, column: number) => number } };
};

const duel = () => playMatch([player('a', 'Alice'), player('b', 'Bruno')], baseConfig, 11);
const four = () => {
  const match = playMatch(
    [player('a', 'Alice'), player('b', 'Bruno'), player('c', 'Chloé'), player('d', 'Dominique-Alexandre')],
    { ...baseConfig, legsToWin: 2, maxVisitsPerLeg: 15 },
    9,
  );
  // Deux restes égaux : ex aequo au classement calculé.
  return { ...match, currentLeg: { ...match.currentLeg, scores: { ...match.currentLeg.scores, c: match.currentLeg.scores.a } } };
};
const doubles = () => playMatch(
  [player('a', 'Alice', 't1'), player('b', 'Bruno', 't2'), player('c', 'Chloé', 't1'), player('d', 'Dominique', 't2')],
  { ...baseConfig, isDoubles: true },
  13,
);
const sheetOf = (match: MatchState) => layoutX01ResultSheet(buildX01ResultImageModel(match, now), measure);
const textOps = (sheet: X01ResultSheet) => sheet.ops.filter((op): op is Extract<SheetOp, { kind: 'text' }> => op.kind === 'text');
const qrOp = (sheet: X01ResultSheet) => sheet.ops.find((op): op is Extract<SheetOp, { kind: 'qr' }> => op.kind === 'qr');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('feuille de match X01 : mise en page', () => {
  it('reste dans les dimensions prévues pour un duel, quatre joueurs, un solo et un 2 contre 2', () => {
    const solo = playMatch([player('a', 'Alice')], { ...baseConfig, legsToWin: 1 }, 2);
    const sets = playMatch([player('a', 'Alice'), player('b', 'Bruno', 'b', true)], { ...baseConfig, matchMode: 'SETS', setsToWin: 2 }, 17);
    for (const match of [duel(), four(), solo, sets]) {
      const sheet = sheetOf(match);
      expect(sheet.width).toBe(1080);
      expect(sheet.height).toBeLessThanOrEqual(1920);
    }
    const team = sheetOf(doubles());
    expect(team.height).toBeGreaterThan(1920);
    expect(team.height).toBeLessThanOrEqual(2450);
  });

  it('garde des corps lisibles après réduction et ne sort jamais de la largeur', () => {
    for (const sheet of [sheetOf(duel()), sheetOf(four()), sheetOf(doubles())]) {
      const texts = textOps(sheet);
      expect(Math.min(...texts.map((op) => op.size))).toBeGreaterThanOrEqual(26);
      for (const op of texts) {
        const width = measure(op.text, op.size, op.weight);
        const left = op.align === 'center' ? op.x - width / 2 : op.align === 'right' ? op.x - width : op.x;
        expect(left).toBeGreaterThanOrEqual(0);
        expect(left + width).toBeLessThanOrEqual(SHEET_WIDTH);
      }
      // Valeurs du tableau (hors détail « Checkout à 1 · 2 · 3 fléchettes ») en 30 px au moins.
      expect(texts.filter((op) => /^\d+(,\d)?$/.test(op.text)).every((op) => op.size >= 30)).toBe(true);
    }
  });

  it('place une seule fois la date, les règles et la durée, sans titre redondant', () => {
    const texts = textOps(sheetOf(duel())).map((op) => op.text);
    expect(texts.filter((text) => text.includes('27/11/2026'))).toEqual(['27/11/2026 · Durée 23:04']);
    expect(texts).toContain('501 · Premier à 3 manches · Sortie double');
    expect(texts.some((text) => /BOUGNAT|MATCH TERMINÉ/.test(text))).toBe(false);
    expect(texts).toContain('VAINQUEUR');
    expect(texts).toContain('Jouez sur');
    expect(texts).toContain('play.bougnatdarts.fr');
  });

  it('réduit puis renvoie à la ligne les noms longs sans jamais les tronquer', () => {
    const name = 'Jean-Christophe Dupont-Moretti de la Fontaine';
    const match = playMatch([player('a', name), player('b', 'Bruno')], baseConfig, 11);
    const sheet = sheetOf(match);
    const lines = textOps(sheet).filter((op) => name.includes(op.text) && op.text.length > 3);
    // Le nom apparaît dans le bandeau et l'en-tête du tableau, coupé entre les mots.
    expect(lines.filter((op) => op.size === 32 && op.align === 'left').map((op) => op.text).join(' ')).toBe(name);
    expect(lines.filter((op) => op.align === 'center').map((op) => op.text).join(' ')).toBe(name);
    expect(sheet.height).toBeLessThanOrEqual(1920);
  });

  it('coupe un mot trop long après ses traits d’union, puis entre les caractères', () => {
    const name = `${'Très-'.repeat(8)}${'x'.repeat(40)}`;
    const sheet = sheetOf(playMatch([player('a', name), player('b', 'Bruno')], baseConfig, 11));
    const header = textOps(sheet).filter((op) => op.align === 'left' && op.size === 32 && name.includes(op.text));
    expect(header.map((op) => op.text).join('')).toBe(name);
    expect(header[0].text.endsWith('-')).toBe(true);
  });

  it('signale une erreur explicite plutôt qu’une image tronquée', () => {
    const model = buildX01ResultImageModel(duel(), now);
    const tooLong: X01ResultImageModel = { ...model, tables: Array.from({ length: 30 }, () => model.tables[0]) };
    expect(() => layoutX01ResultSheet(tooLong, measure)).toThrow('limites');
    expect(() => layoutX01ResultSheet(model, (text, size) => (text.length > 0 ? 2000 : size))).toThrow('limites');
  });

  it('dessine le QR officiel de 333 px, marge blanche de 4 modules comprise, dans un pied de page dédié', async () => {
    const svg = await qrcode.toString(X01_RESULT_QR_URL, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' });
    expect(qr).toBe(svg);
    const { modules } = qrcode.create('https://play.bougnatdarts.fr', { errorCorrectionLevel: 'M' });
    expect(X01_RESULT_QR_MODULES).toHaveLength(modules.size + 8);
    X01_RESULT_QR_MODULES.forEach((row, rowIndex) => row.forEach((dark, column) => {
      const inside = rowIndex >= 4 && column >= 4 && rowIndex < modules.size + 4 && column < modules.size + 4;
      expect(dark).toBe(inside && modules.get(rowIndex - 4, column - 4) === 1);
    }));
    const sheet = sheetOf(duel());
    const op = qrOp(sheet);
    expect(op?.module).toBe(9);
    expect((op?.modules.length ?? 0) * (op?.module ?? 0)).toBe(333);
    expect(sheet.height - (op?.y ?? 0)).toBeGreaterThanOrEqual(333);
    expect(() => parseQrSvgModules('<svg></svg>')).toThrow('QR');
    expect(() => parseQrSvgModules('<svg viewBox="0 0 2 2"><path stroke="#000000" d="M1 1.5h4"/></svg>')).toThrow('QR');
  });
});

/** Contexte canvas factice : enregistre les appels de dessin. */
const fakeContext = (alpha = 255) => {
  const calls: Array<[string, unknown[]]> = [];
  const gradient = { addColorStop: vi.fn() };
  const target: Record<string, unknown> = {
    font: '10px Arial',
    measureText: (text: string) => ({ width: text.length * Number(/(\d+)px/.exec(String(target.font))?.[1] ?? 10) * 0.56 }),
    createLinearGradient: () => gradient,
    getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, alpha]) }),
  };
  const context = new Proxy(target, {
    get: (object, key: string) => (key in object ? object[key] : (...args: unknown[]) => { calls.push([key, args]); }),
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
};

describe('feuille de match X01 : rendu Canvas 2D', () => {
  it('dessine directement le fond, les textes, le logo en primitives et le QR module par module', () => {
    const sheet = sheetOf(four());
    const { context, calls } = fakeContext();
    paintX01ResultSheet(context, sheet);
    const names = calls.map(([name]) => name);
    expect(names).not.toContain('drawImage');
    expect(calls[0]).toEqual(['fillRect', [0, 0, 1080, sheet.height]]);
    const texts = calls.filter(([name]) => name === 'fillText').map(([, args]) => args[0]);
    expect(texts).toEqual(expect.arrayContaining(['BOUGNAT', 'DARTS', '1er', 'ex aequo', 'play.bougnatdarts.fr']));
    const op = qrOp(sheet);
    const darkRuns = X01_RESULT_QR_MODULES.flatMap((row) => row.map((dark, index) => dark && !row[index - 1])).filter(Boolean).length;
    const qrRects = calls.filter(([name, args]) => name === 'fillRect' && Number(args[0]) >= (op?.x ?? 0) && Number(args[1]) >= (op?.y ?? 0) && Number(args[3]) === 9);
    expect(qrRects).toHaveLength(darkRuns);
    expect(names).toEqual(expect.arrayContaining(['arc', 'arcTo', 'quadraticCurveTo', 'rotate', 'stroke']));
  });
});

describe('createX01ResultImage', () => {
  const mockCanvas = (alpha = 255) => {
    const fake = fakeContext(alpha);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fake.context);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })));
    return fake;
  };

  it('retourne un PNG daté, mesuré et dessiné par le canvas', async () => {
    const { calls } = mockCanvas();
    const file = await createX01ResultImage(duel(), now);
    expect(file).toMatchObject({ name: 'bougnat-darts-x01-2026-11-27.png', type: 'image/png' });
    expect(calls.some(([name]) => name === 'fillText')).toBe(true);
  });

  it('propage les limites et les échecs de génération', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(createX01ResultImage(duel(), now)).rejects.toThrow('pas disponible');
    mockCanvas(0);
    await expect(createX01ResultImage(duel(), now)).rejects.toThrow('limites');
    mockCanvas();
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null));
    await expect(createX01ResultImage(duel(), now)).rejects.toThrow('PNG complet');
    mockCanvas();
    vi.spyOn(HTMLCanvasElement.prototype, 'height', 'get').mockReturnValue(1);
    await expect(createX01ResultImage(duel(), now)).rejects.toThrow('limites');
  });
});
