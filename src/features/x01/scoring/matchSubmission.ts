import { submitTurn } from '../../../application/scoring/matchLifecycle';
import type { MatchState, Turn } from '../../../../types';
import { POSSIBLE_TURN_SCORES } from './possibleTurnScores';

const cloneTurn = (turn: Turn): Turn => ({ ...turn });

export const cloneMatchState = (match: MatchState): MatchState => ({
  ...match,
  players: match.players.map((player) => ({ ...player })),
  setsWon: { ...match.setsWon },
  legsWon: { ...match.legsWon },
  completedLegs: match.completedLegs.map((leg) => ({
    ...leg,
    scores: { ...leg.scores },
    history: leg.history.map(cloneTurn),
  })),
  currentLeg: {
    ...match.currentLeg,
    scores: { ...match.currentLeg.scores },
    history: match.currentLeg.history.map(cloneTurn),
  },
});

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
  elapsedSeconds: number,
): ScoreSubmissionResult => {
  if (Number.isNaN(score)) {
    return { kind: 'invalid', feedback: { text: '?', type: 'bust' } };
  }

  if (score < 0) {
    return { kind: 'invalid', feedback: { text: 'NEGATIF', type: 'bust' } };
  }

  if (score !== 0 && (!POSSIBLE_TURN_SCORES.has(score) || score > 180)) {
    return { kind: 'invalid', feedback: { text: 'SCORE IMPOSSIBLE', type: 'notice' } };
  }

  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentScore = match.currentLeg.scores[currentPlayer.teamId];

  if (score === currentScore) {
    return { kind: 'checkout_confirm', score };
  }

  const nextMatch = submitTurn(match, score, 3);

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
  elapsedSeconds: number,
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
