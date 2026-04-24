import type { MatchState } from '../../../types';
import { undoTurn } from './matchLifecycle';

export type UndoThrowCommand = {
  match: MatchState;
};

export class UndoThrow {
  static execute(command: UndoThrowCommand): MatchState {
    return undoTurn(command.match);
  }
}
