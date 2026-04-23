import type { MatchState } from '../../../../types';
import { EndGame, RecordThrow } from '../../../application';
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
  const recordThrowResult = RecordThrow.execute({
    match,
    score,
    dartsThrown: 3,
  });

  if (recordThrowResult.kind === 'invalid') {
    if (recordThrowResult.reason === 'not_a_number') {
      return { kind: 'invalid', feedback: { text: '?', type: 'bust' } };
    }

    if (recordThrowResult.reason === 'negative') {
      return { kind: 'invalid', feedback: { text: 'NEGATIF', type: 'bust' } };
    }

    return { kind: 'invalid', feedback: { text: 'SCORE IMPOSSIBLE', type: 'notice' } };
  }

  if (recordThrowResult.kind === 'requires_checkout_confirmation') {
    return { kind: 'checkout_confirm', score: recordThrowResult.score };
  }

  if (recordThrowResult.kind === 'recorded' && recordThrowResult.finishedGame) {
    const endGameResult = EndGame.execute({
      match: recordThrowResult.nextMatch,
      elapsedSeconds,
    });
    const persistMatch = endGameResult.match;
    return {
      kind: 'applied',
      nextMatch: persistMatch,
      persistMatch,
      showWinnerScreen: true,
    };
  }

  return {
    kind: 'applied',
    nextMatch: recordThrowResult.nextMatch,
    persistMatch: recordThrowResult.nextMatch,
    showWinnerScreen: false,
    feedback: recordThrowResult.isBust ? { text: 'TROP !', type: 'bust' as const } : undefined,
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
