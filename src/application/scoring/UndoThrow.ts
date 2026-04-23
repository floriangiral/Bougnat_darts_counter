import type { MatchState } from '../../../types';
import { undoTurn } from '../../../utils/gameLogic';

export type UndoThrowCommand = {
  match: MatchState;
};

export class UndoThrow {
  static execute(command: UndoThrowCommand): MatchState {
    return undoTurn(command.match);
  }
}
