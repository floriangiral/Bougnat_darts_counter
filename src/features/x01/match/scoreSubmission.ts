import type { MatchState } from '../../../../types';
import { ScoreValidator, ScoringRules } from '../../../domain/scoring';
import { submitTurn } from '../../../../utils/gameLogic';

export type FeedbackKind = 'bust' | 'miss' | 'info' | 'notice';

export type ScoreSubmissionResult =
  | { kind: 'invalid'; feedback: { text: string; type: FeedbackKind } }
  | { kind: 'checkout_confirm'; score: number }
  | {
      kind: 'applied';
      nextMatch: MatchState;
      persistMatch: MatchState;
      showWinnerScreen: boolean;
      feedback?: { text: string; type: FeedbackKind };
    };

export type AppliedScoreSubmissionResult = Extract<ScoreSubmissionResult, { kind: 'applied' }>;

export const buildScoreSubmissionResult = (
  match: MatchState,
  score: number,
  elapsedSeconds: number
): ScoreSubmissionResult => {
  const scoreInput = ScoreValidator.validateScoreInput(score);
  if (!scoreInput.ok) {
    const invalidReason = 'reason' in scoreInput ? scoreInput.reason : 'impossible_turn_score';

    if (invalidReason === 'not_a_number') {
      return { kind: 'invalid', feedback: { text: '?', type: 'bust' } };
    }

    if (invalidReason === 'negative') {
      return { kind: 'invalid', feedback: { text: 'NEGATIF', type: 'bust' } };
    }

    return { kind: 'invalid', feedback: { text: 'SCORE IMPOSSIBLE', type: 'notice' } };
  }

  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentScore = match.currentLeg.scores[currentPlayer.teamId];
  const turnEvaluation = ScoringRules.evaluateTurn(currentScore, scoreInput.value, match.config.checkOut);

  if (turnEvaluation.requiresCheckoutConfirmation) {
    return { kind: 'checkout_confirm', score: scoreInput.value.value };
  }

  const nextMatch = submitTurn(match, scoreInput.value.value, 3);

  if (nextMatch.status === 'finished') {
    const persistMatch = { ...nextMatch, duration: elapsedSeconds };
    return {
      kind: 'applied',
      nextMatch: persistMatch,
      persistMatch,
      showWinnerScreen: true,
    };
  }

  const lastTurn = nextMatch.currentLeg.history[nextMatch.currentLeg.history.length - 1];
  const feedback =
    lastTurn?.isBust
      ? { text: 'TROP !', type: 'bust' as const }
      : undefined;

  return {
    kind: 'applied',
    nextMatch,
    persistMatch: nextMatch,
    showWinnerScreen: false,
    feedback,
  };
};

export const buildCheckoutConfirmResult = (
  match: MatchState,
  score: number,
  dartsUsed: number,
  elapsedSeconds: number
): AppliedScoreSubmissionResult => {
  const nextMatch = submitTurn(match, score, dartsUsed);

  if (nextMatch.status === 'finished') {
    const persistMatch = { ...nextMatch, duration: elapsedSeconds };
    return {
      kind: 'applied',
      nextMatch: persistMatch,
      persistMatch,
      showWinnerScreen: true,
    };
  }

  return {
    kind: 'applied',
    nextMatch,
    persistMatch: nextMatch,
    showWinnerScreen: false,
  };
};
