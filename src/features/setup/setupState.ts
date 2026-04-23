import type { GameConfig } from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';
import type { SetupAction, SetupState } from './setupTypes';

export const DEFAULT_TEAM_STARTERS = { team1: 't1p1', team2: 't2p1' };

export const createInitialSetupState = (): SetupState => ({
  startingScore: 501,
  customScoreStr: '170',
  matchMode: 'LEGS',
  legsToWin: 3,
  setsToWin: 3,
  cricketRounds: 20,
  isDoubles: false,
  playerNames: ['', ''],
  team1Names: ['', ''],
  team2Names: ['', ''],
  checkOut: 'Double',
  checkIn: 'Open',
  startingPlayerIndex: 0,
  teamStarterIds: DEFAULT_TEAM_STARTERS,
  customLegsStr: '7',
});

export const normalizeSetupState = (state: SetupState, gameType: GameType): SetupState => {
  let nextState = state;

  if (!nextState.isDoubles) {
    const maxIndex = Math.max(0, nextState.playerNames.length - 1);
    if (nextState.startingPlayerIndex > maxIndex) {
      nextState = {
        ...nextState,
        startingPlayerIndex: maxIndex,
      };
    }
  }

  if (gameType === 'TRIATHLON' && !nextState.isDoubles && nextState.playerNames.length < 2) {
    nextState = {
      ...nextState,
      playerNames: [nextState.playerNames[0] || '', nextState.playerNames[1] || ''],
    };
  }

  return nextState;
};

export const setupReducer = (state: SetupState, action: SetupAction): SetupState => {
  switch (action.type) {
    case 'apply_game_type_defaults': {
      if (action.gameType === 'X01_501_BO5') {
        return normalizeSetupState({
          ...state,
          startingScore: 501,
          customScoreStr: '501',
          matchMode: 'LEGS',
          legsToWin: 3,
          customLegsStr: '3',
          setsToWin: 1,
          isDoubles: false,
          playerNames: ['', ''],
          checkIn: 'Open',
          checkOut: 'Double',
          startingPlayerIndex: 0,
          teamStarterIds: DEFAULT_TEAM_STARTERS,
        }, action.gameType);
      }

      if (action.gameType === 'X01') {
        return normalizeSetupState({
          ...state,
          startingScore: 501,
          matchMode: 'LEGS',
          legsToWin: 3,
          customLegsStr: '3',
          setsToWin: 3,
          isDoubles: false,
          checkIn: 'Open',
          checkOut: 'Double',
          startingPlayerIndex: 0,
          teamStarterIds: DEFAULT_TEAM_STARTERS,
        }, action.gameType);
      }

      if (action.gameType === 'CRICKET') {
        return normalizeSetupState({
          ...state,
          matchMode: 'LEGS',
          legsToWin: 3,
          customLegsStr: '3',
          setsToWin: 1,
          cricketRounds: 20,
          isDoubles: false,
        }, action.gameType);
      }

      if (action.gameType === 'TRIATHLON') {
        return normalizeSetupState({
          ...state,
          matchMode: 'LEGS',
          legsToWin: 1,
          customLegsStr: '1',
          setsToWin: 1,
          isDoubles: false,
          playerNames: ['', ''],
        }, action.gameType);
      }

      return normalizeSetupState(state, action.gameType);
    }
    case 'apply_prefilled_names': {
      if (action.names.length === 0) return state;

      if (action.gameType === 'X01' && action.names.length === 4) {
        return normalizeSetupState({
          ...state,
          isDoubles: true,
          playerNames: action.names,
          team1Names: [action.names[0], action.names[1]],
          team2Names: [action.names[2], action.names[3]],
        }, action.gameType);
      }

      return normalizeSetupState({
        ...state,
        isDoubles: false,
        playerNames: action.gameType === 'TRIATHLON'
          ? [action.names[0] || '', action.names[1] || '']
          : action.names,
        team1Names: action.names.length >= 2 ? [action.names[0], action.names[1]] : state.team1Names,
        team2Names: action.names.length >= 4 ? [action.names[2], action.names[3]] : state.team2Names,
      }, action.gameType);
    }
    case 'apply_prefilled_config': {
      const nextState: SetupState = {
        ...state,
        startingScore: typeof action.config.startingScore === 'number' ? action.config.startingScore : state.startingScore,
        customScoreStr: typeof action.config.startingScore === 'number' ? String(action.config.startingScore) : state.customScoreStr,
        matchMode: action.config.matchMode ?? state.matchMode,
        legsToWin: typeof action.config.legsToWin === 'number' ? action.config.legsToWin : state.legsToWin,
        customLegsStr: typeof action.config.legsToWin === 'number' ? String(action.config.legsToWin) : state.customLegsStr,
        setsToWin: typeof action.config.setsToWin === 'number' ? action.config.setsToWin : state.setsToWin,
        cricketRounds: action.config.cricketRounds ?? state.cricketRounds,
        isDoubles: typeof action.config.isDoubles === 'boolean' ? action.config.isDoubles : state.isDoubles,
        startingPlayerIndex: typeof action.config.initialStartingPlayerIndex === 'number' ? action.config.initialStartingPlayerIndex || 0 : state.startingPlayerIndex,
        teamStarterIds: action.config.teamStarterIds ?? state.teamStarterIds,
        checkIn: action.config.checkIn ?? state.checkIn,
        checkOut: action.config.checkOut ?? state.checkOut,
      };

      return normalizeSetupState(nextState, action.gameType);
    }
    case 'set_player_count': {
      const minPlayers = (action.gameType === 'CRICKET' || action.gameType === 'TRIATHLON') && !state.isDoubles ? 2 : 1;
      const maxPlayers =
        (action.gameType === 'CRICKET' && !state.isDoubles) ? 3 :
        (action.gameType === 'TRIATHLON' && !state.isDoubles) ? 2 :
        4;
      const newCount = Math.max(minPlayers, Math.min(maxPlayers, action.count));

      return normalizeSetupState({
        ...state,
        playerNames: newCount > state.playerNames.length
          ? Array.from({ length: newCount }, (_, index) => state.playerNames[index] || `Joueur ${index + 1}`)
          : state.playerNames.slice(0, newCount),
      }, action.gameType);
    }
    case 'update_player_name': {
      const playerNames = [...state.playerNames];
      playerNames[action.index] = action.name;
      return { ...state, playerNames };
    }
    case 'update_team_name': {
      if (action.team === 1) {
        const team1Names = [...state.team1Names];
        team1Names[action.index] = action.name;
        return { ...state, team1Names };
      }
      const team2Names = [...state.team2Names];
      team2Names[action.index] = action.name;
      return { ...state, team2Names };
    }
    case 'update_team_starter':
      return {
        ...state,
        teamStarterIds: {
          ...state.teamStarterIds,
          [action.teamId]: action.playerId,
        },
      };
    case 'set_starting_score':
      return { ...state, startingScore: action.value };
    case 'set_custom_score_str':
      return { ...state, customScoreStr: action.value };
    case 'set_match_mode':
      return { ...state, matchMode: action.value };
    case 'set_legs_to_win':
      return { ...state, legsToWin: action.value };
    case 'set_sets_to_win':
      return { ...state, setsToWin: action.value };
    case 'set_cricket_rounds':
      return { ...state, cricketRounds: action.value };
    case 'set_is_doubles':
      return { ...state, isDoubles: action.value };
    case 'set_check_in':
      return { ...state, checkIn: action.value };
    case 'set_check_out':
      return { ...state, checkOut: action.value };
    case 'set_starting_player_index':
      return { ...state, startingPlayerIndex: action.value };
    case 'set_custom_legs_str':
      return { ...state, customLegsStr: action.value };
    case 'normalize_for_game_type':
      return normalizeSetupState(state, action.gameType);
    default:
      return state;
  }
};

