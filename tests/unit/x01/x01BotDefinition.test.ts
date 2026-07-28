import { describe, expect, it } from 'vitest';

import {
  buildRandomX01BotName,
  formatX01BotAverageRange,
  getX01BotLevelDefinition,
} from '../../../src/domain/x01Bot/x01Bot';

describe('x01 bot definitions', () => {
  it('formats the pro level as more than 85 average', () => {
    expect(formatX01BotAverageRange(getX01BotLevelDefinition('PRO'))).toBe('+ de 85 de moyenne');
  });

  it('builds a bot name with a mixed French first-name dictionary', () => {
    expect(buildRandomX01BotName(() => 0)).toBe('[BOT] Alexis');
    expect(buildRandomX01BotName(() => 0.999999)).toBe('[BOT] Zoe');
  });
});