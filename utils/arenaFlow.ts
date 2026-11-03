export type GameType = 'X01' | 'CRICKET' | 'CAPITAL' | 'KILLER' | 'GOTCHA' | 'TRIATHLON';
export type ArenaGameScreen = 'MATCH' | 'CRICKET_GAME' | 'CAPITAL_GAME' | 'KILLER_GAME' | 'GOTCHA_GAME' | 'TRIATHLON_GAME';

const GAME_SCREEN_BY_TYPE: Record<GameType, ArenaGameScreen> = {
  X01: 'MATCH',
  CRICKET: 'CRICKET_GAME',
  CAPITAL: 'CAPITAL_GAME',
  KILLER: 'KILLER_GAME',
  GOTCHA: 'GOTCHA_GAME',
  TRIATHLON: 'TRIATHLON_GAME',
};

export const getScreenForGameType = (gameType: GameType): ArenaGameScreen => GAME_SCREEN_BY_TYPE[gameType];
