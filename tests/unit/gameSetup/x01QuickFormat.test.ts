import { describe, expect, it, vi } from 'vitest';

import { createInitialSetupState, setupReducer } from '../../../src/features/game-setup/setupModel';
import {
  extractX01QuickFormat,
  isStandardX01QuickFormat,
  parseX01QuickFormat,
  serializeX01QuickFormat,
  STANDARD_X01_QUICK_FORMAT,
  toValidX01QuickFormat,
  X01_QUICK_FORMAT_STORAGE_KEY,
  type X01QuickFormat,
} from '../../../src/features/game-setup/x01QuickFormat';
import {
  clearX01QuickFormat,
  readX01QuickFormat,
  writeX01QuickFormat,
} from '../../../src/infrastructure/local/x01QuickFormatStore';

const twoLegs: X01QuickFormat = { ...STANDARD_X01_QUICK_FORMAT, legsToWin: 2 };

const memoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
};

const throwingStorage = {
  getItem: () => { throw new Error('indisponible'); },
  setItem: () => { throw new Error('quota'); },
  removeItem: () => { throw new Error('indisponible'); },
};

describe('spec 133 — format de la partie rapide X01', () => {
  it('extrait la partie complète : règles, composition, prénoms, robot et niveau (Q1, Q6, Q7)', () => {
    const state = {
      ...createInitialSetupState(), playerNames: ['Alice', 'Bruno'], playAgainstBot: true, botLevel: 'CLUB' as const, legsToWin: 2,
    };
    expect(extractX01QuickFormat(state)).toEqual({
      ...twoLegs, playerNames: ['Alice', 'Bruno'], playAgainstBot: true, botLevel: 'CLUB',
    });
    const four = { ...createInitialSetupState(), playerNames: ['A', 'B', 'C', 'D'], startingScore: 170, legsToWin: 1, maxVisitsPerLeg: 10 };
    expect(extractX01QuickFormat(four)).toMatchObject({ playerNames: ['A', 'B', 'C', 'D'], startingScore: 170, maxVisitsPerLeg: 10 });
    // Comme au lancement, la limite de volées ne s'applique pas en solo.
    expect(extractX01QuickFormat({ ...four, playerNames: ['A'] }).maxVisitsPerLeg).toBeNull();
    expect(extractX01QuickFormat({ ...state, isDoubles: true }).playAgainstBot).toBe(false);
  });

  it('valide les bornes du format (RM-07)', () => {
    expect(toValidX01QuickFormat(twoLegs)).toEqual(twoLegs);
    expect(toValidX01QuickFormat({ ...twoLegs, startingScore: 2501, maxVisitsPerLeg: 99, matchMode: 'SETS' })).not.toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, startingScore: 1 })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, startingScore: 2502 })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, startingScore: 501.5 })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, legsToWin: 0 })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, setsToWin: 100 })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, matchMode: 'POINTS' })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, checkIn: 'Triple' })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, checkOut: undefined })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, maxVisitsPerLeg: 100 })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, maxVisitsPerLeg: undefined })).toBeNull();
    expect(toValidX01QuickFormat(null)).toBeNull();
    expect(toValidX01QuickFormat('501')).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, legsToWin: 99 })).not.toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, legsToWin: 100 })).toBeNull();
  });

  it('refuse une composition ou des prénoms incohérents (RM-07)', () => {
    expect(toValidX01QuickFormat({ ...twoLegs, playerNames: ['A', 'B', 'C', 'D'] })).not.toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playerNames: [] })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playerNames: ['A', 'B', 'C', 'D', 'E'] })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playerNames: ['A', 2] })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playerNames: ['x'.repeat(101), 'B'] })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, team1Names: ['A'] })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, isDoubles: 'oui' })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, botLevel: 'EXPERT' })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playAgainstBot: true, botLevel: 'PRO' })).not.toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playAgainstBot: true, isDoubles: true })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playAgainstBot: true, checkIn: 'Double' })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playAgainstBot: true, playerNames: ['A', 'B', 'C'] })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, playerNames: ['A'], maxVisitsPerLeg: 10 })).toBeNull();
    expect(toValidX01QuickFormat({ ...twoLegs, isDoubles: true, playerNames: ['A'], maxVisitsPerLeg: 10 })).not.toBeNull();
  });

  it('relit un format sérialisé et refuse un contenu illisible ou d’une autre version (AC-06)', () => {
    expect(parseX01QuickFormat(serializeX01QuickFormat(twoLegs))).toEqual(twoLegs);
    expect(parseX01QuickFormat(null)).toBeNull();
    expect(parseX01QuickFormat('')).toBeNull();
    expect(parseX01QuickFormat('{pas du json')).toBeNull();
    expect(parseX01QuickFormat('null')).toBeNull();
    expect(parseX01QuickFormat(JSON.stringify({ ...twoLegs, v: 3 }))).toBeNull();
    expect(parseX01QuickFormat(JSON.stringify({ ...twoLegs, v: 2, legsToWin: -3 }))).toBeNull();
  });

  it('relit un format de la version 1 comme un 1 contre 1 sans robot ni prénoms (RM-09)', () => {
    const legacy = { v: 1, startingScore: 701, matchMode: 'LEGS', legsToWin: 2, setsToWin: 3, checkIn: 'Open', checkOut: 'Master', maxVisitsPerLeg: null };
    expect(parseX01QuickFormat(JSON.stringify(legacy))).toEqual({
      ...STANDARD_X01_QUICK_FORMAT, startingScore: 701, legsToWin: 2, checkOut: 'Master',
    });
    expect(parseX01QuickFormat(JSON.stringify({ ...legacy, legsToWin: -3 }))).toBeNull();
  });

  it('reconnaît le standard, quel que soit le nombre de sets inutilisé (RM-08)', () => {
    expect(isStandardX01QuickFormat(STANDARD_X01_QUICK_FORMAT)).toBe(true);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, setsToWin: 5 })).toBe(true);
    expect(isStandardX01QuickFormat(twoLegs)).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, startingScore: 701 })).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, matchMode: 'SETS' })).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, checkIn: 'Double' })).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, checkOut: 'Master' })).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, maxVisitsPerLeg: 15 })).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, playerNames: ['Alice', 'Bruno'], botLevel: 'PRO' })).toBe(true);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, playerNames: ['A', 'B', 'C', 'D'] })).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, isDoubles: true })).toBe(false);
    expect(isStandardX01QuickFormat({ ...STANDARD_X01_QUICK_FORMAT, playAgainstBot: true })).toBe(false);
  });

  it('applique la partie mémorisée, composition et prénoms compris, champs « Perso » remplis', () => {
    const start = { ...createInitialSetupState(), playerNames: ['Xavier', 'Yann', 'Zoé'], playAgainstBot: true };
    const custom = setupReducer(start, {
      type: 'apply_x01_quick_format',
      format: { ...STANDARD_X01_QUICK_FORMAT, startingScore: 1001, legsToWin: 7, maxVisitsPerLeg: 12, playerNames: ['Alice', 'Bruno', 'Chloé', 'David'] },
    });
    expect(custom).toMatchObject({
      startingScore: 1001, customScoreStr: '1001', legsToWin: 7, customLegsStr: '7', maxVisitsPerLeg: 12,
      customMaxVisitsStr: '12', playerNames: ['Alice', 'Bruno', 'Chloé', 'David'], playAgainstBot: false, isDoubles: false,
    });

    const presets = setupReducer(start, {
      type: 'apply_x01_quick_format',
      format: { ...STANDARD_X01_QUICK_FORMAT, startingScore: 701, legsToWin: 2, maxVisitsPerLeg: 15, checkOut: 'Master' },
    });
    expect(presets).toMatchObject({ startingScore: 701, customScoreStr: '170', legsToWin: 2, customLegsStr: '3', customMaxVisitsStr: '25', checkOut: 'Master' });

    const bot = setupReducer(createInitialSetupState(), {
      type: 'apply_x01_quick_format',
      format: { ...STANDARD_X01_QUICK_FORMAT, playerNames: ['Alice', ''], playAgainstBot: true, botLevel: 'CONFIRME' },
    });
    expect(bot).toMatchObject({ playAgainstBot: true, botLevel: 'CONFIRME', playerNames: ['Alice', ''] });

    const doubles = setupReducer(createInitialSetupState(), {
      type: 'apply_x01_quick_format',
      format: { ...STANDARD_X01_QUICK_FORMAT, isDoubles: true, team1Names: ['A', 'B'], team2Names: ['C', 'D'] },
    });
    expect(doubles).toMatchObject({ isDoubles: true, team1Names: ['A', 'B'], team2Names: ['C', 'D'], playAgainstBot: false });
  });
});

describe('spec 133 — stockage du format', () => {
  it('écrit, relit et efface sous sa clé dédiée (AC-05)', () => {
    const storage = memoryStorage();
    expect(readX01QuickFormat(storage)).toBeNull();
    writeX01QuickFormat(twoLegs, storage);
    expect(storage.setItem).toHaveBeenCalledWith(X01_QUICK_FORMAT_STORAGE_KEY, expect.any(String));
    expect(readX01QuickFormat(storage)).toEqual(twoLegs);
    clearX01QuickFormat(storage);
    expect(readX01QuickFormat(storage)).toBeNull();
  });

  it('ne bloque jamais si le stockage est absent ou en erreur', () => {
    expect(readX01QuickFormat(null)).toBeNull();
    expect(readX01QuickFormat(throwingStorage)).toBeNull();
    expect(() => writeX01QuickFormat(twoLegs, throwingStorage)).not.toThrow();
    expect(() => clearX01QuickFormat(throwingStorage)).not.toThrow();
    expect(() => writeX01QuickFormat(twoLegs, null)).not.toThrow();
    expect(() => clearX01QuickFormat(null)).not.toThrow();
  });
});
