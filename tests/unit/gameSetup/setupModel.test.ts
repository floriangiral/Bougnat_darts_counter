import { describe, expect, it } from 'vitest';

import {
  buildSetupConfig,
  buildSetupPlayers,
  createInitialSetupState,
  deriveSetupLaunchState,
  getGameName,
  getRulesContent,
  getSetupTitle,
  setupReducer,
} from '../../../src/features/game-setup/setupModel';

describe('setup model', () => {
  it('exposes the initial setup state used by the view', () => {
    const initial = createInitialSetupState();

    expect(initial.startingScore).toBe(501);
    expect(initial.playerNames).toEqual(['', '']);
    expect(initial.teamStarterIds).toEqual({ team1: 't1p1', team2: 't2p1' });
  });

  it('applies X01 defaults without changing the game flow', () => {
    const next = setupReducer(createInitialSetupState(), { type: 'apply_game_type_defaults', gameType: 'X01_501_BO5' });

    expect(next.customScoreStr).toBe('501');
    expect(next.legsToWin).toBe(3);
    expect(next.setsToWin).toBe(1);
  });

  it('derives launch-state validation for custom values', () => {
    expect(deriveSetupLaunchState({
      gameType: 'X01',
      startingScore: 170,
      customScoreStr: '170',
      matchMode: 'LEGS',
      legsToWin: 7,
      customLegsStr: '7',
    })).toMatchObject({
      isCustomActive: true,
      isCustomScoreValid: true,
      isCustomLegsValid: true,
    });
  });

  it('builds players and config with the same defaults used by SetupView', () => {
    const players = buildSetupPlayers({
      isQuickPreset: false,
      isDoubles: true,
      playerNames: ['Alice', 'Bob'],
      team1Names: ['Alice', 'Bob'],
      team2Names: ['Carol', 'Dan'],
    });

    expect(players).toHaveLength(4);
    expect(players[0]).toMatchObject({ id: 't1p1', teamId: 'team1', name: 'Alice' });

    const config = buildSetupConfig({
      startingScore: 0,
      checkIn: 'Open',
      checkOut: 'Double',
      matchMode: 'LEGS',
      legsToWin: 3,
      setsToWin: 3,
      cricketRounds: 20,
      isDoubles: true,
      startingPlayerIndex: 1,
      teamStarterIds: { team1: 't1p1', team2: 't2p1' },
    });

    expect(config.safeStartingScore).toBe(501);
    expect(config.config.initialStartingPlayerIndex).toBe(0);
    expect(config.config.teamStarterIds).toEqual({ team1: 't1p1', team2: 't2p1' });
  });

  it('keeps the setup copy consistent', () => {
    expect(getSetupTitle('X01_501_BO5')).toBe('501 Double Out');
    expect(getGameName('TRIATHLON')).toBe('Le Triathlon');
    expect(getRulesContent('CRICKET', 20, 'Open', 'Double').title).toBe('Regles Du Cricket');
  });
});
