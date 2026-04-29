import { describe, expect, it } from 'vitest';

import {
  buildSetupSummaryEntries,
  buildTeamStarterOptions,
  canEnableBotOpponent,
  getSetupPlayerCountOptions,
  supportsDoublesMode,
} from '../../../src/features/game-setup/setupViewModel';

describe('setup view model', () => {
  it('keeps the player count options aligned with game constraints', () => {
    expect(getSetupPlayerCountOptions('X01')).toEqual([1, 2]);
    expect(getSetupPlayerCountOptions('CRICKET')).toEqual([2, 3]);
    expect(getSetupPlayerCountOptions('KILLER')).toEqual([2, 3, 4, 5, 6]);
  });

  it('exposes doubles and bot capabilities by game type', () => {
    expect(supportsDoublesMode('TRIATHLON')).toBe(true);
    expect(supportsDoublesMode('GOTCHA')).toBe(false);
    expect(canEnableBotOpponent('X01', false)).toBe(true);
    expect(canEnableBotOpponent('X01', true)).toBe(false);
    expect(canEnableBotOpponent('KILLER', false)).toBe(false);
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
      { label: 'Score De Depart', value: 501 },
      { label: 'Format', value: 'Sets' },
      { label: 'Sets Pour Gagner', value: 3 },
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