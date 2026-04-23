import type { MatchState } from '../../../types';

export type EndGameCommand = {
  match: MatchState;
  elapsedSeconds: number;
};

export type EndGameResult =
  | { kind: 'game_continues'; match: MatchState }
  | { kind: 'game_ended'; match: MatchState; winnerTeamId: string };

export class EndGame {
  static execute(command: EndGameCommand): EndGameResult {
    if (command.match.status !== 'finished' || !command.match.matchWinnerId) {
      return {
        kind: 'game_continues',
        match: command.match,
      };
    }

    return {
      kind: 'game_ended',
      match: {
        ...command.match,
        duration: command.elapsedSeconds,
      },
      winnerTeamId: command.match.matchWinnerId,
    };
  }
}
