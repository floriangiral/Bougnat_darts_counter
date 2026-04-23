import type { MatchState } from '../../../types';
import { submitTurn } from '../../../utils/gameLogic';
import { ScoreValidator, ScoringRules } from '../../domain/scoring';

export type RecordThrowCommand = {
  match: MatchState;
  score: number;
  dartsThrown: number;
};

export type RecordThrowResult =
  | { kind: 'invalid'; reason: 'not_a_number' | 'negative' | 'impossible_turn_score' }
  | { kind: 'requires_checkout_confirmation'; score: number }
  | {
      kind: 'recorded';
      nextMatch: MatchState;
      isBust: boolean;
      finishedGame: boolean;
      finishedLeg: boolean;
    };

export class RecordThrow {
  static execute(command: RecordThrowCommand): RecordThrowResult {
    const validatedScore = ScoreValidator.validateScoreInput(command.score);
    if (!validatedScore.ok) {
      return {
        kind: 'invalid',
        reason: 'reason' in validatedScore ? validatedScore.reason : 'impossible_turn_score',
      };
    }

    const currentPlayer = command.match.players[command.match.currentPlayerIndex];
    const currentScore = command.match.currentLeg.scores[currentPlayer.teamId];
    const evaluation = ScoringRules.evaluateTurn(currentScore, validatedScore.value, command.match.config.checkOut);

    if (evaluation.requiresCheckoutConfirmation) {
      return {
        kind: 'requires_checkout_confirmation',
        score: validatedScore.value.value,
      };
    }

    const nextMatch = submitTurn(command.match, validatedScore.value.value, command.dartsThrown);
    const latestTurn = nextMatch.currentLeg.history[nextMatch.currentLeg.history.length - 1];

    return {
      kind: 'recorded',
      nextMatch,
      isBust: Boolean(latestTurn?.isBust),
      finishedGame: nextMatch.status === 'finished',
      finishedLeg:
        nextMatch.completedLegs.length > command.match.completedLegs.length
        || (nextMatch.status === 'finished' && command.match.status !== 'finished'),
    };
  }
}
