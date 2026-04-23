export type GameType = 'X01' | 'X01_501_BO5' | 'CRICKET' | 'CAPITAL' | 'TRIATHLON';
export type ArenaGameScreen = 'MATCH' | 'CRICKET_GAME' | 'CAPITAL_GAME' | 'TRIATHLON_GAME';

export const getScreenForGameType = (gameType: GameType): ArenaGameScreen =>
  gameType === 'CRICKET'
    ? 'CRICKET_GAME'
    : gameType === 'CAPITAL'
      ? 'CAPITAL_GAME'
      : gameType === 'TRIATHLON'
        ? 'TRIATHLON_GAME'
        : 'MATCH';
