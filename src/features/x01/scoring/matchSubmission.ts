import { submitBustTurn, submitTurn } from '../../../application/scoring/matchLifecycle';
import { isCheckoutPossible, isX01Bust } from '../../../domain/scoring/x01CheckoutRules';
import { isOpeningTotalPossible, isX01TeamOpened } from '../../../domain/scoring/x01OpeningRules';
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
  | { kind: 'opening_confirm'; score: number }
  | {
      kind: 'applied';
      nextMatch: MatchState;
      persistMatch: MatchState;
      showWinnerScreen: boolean;
      feedback?: { text: string; type: FeedbackKind };
    };

export type AppliedScoreSubmissionResult = Extract<ScoreSubmissionResult, { kind: 'applied' }>;

export const buildBustSubmissionResult = (match: MatchState): AppliedScoreSubmissionResult => {
  const nextMatch = submitBustTurn(match);
  return { kind: 'applied', nextMatch, persistMatch: nextMatch, showWinnerScreen: false, feedback: { text: 'TROP !', type: 'bust' } };
};

export type ScoreSubmissionOptions = {
  /** Spec 046 : le joueur a attesté que la visite commence par une fléchette d'ouverture valide. */
  openingConfirmed?: boolean;
};

type PreSubmissionResult = Extract<ScoreSubmissionResult, { kind: 'invalid' | 'opening_confirm' }>;

const invalidVisit = (text: string, type: FeedbackKind): PreSubmissionResult => ({ kind: 'invalid', feedback: { text, type } });

/** Visit totals that can never be entered: not a number, negative or unreachable with 3 darts. */
const validateVisitTotal = (score: number): PreSubmissionResult | null => {
  if (Number.isNaN(score)) return invalidVisit('?', 'bust');
  if (score < 0) return invalidVisit('NEGATIF', 'bust');
  if (score !== 0 && (!POSSIBLE_TURN_SCORES.has(score) || score > 180)) return invalidVisit('SCORE IMPOSSIBLE', 'notice');
  return null;
};

/** Spec 046: before its opening, a team must attest a valid opening dart (unless the visit busts). */
const checkOpening = (
  match: MatchState,
  teamId: string,
  currentScore: number,
  score: number,
  openingConfirmed: boolean | undefined,
): PreSubmissionResult | null => {
  if (score === 0 || isX01TeamOpened(match, teamId)) return null;
  if (!isOpeningTotalPossible(score, match.config.checkIn)) return invalidVisit('OUVERTURE IMPOSSIBLE', 'notice');
  // Un trop laisse l'équipe fermée quoi qu'il arrive : inutile de demander l'attestation.
  if (!openingConfirmed && !isX01Bust(currentScore, score, match.config.checkOut)) return { kind: 'opening_confirm', score };
  return null;
};

export const buildScoreSubmissionResult = (
  match: MatchState,
  score: number,
  elapsedSeconds: number,
  options: ScoreSubmissionOptions = {},
): ScoreSubmissionResult => {
  const invalidTotal = validateVisitTotal(score);
  if (invalidTotal) return invalidTotal;

  const currentPlayer = match.players[match.currentPlayerIndex];
  const currentScore = match.currentLeg.scores[currentPlayer.teamId];

  const openingResult = checkOpening(match, currentPlayer.teamId, currentScore, score, options.openingConfirmed);
  if (openingResult) return openingResult;

  const isImpossibleFinish = score === currentScore && !isCheckoutPossible(currentScore, match.config.checkOut);
  if (score === currentScore && !isImpossibleFinish) {
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

  const lastTurn = nextMatch.currentLeg.history.at(-1);
  const feedback =
    lastTurn?.isBust
      ? { text: isImpossibleFinish ? 'SORTIE IMPOSSIBLE' : 'TROP !', type: 'bust' as const }
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
