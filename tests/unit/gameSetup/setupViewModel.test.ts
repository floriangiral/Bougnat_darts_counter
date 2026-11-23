import { describe, expect, it } from 'vitest';

import {
  buildSetupSummaryEntries,
  buildTeamStarterOptions,
  canEnableBotOpponent,
  getBotLevelLabel,
  getBotOpponentBlockReason,
  getBotPlayerCountBlockReason,
  getSetupPlayerCountOptions,
  supportsDoublesMode,
} from '../../../src/features/game-setup/setupViewModel';

describe('setup view model', () => {
  it('résume la limite de volées X01 seulement quand elle est choisie', () => {
    expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'X01', maxVisitsPerLeg: 15 })).toContainEqual(
      { label: 'Volées par manche', value: '15 (départage au bull)' },
    );
    expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'X01', maxVisitsPerLeg: null })
      .some((entry) => entry.label === 'Volées par manche')).toBe(false);
  });

  const summaryDefaults = {
    startingScore: 301,
    matchMode: 'LEGS',
    legsToWin: 3,
    setsToWin: 2,
    cricketRounds: 10,
    isDoubles: false,
    playerCount: 3,
    checkIn: 'Open',
    checkOut: 'Double',
  } as const;

  it('summarizes each remaining game and format with the configured values', () => {
    expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'X01', isDoubles: true })).toContainEqual(
      { label: 'Manches pour gagner', value: 3 },
    );
    expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'X01', isDoubles: true })).toContainEqual(
      { label: 'Mode', value: 'Doublettes' },
    );
    for (const isDoubles of [false, true]) {
      expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'CRICKET', isDoubles })).toEqual([
        { label: 'Jeu', value: 'Cricket' },
        { label: 'Nombre de tours', value: 10 },
        { label: 'Nombre de joueurs', value: isDoubles ? 4 : 3 },
        { label: 'Mode', value: isDoubles ? 'Doublettes' : 'Simple' },
      ]);
      expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'GOTCHA', isDoubles })).toEqual([
        { label: 'Jeu', value: 'Gotcha' },
        { label: 'Score cible', value: 301 },
        { label: 'Nombre de joueurs', value: 3 },
        { label: 'Mode', value: isDoubles ? 'Doublettes' : 'Simple' },
      ]);
    }
    expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'TRIATHLON' })).toContainEqual(
      { label: 'Format', value: 'Individuel' },
    );
    expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'CAPITAL' })).toEqual([{ label: 'Jeu', value: 'Capital' }]);
    expect(buildSetupSummaryEntries({ ...summaryDefaults, gameType: 'KILLER' })).toEqual([{ label: 'Jeu', value: 'Killer' }]);
  });

  it('provides player options and bot level fallbacks for every supported mode', () => {
    expect(getSetupPlayerCountOptions('GOTCHA')).toEqual([2, 3, 4, 5, 6]);
    expect(getSetupPlayerCountOptions('TRIATHLON')).toEqual([2]);
    expect(getSetupPlayerCountOptions('CAPITAL')).toEqual([1, 2, 3, 4]);
    expect(getBotLevelLabel([{ level: 'PRO', label: 'Professionnel' }], 'PRO')).toBe('Professionnel');
    expect(getBotLevelLabel([], 'PRO')).toBe('Amateur');
  });

  it('keeps the player count options aligned with game constraints', () => {
    expect(getSetupPlayerCountOptions('X01')).toEqual([1, 2, 3, 4]);
    expect(getSetupPlayerCountOptions('CRICKET')).toEqual([2, 3, 4]);
    expect(getSetupPlayerCountOptions('KILLER')).toEqual([2, 3, 4, 5, 6]);
  });

  it('exposes doubles and bot capabilities by game type', () => {
    expect(supportsDoublesMode('TRIATHLON')).toBe(true);
    expect(supportsDoublesMode('GOTCHA')).toBe(false);
    expect(canEnableBotOpponent('X01', false)).toBe(true);
    expect(canEnableBotOpponent('X01', true)).toBe(false);
    expect(canEnableBotOpponent('KILLER', false)).toBe(false);
    expect(getBotOpponentBlockReason('Open')).toBeNull();
    expect(getBotOpponentBlockReason('Double')).toContain('Robot indisponible');
    expect(getBotOpponentBlockReason('Master')).toContain('ouverture Open');
    expect(getBotPlayerCountBlockReason('X01', 2)).toBeNull();
    expect(getBotPlayerCountBlockReason('X01', 3)).toContain('uniquement à 2 joueurs');
    expect(getBotPlayerCountBlockReason('CAPITAL', 4)).toBeNull();
  });

  it('builds starter labels without leaking fallback logic into the view', () => {
    expect(buildTeamStarterOptions('team1', ['Alice', ''])).toEqual([
      { id: 't1p1', label: 'Alice' },
      { id: 't1p2', label: 'Joueur 2' },
    ]);
    expect(buildTeamStarterOptions('team2', ['', 'Dan'])).toEqual([
      { id: 't2p1', label: 'Joueur 3' },
      { id: 't2p2', label: 'Dan' },
    ]);
  });

  it('builds summary rows for X01 and Triathlon without changing labels', () => {
    expect(buildSetupSummaryEntries({
      gameType: 'X01',
      startingScore: 501,
      matchMode: 'SETS',
      legsToWin: 5,
      setsToWin: 3,
      cricketRounds: 20,
      isDoubles: false,
      playerCount: 2,
      checkIn: 'Open',
      checkOut: 'Double',
    })).toEqual([
      { label: 'Jeu', value: 'X01' },
      { label: 'Score de départ', value: 501 },
      { label: 'Format', value: 'Sets' },
      { label: 'Sets pour gagner', value: 3 },
      { label: 'Manches Par Set', value: 5 },
      { label: 'Ouverture / Fermeture', value: 'Open / Double' },
      { label: 'Mode', value: 'Simple' },
    ]);

    expect(buildSetupSummaryEntries({
      gameType: 'TRIATHLON',
      startingScore: 501,
      matchMode: 'LEGS',
      legsToWin: 1,
      setsToWin: 1,
      cricketRounds: 20,
      isDoubles: true,
      playerCount: 2,
      checkIn: 'Open',
      checkOut: 'Double',
    })).toEqual([
      { label: 'Jeu', value: 'Triathlon' },
      { label: 'Ordre Des Jeux', value: 'Capital / Cricket / 501' },
      { label: 'Format', value: 'Doublettes' },
    ]);
  });
});
