import { describe, expect, it } from 'vitest';

import { createMatch, submitTurn } from '../../../src/application/scoring/matchLifecycle';
import { resolveBotVictoryPreview } from '../../../src/features/x01/scoring/botVictoryPreview';
import type { GameConfig, Player } from '../../../types';

const players: Player[] = [
  { id: 'p1', name: 'Joueur 1', teamId: 'p1' },
  { id: 'p2', name: 'Robot', teamId: 'p2', isBot: true, botLevel: 'CLUB' },
];

const config: GameConfig = {
  startingScore: 40,
  checkIn: 'Open',
  checkOut: 'Double',
  matchMode: 'LEGS',
  setsToWin: 1,
  legsToWin: 2,
  isDoubles: false,
  initialStartingPlayerIndex: 0,
};

describe('resolveBotVictoryPreview', () => {
  it('returns a leg preview only when the bot just advanced the match to the next leg', () => {
    const match = createMatch(players, config);
    const afterHumanMiss = submitTurn(match, 0, 3);
    const afterBotLegWin = submitTurn(afterHumanMiss, 40, 1);

    expect(resolveBotVictoryPreview({
      previousMatch: afterHumanMiss,
      nextMatch: afterBotLegWin,
      currentPlayerTeamId: 'p2',
      showWinnerScreen: false,
    })).toEqual({
      hasBotWonLeg: true,
      hasBotWonMatch: false,
      previewKind: 'leg',
    });
  });

  it('does not retrigger the leg preview on later bot turns after an earlier bot leg win', () => {
    const match = createMatch(players, config);
    const afterHumanMiss = submitTurn(match, 0, 3);
    const afterBotLegWin = submitTurn(afterHumanMiss, 40, 1);
    const afterNextBotTurn = submitTurn(afterBotLegWin, 0, 3);

    expect(resolveBotVictoryPreview({
      previousMatch: afterBotLegWin,
      nextMatch: afterNextBotTurn,
      currentPlayerTeamId: 'p2',
      showWinnerScreen: false,
    })).toEqual({
      hasBotWonLeg: false,
      hasBotWonMatch: false,
      previewKind: null,
    });
  });

  it('returns a match preview when the bot closes the match', () => {
    const match = createMatch(players, { ...config, legsToWin: 1 });
    const afterHumanMiss = submitTurn(match, 0, 3);
    const afterBotMatchWin = submitTurn(afterHumanMiss, 40, 1);

    expect(resolveBotVictoryPreview({
      previousMatch: afterHumanMiss,
      nextMatch: afterBotMatchWin,
      currentPlayerTeamId: 'p2',
      showWinnerScreen: true,
    })).toEqual({
      hasBotWonLeg: false,
      hasBotWonMatch: true,
      previewKind: 'match',
    });
  });
});