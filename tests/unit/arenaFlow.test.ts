import { describe, expect, it } from 'vitest';
import { getScreenForGameType } from '../../utils/arenaFlow';

describe('arena game routing', () => {
  it.each([
    ['X01', 'MATCH'],
    ['CRICKET', 'CRICKET_GAME'],
    ['CAPITAL', 'CAPITAL_GAME'],
    ['KILLER', 'KILLER_GAME'],
    ['GOTCHA', 'GOTCHA_GAME'],
    ['TRIATHLON', 'TRIATHLON_GAME'],
  ] as const)('routes %s to %s', (gameType, screen) => {
    expect(getScreenForGameType(gameType)).toBe(screen);
  });
});
