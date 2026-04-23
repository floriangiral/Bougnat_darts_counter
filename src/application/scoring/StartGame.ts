import type { GameConfig, MatchState, Player } from '../../../types';
import { createMatch } from '../../../utils/gameLogic';

export type StartGameCommand = {
  players: Player[];
  config: GameConfig;
};

export class StartGame {
  static execute(command: StartGameCommand): MatchState {
    return createMatch(command.players, command.config);
  }
}
