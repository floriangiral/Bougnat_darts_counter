export type GameType = 'X01' | 'X01_501_BO5' | 'CRICKET' | 'CAPITAL' | 'KILLER' | 'GOTCHA' | 'TRIATHLON';
export type ArenaGameScreen = 'MATCH' | 'CRICKET_GAME' | 'CAPITAL_GAME' | 'KILLER_GAME' | 'GOTCHA_GAME' | 'TRIATHLON_GAME';

export const getScreenForGameType = (gameType: GameType): ArenaGameScreen =>
  gameType === 'CRICKET'
    ? 'CRICKET_GAME'
    : gameType === 'CAPITAL'
      ? 'CAPITAL_GAME'
      : gameType === 'KILLER'
        ? 'KILLER_GAME'
        : gameType === 'GOTCHA'
          ? 'GOTCHA_GAME'
          : gameType === 'TRIATHLON'
            ? 'TRIATHLON_GAME'
            : 'MATCH';
