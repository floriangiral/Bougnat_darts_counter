import { describe, expect, it } from 'vitest';

import { appScreenPath } from '../../../src/app/appScreenPath';
import { isAppScreen, type AppScreen } from '../../../src/app/appScreens';
import type { GameType } from '../../../utils/arenaFlow';

const SCREENS: AppScreen[] = [
  'HOME', 'SETTINGS', 'GAME_SELECTION', 'SETUP', 'MATCH', 'STATS',
  'CRICKET_GAME', 'CRICKET_STATS', 'CAPITAL_GAME', 'CAPITAL_STATS', 'KILLER_GAME', 'KILLER_STATS',
  'GOTCHA_GAME', 'GOTCHA_STATS', 'TRIATHLON_GAME', 'TRIATHLON_STATS', 'ATC180_GAME',
];
const GAMES: GameType[] = ['X01', 'CRICKET', 'CAPITAL', 'KILLER', 'GOTCHA', 'TRIATHLON', 'ATC180'];

describe('appScreenPath (spec 135)', () => {
  it('names the game and the step, never the players', () => {
    expect(SCREENS.every(isAppScreen)).toBe(true);
    for (const screen of SCREENS) {
      for (const game of GAMES) {
        expect(appScreenPath(screen, game)).toMatch(/^\/(?:[a-z0-9-]+(?:\/(?:preparation|partie|fin))?)?$/);
      }
    }
  });

  it('uses the selected game only for the setup screen', () => {
    expect(appScreenPath('SETUP', 'ATC180')).toBe('/180-around-the-clock/preparation');
    expect(appScreenPath('MATCH', 'CRICKET')).toBe('/x01/partie');
    expect(appScreenPath('TRIATHLON_STATS', 'X01')).toBe('/triathlon/fin');
    expect(appScreenPath('GAME_SELECTION', 'GOTCHA')).toBe('/jeux');
    expect(appScreenPath('SETTINGS', 'X01')).toBe('/reglages');
  });
});
