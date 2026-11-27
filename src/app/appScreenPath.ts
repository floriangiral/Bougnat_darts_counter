import type { GameType } from '../../utils/arenaFlow';

import type { AppScreen } from './appScreens';

// Spec 135: the path only mirrors the screen for Cloudflare Web Analytics; it is never read back.
const GAME_SLUGS: Record<GameType, string> = {
  X01: 'x01',
  CRICKET: 'cricket',
  CAPITAL: 'capital',
  KILLER: 'killer',
  GOTCHA: 'gotcha',
  TRIATHLON: 'triathlon',
  ATC180: '180-around-the-clock',
};

const gamePath = (gameType: GameType, step: 'preparation' | 'partie' | 'fin') =>
  `/${GAME_SLUGS[gameType]}/${step}`;

const SCREEN_PATHS: Record<AppScreen, (selectedGameType: GameType) => string> = {
  HOME: () => '/',
  SETTINGS: () => '/reglages',
  GAME_SELECTION: () => '/jeux',
  SETUP: (selectedGameType) => gamePath(selectedGameType, 'preparation'),
  MATCH: () => gamePath('X01', 'partie'),
  STATS: () => gamePath('X01', 'fin'),
  CRICKET_GAME: () => gamePath('CRICKET', 'partie'),
  CRICKET_STATS: () => gamePath('CRICKET', 'fin'),
  CAPITAL_GAME: () => gamePath('CAPITAL', 'partie'),
  CAPITAL_STATS: () => gamePath('CAPITAL', 'fin'),
  KILLER_GAME: () => gamePath('KILLER', 'partie'),
  KILLER_STATS: () => gamePath('KILLER', 'fin'),
  GOTCHA_GAME: () => gamePath('GOTCHA', 'partie'),
  GOTCHA_STATS: () => gamePath('GOTCHA', 'fin'),
  TRIATHLON_GAME: () => gamePath('TRIATHLON', 'partie'),
  TRIATHLON_STATS: () => gamePath('TRIATHLON', 'fin'),
  ATC180_GAME: () => gamePath('ATC180', 'partie'),
};

export const appScreenPath = (screen: AppScreen, selectedGameType: GameType): string =>
  SCREEN_PATHS[screen](selectedGameType);
