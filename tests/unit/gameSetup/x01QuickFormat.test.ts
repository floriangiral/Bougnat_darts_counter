import { describe, expect, it, vi } from 'vitest';

import { createInitialSetupState, setupReducer } from '../../../src/features/game-setup/setupModel';
import {
  extractX01QuickFormat,
  isStandardX01QuickFormat,
  isX01QuickFormatEligible,
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
  it('ne retient que le simple à 2 joueurs sans robot (Q2)', () => {
    const base = { isDoubles: false, playerNames: ['A', 'B'], playAgainstBot: false };
    expect(isX01QuickFormatEligible(base)).toBe(true);
    expect(isX01QuickFormatEligible({ ...base, playerNames: ['A', 'B', 'C'] })).toBe(false);
    expect(isX01QuickFormatEligible({ ...base, isDoubles: true })).toBe(false);
    expect(isX01QuickFormatEligible({ ...base, playAgainstBot: true })).toBe(false);
  });

  it('extrait le format sans prénoms ni robot (Q1, AC-07)', () => {
    const state = { ...createInitialSetupState(), playerNames: ['Alice', 'Bruno'], playAgainstBot: true, legsToWin: 2 };
    const format = extractX01QuickFormat(state);
    expect(format).toEqual(twoLegs);
    expect(serializeX01QuickFormat(format)).not.toContain('Alice');
    expect(Object.keys(format)).not.toContain('playAgainstBot');
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
  });

  it('relit un format sérialisé et refuse un contenu illisible ou d’une autre version (AC-06)', () => {
    expect(parseX01QuickFormat(serializeX01QuickFormat(twoLegs))).toEqual(twoLegs);
    expect(parseX01QuickFormat(null)).toBeNull();
    expect(parseX01QuickFormat('')).toBeNull();
    expect(parseX01QuickFormat('{pas du json')).toBeNull();
    expect(parseX01QuickFormat('null')).toBeNull();
    expect(parseX01QuickFormat(JSON.stringify({ ...twoLegs, v: 2 }))).toBeNull();
    expect(parseX01QuickFormat(JSON.stringify({ v: 1, ...twoLegs, legsToWin: -3 }))).toBeNull();
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
  });

  it('applique un format en partie rapide : simple à 2, sans robot, champs « Perso » remplis', () => {
    const start = { ...createInitialSetupState(), playerNames: ['Alice', 'Bruno', 'Chloé'], playAgainstBot: true };
    const custom = setupReducer(start, {
      type: 'apply_x01_quick_format',
      format: { ...STANDARD_X01_QUICK_FORMAT, startingScore: 1001, legsToWin: 7, maxVisitsPerLeg: 12 },
    });
    expect(custom).toMatchObject({
      startingScore: 1001, customScoreStr: '1001', legsToWin: 7, customLegsStr: '7', maxVisitsPerLeg: 12,
      customMaxVisitsStr: '12', playerNames: ['Alice', 'Bruno'], playAgainstBot: false, isDoubles: false,
    });

    const presets = setupReducer(start, {
      type: 'apply_x01_quick_format',
      format: { ...STANDARD_X01_QUICK_FORMAT, startingScore: 701, legsToWin: 2, maxVisitsPerLeg: 15, checkOut: 'Master' },
    });
    expect(presets).toMatchObject({ startingScore: 701, customScoreStr: '170', legsToWin: 2, customLegsStr: '3', customMaxVisitsStr: '25', checkOut: 'Master' });
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
