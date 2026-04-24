import type { GameConfig, InOutRule, MatchMode } from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';

export type SetupPrefilledConfig = Partial<{
  startingScore: number;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  cricketRounds: NonNullable<GameConfig['cricketRounds']>;
  isDoubles: boolean;
  checkIn: InOutRule;
  checkOut: InOutRule;
  initialStartingPlayerIndex: number;
  initialStartingTeamId: 'team1' | 'team2';
  teamStarterIds: Record<string, string>;
}>;

export type SetupState = {
  startingScore: number;
  customScoreStr: string;
  matchMode: MatchMode;
  legsToWin: number;
  setsToWin: number;
  cricketRounds: NonNullable<GameConfig['cricketRounds']>;
  isDoubles: boolean;
  playerNames: string[];
  team1Names: string[];
  team2Names: string[];
  checkOut: InOutRule;
  checkIn: InOutRule;
  startingPlayerIndex: number;
  teamStarterIds: Record<string, string>;
  customLegsStr: string;
};

export type SetupAction =
  | { type: 'apply_game_type_defaults'; gameType: GameType }
  | { type: 'apply_prefilled_names'; gameType: GameType; names: string[] }
  | { type: 'apply_prefilled_config'; gameType: GameType; config: Partial<GameConfig> }
  | { type: 'set_player_count'; gameType: GameType; count: number }
  | { type: 'update_player_name'; index: number; name: string }
  | { type: 'update_team_name'; team: 1 | 2; index: number; name: string }
  | { type: 'update_team_starter'; teamId: 'team1' | 'team2'; playerId: string }
  | { type: 'set_starting_score'; value: number }
  | { type: 'set_custom_score_str'; value: string }
  | { type: 'set_match_mode'; value: MatchMode }
  | { type: 'set_legs_to_win'; value: number }
  | { type: 'set_sets_to_win'; value: number }
  | { type: 'set_cricket_rounds'; value: NonNullable<GameConfig['cricketRounds']> }
  | { type: 'set_is_doubles'; value: boolean }
  | { type: 'set_check_in'; value: InOutRule }
  | { type: 'set_check_out'; value: InOutRule }
  | { type: 'set_starting_player_index'; value: number }
  | { type: 'set_custom_legs_str'; value: string }
  | { type: 'normalize_for_game_type'; gameType: GameType };
