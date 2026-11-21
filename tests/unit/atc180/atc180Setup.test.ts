// Spec ref: specs/130-counter-180-around-the-clock (FR-02 : configuration de 1 à 4 joueurs, sans variante).
import { describe, expect, it } from 'vitest';

import {
  createInitialSetupState,
  getSimplePlayerBounds,
  setupReducer,
} from '../../../src/features/game-setup/setupModel';
import { getGameName, getRulesContent } from '../../../src/features/game-setup/setupPresentation';
import {
  buildSetupSummaryEntries,
  getSetupPlayerCountOptions,
  supportsDoublesMode,
} from '../../../src/features/game-setup/setupViewModel';

describe('180 Around the Clock — configuration', () => {
  it('se joue de 1 à 4 joueurs, sans doublettes ni robot', () => {
    expect(getSimplePlayerBounds('ATC180')).toEqual({ min: 1, max: 4 });
    expect(getSetupPlayerCountOptions('ATC180')).toEqual([1, 2, 3, 4]);
    expect(supportsDoublesMode('ATC180')).toBe(false);

    const fromX01Doubles = { ...createInitialSetupState(), isDoubles: true, playAgainstBot: true, playerNames: ['A', 'B', 'C', 'D', 'E', 'F'] };
    const state = setupReducer(fromX01Doubles, { type: 'apply_game_type_defaults', gameType: 'ATC180' });
    expect(state).toMatchObject({ isDoubles: false, playAgainstBot: false, playerNames: ['A', 'B', 'C', 'D'] });
    expect(setupReducer(state, { type: 'set_player_count', gameType: 'ATC180', count: 1 }).playerNames).toEqual(['A']);
    expect(setupReducer(state, { type: 'set_player_count', gameType: 'ATC180', count: 6 }).playerNames).toHaveLength(4);
  });

  it('affiche son nom, ses règles et son résumé (entraînement à 1 joueur)', () => {
    expect(getGameName('ATC180')).toBe('180 Around the Clock');
    const rules = getRulesContent('ATC180', 20, 'Open', 'Open');
    expect(rules.title).toBe('Règles du 180 Around the Clock');
    expect(rules.items.join(' ')).toContain('Triple du numéro : 3 points');
    expect(rules.items.join(' ')).toContain('ex aequo');

    const summary = (playerCount: number) => buildSetupSummaryEntries({
      gameType: 'ATC180', startingScore: 0, matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, cricketRounds: 20,
      isDoubles: false, playerCount, checkIn: 'Open', checkOut: 'Open',
    });
    expect(summary(1)).toEqual([
      { label: 'Jeu', value: '180 Around the Clock' },
      { label: 'Tours', value: '20 (du 1 au 20)' },
      { label: 'Nombre de joueurs', value: 1 },
      { label: 'Mode', value: 'Entraînement' },
    ]);
    expect(summary(3).at(-1)).toEqual({ label: 'Mode', value: 'Simple' });
  });
});
