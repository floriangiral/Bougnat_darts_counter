import { describe, expect, it } from 'vitest';

import {
  buildSetupConfig,
  buildSetupPlayers,
  createInitialSetupState,
  deriveSetupLaunchState,
  normalizeSetupState,
  setupReducer,
} from '../../../src/features/game-setup/setupModel';
import {
  getGameName,
  getMatchModeLabel,
  getRuleDescription,
  getRuleLabel,
  getRulesContent,
} from '../../../src/features/game-setup/setupPresentation';

describe('setup model', () => {
  it('applies defaults for Cricket, Triathlon and Killer without mutating the source', () => {
    const state = { ...createInitialSetupState(), playerNames: ['Alice'], playAgainstBot: true };
    expect(setupReducer(state, { type: 'apply_game_type_defaults', gameType: 'CRICKET' })).toMatchObject({
      cricketRounds: 20, setsToWin: 1, legsToWin: 3, playerNames: ['Alice', 'Joueur 2'], playAgainstBot: false,
    });
    expect(setupReducer(state, { type: 'apply_game_type_defaults', gameType: 'TRIATHLON' })).toMatchObject({
      playerNames: ['', ''], legsToWin: 1, customLegsStr: '1', setsToWin: 1,
    });
    expect(setupReducer(state, { type: 'apply_game_type_defaults', gameType: 'KILLER' }).playerNames).toEqual(['', '']);
    expect(setupReducer(state, { type: 'apply_game_type_defaults', gameType: 'GOTCHA' }).playerNames).toEqual(['', '']);
    const populated = { ...state, playerNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] };
    expect(setupReducer(populated, { type: 'apply_game_type_defaults', gameType: 'KILLER' }).playerNames).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(setupReducer(state, { type: 'apply_game_type_defaults', gameType: 'CAPITAL' }).playerNames).toEqual(['Alice']);
    expect(state.playerNames).toEqual(['Alice']);
  });

  it('prefills doubles, individual names and sparse Triathlon names', () => {
    const state = createInitialSetupState();
    expect(setupReducer(state, { type: 'apply_prefilled_names', gameType: 'X01', names: [] })).toBe(state);
    expect(setupReducer(state, { type: 'apply_prefilled_names', gameType: 'X01', names: ['A', 'B', 'C', 'D'] })).toMatchObject({
      isDoubles: true, team1Names: ['A', 'B'], team2Names: ['C', 'D'],
    });
    expect(setupReducer(state, { type: 'apply_prefilled_names', gameType: 'CAPITAL', names: ['A', 'B', 'C', 'D'] })).toMatchObject({
      isDoubles: false, playerNames: ['A', 'B', 'C', 'D'], team2Names: ['C', 'D'],
    });
    expect(setupReducer(state, { type: 'apply_prefilled_names', gameType: 'TRIATHLON', names: [''] }).playerNames).toEqual(['', '']);
    expect(setupReducer(state, { type: 'apply_prefilled_names', gameType: 'CAPITAL', names: ['A'] }).team1Names).toEqual(state.team1Names);
  });

  it('preserves unspecified prefilled options and applies supplied options', () => {
    const state = createInitialSetupState();
    expect(setupReducer(state, { type: 'apply_prefilled_config', gameType: 'X01', config: {} })).toEqual(state);
    const config = {
      startingScore: 301, matchMode: 'SETS', legsToWin: 5, setsToWin: 2,
      cricketRounds: 10, isDoubles: true, checkIn: 'Double', checkOut: 'Master',
      initialStartingPlayerIndex: 1, teamStarterIds: { team1: 't1p2', team2: 't2p2' },
    } as const;
    expect(setupReducer(state, { type: 'apply_prefilled_config', gameType: 'X01', config })).toMatchObject({
      startingScore: 301, customScoreStr: '301', customLegsStr: '5', legsToWin: 5,
      setsToWin: 2, matchMode: 'SETS', cricketRounds: 10, isDoubles: true,
      checkIn: 'Double', checkOut: 'Master', startingPlayerIndex: 1, teamStarterIds: config.teamStarterIds,
    });
  });

  it('resizes rosters and normalizes starter indices and bot eligibility', () => {
    const state = { ...createInitialSetupState(), playerNames: ['Alice'], startingPlayerIndex: 5 };
    expect(setupReducer(state, { type: 'set_player_count', gameType: 'CAPITAL', count: 3 })).toMatchObject({
      playerNames: ['Alice', 'Joueur 2', 'Joueur 3'], startingPlayerIndex: 2,
    });
    expect(setupReducer({ ...state, isDoubles: true }, { type: 'set_player_count', gameType: 'X01', count: 9 }).playerNames).toHaveLength(4);
    expect(normalizeSetupState({ ...state, playerNames: [], playAgainstBot: true }, 'X01')).toMatchObject({
      playerNames: ['', ''], startingPlayerIndex: 1,
    });
    expect(normalizeSetupState({ ...state, playAgainstBot: true }, 'GOTCHA')).toMatchObject({ playAgainstBot: false, startingPlayerIndex: 1 });
    expect(setupReducer(state, { type: 'normalize_for_game_type', gameType: 'TRIATHLON' }).playerNames).toHaveLength(2);
  });

  it('updates team names independently', () => {
    const state = createInitialSetupState();
    const first = setupReducer(state, { type: 'update_team_name', team: 1, index: 0, name: 'Alice' });
    const second = setupReducer(first, { type: 'update_team_name', team: 2, index: 1, name: 'Bob' });
    expect(second.team1Names).toEqual(['Alice', '']);
    expect(second.team2Names).toEqual(['', 'Bob']);
    expect(state.team1Names).toEqual(['', '']);
    expect(state.team2Names).toEqual(['', '']);
  });

  it('exposes the initial setup state used by the view', () => {
    const initial = createInitialSetupState();

    expect(initial.startingScore).toBe(501);
    expect(initial.playerNames).toEqual(['', '']);
    expect(initial.teamStarterIds).toEqual({ team1: 't1p1', team2: 't2p1' });
  });

  it('applies X01 defaults without changing the game flow', () => {
    const next = setupReducer(createInitialSetupState(), { type: 'apply_game_type_defaults', gameType: 'X01' });

    expect(next.legsToWin).toBe(3);
    expect(next.setsToWin).toBe(3);
    expect(next.matchMode).toBe('LEGS');
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
    expect(getGameName('TRIATHLON')).toBe('Triathlon');
    expect(getGameName('KILLER')).toBe('Killer');
    expect(getGameName('GOTCHA')).toBe('Gotcha');
    expect(getRulesContent('CRICKET', 20, 'Open', 'Double').title).toBe('Regles Du Cricket');
    expect(getRulesContent('KILLER', 20, 'Open', 'Double').title).toBe('Regles Du Killer');
    expect(getRulesContent('GOTCHA', 20, 'Open', 'Open').title).toBe('Regles Du Gotcha');
  });

  it('covers setup presentation labels and every game rules branch', () => {
    expect(getGameName('X01')).toBe('X01');
    expect(getGameName('CAPITAL')).toBe('Capital');
    expect(getMatchModeLabel('LEGS')).toBe('Manches');
    expect(getMatchModeLabel('SETS')).toBe('Sets');
    expect(getRuleLabel('Open')).toBe('Open');
    expect(getRuleLabel('Double')).toBe('Double');
    expect(getRuleLabel('Master')).toBe('Master');
    expect(getRuleDescription('in', 'Open')).toContain('commence');
    expect(getRuleDescription('in', 'Double')).toContain('double');
    expect(getRuleDescription('in', 'Master')).toContain('triple');
    expect(getRuleDescription('out', 'Open')).toContain('segment');
    expect(getRuleDescription('out', 'Double')).toContain('classique');
    expect(getRuleDescription('out', 'Master')).toContain('triple');

    for (const gameType of ['X01', 'CRICKET', 'CAPITAL', 'TRIATHLON', 'KILLER', 'GOTCHA'] as const) {
      expect(getRulesContent(gameType, 20, 'Open', 'Double').items.length).toBeGreaterThan(0);
    }
    expect(getRulesContent('UNKNOWN' as never, 20, 'Open', 'Double').title).toBe('Regles Du Mode');
  });

  it('limits X01 simple player count to two when requested count is higher', () => {
    const state = createInitialSetupState();
    const next = setupReducer(state, { type: 'set_player_count', gameType: 'X01', count: 4 });

    expect(next.isDoubles).toBe(false);
    expect(next.playerNames).toHaveLength(2);
  });

  it('normalizes X01 simple prefilled names to at most two players', () => {
    const state = createInitialSetupState();
    const next = setupReducer(state, {
      type: 'apply_prefilled_names',
      gameType: 'X01',
      names: ['Alice', 'Bob', 'Carol'],
    });

    expect(next.isDoubles).toBe(false);
    expect(next.playerNames).toEqual(['Alice', 'Bob']);
  });

  it('enables a bot opponent only for X01 simple setup', () => {
    const state = setupReducer(createInitialSetupState(), {
      type: 'set_play_against_bot',
      gameType: 'X01',
      value: true,
    });

    expect(state.playAgainstBot).toBe(true);
    expect(state.playerNames).toHaveLength(2);

    const doubles = setupReducer(state, { type: 'set_is_doubles', value: true });
    expect(doubles.playAgainstBot).toBe(false);

    const triathlon = setupReducer(createInitialSetupState(), {
      type: 'set_play_against_bot',
      gameType: 'TRIATHLON',
      value: true,
    });
    expect(triathlon.playAgainstBot).toBe(false);
  });

  it('builds a marked X01 bot player when bot mode is active', () => {
    const players = buildSetupPlayers({
      isDoubles: false,
      playerNames: ['Alice', ''],
      team1Names: ['', ''],
      team2Names: ['', ''],
      playAgainstBot: true,
      botLevel: 'PRO',
      random: () => 0,
    });

    expect(players).toHaveLength(2);
    expect(players[0]).toMatchObject({ id: 'p1', name: 'Alice', teamId: 'p1' });
    expect(players[1]).toMatchObject({ id: 'p2', name: '[BOT] Alexis', teamId: 'p2', isBot: true, botLevel: 'PRO' });
  });

  it('limits Killer to six simple players and disables bots', () => {
    const state = setupReducer(createInitialSetupState(), {
      type: 'set_player_count',
      gameType: 'KILLER',
      count: 8,
    });

    expect(state.playerNames).toHaveLength(6);

    const withBot = setupReducer(state, {
      type: 'set_play_against_bot',
      gameType: 'KILLER',
      value: true,
    });

    expect(withBot.playAgainstBot).toBe(false);
  });

  it('limits Gotcha to six simple players, keeps a target score, and disables bots', () => {
    const defaults = setupReducer(createInitialSetupState(), {
      type: 'apply_game_type_defaults',
      gameType: 'GOTCHA',
    });

    expect(defaults.startingScore).toBe(301);
    expect(defaults.customScoreStr).toBe('301');
    expect(defaults.playerNames).toHaveLength(2);

    const resized = setupReducer(defaults, {
      type: 'set_player_count',
      gameType: 'GOTCHA',
      count: 8,
    });

    expect(resized.playerNames).toHaveLength(6);

    const withBot = setupReducer(resized, {
      type: 'set_play_against_bot',
      gameType: 'GOTCHA',
      value: true,
    });

    expect(withBot.playAgainstBot).toBe(false);
  });
});
