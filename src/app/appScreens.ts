export type AppScreen =
  | 'HOME'
  | 'GAME_SELECTION'
  | 'SETUP'
  | 'MATCH'
  | 'STATS'
  | 'CRICKET_GAME'
  | 'CRICKET_STATS'
  | 'CAPITAL_GAME'
  | 'CAPITAL_STATS'
  | 'KILLER_GAME'
  | 'KILLER_STATS'
  | 'GOTCHA_GAME'
  | 'GOTCHA_STATS'
  | 'TRIATHLON_GAME'
  | 'TRIATHLON_STATS';

const APP_SCREENS = new Set<AppScreen>([
  'HOME',
  'GAME_SELECTION',
  'SETUP',
  'MATCH',
  'STATS',
  'CRICKET_GAME',
  'CRICKET_STATS',
  'CAPITAL_GAME',
  'CAPITAL_STATS',
  'KILLER_GAME',
  'KILLER_STATS',
  'GOTCHA_GAME',
  'GOTCHA_STATS',
  'TRIATHLON_GAME',
  'TRIATHLON_STATS',
]);

export const isAppScreen = (value: unknown): value is AppScreen =>
  typeof value === 'string' && APP_SCREENS.has(value as AppScreen);
