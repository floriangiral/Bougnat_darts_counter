import type { InOutRule, MatchState, X01BotLevel } from '../../../types';
import { submitTurn } from '../scoring/matchLifecycle';
import { getX01BotLevelDefinition } from '../../domain/x01Bot/x01Bot';
import { POSSIBLE_TURN_SCORES } from '../../features/x01/scoring/possibleTurnScores';

export type X01BotTurn = {
  score: number;
  dartsThrown: number;
};

const DOUBLE_OUT_BOGEY_SCORES = new Set([159, 162, 163, 165, 166, 168, 169]);
const ONE_DART_SCORES = Array.from(new Set([
  0,
  25,
  50,
  ...Array.from({ length: 20 }, (_, index) => index + 1).flatMap((value) => [value, value * 2, value * 3]),
]));
const DOUBLE_OUT_FINAL_DARTS = Array.from(new Set([
  50,
  ...Array.from({ length: 20 }, (_, index) => (index + 1) * 2),
]));
const MASTER_OUT_FINAL_DARTS = Array.from(new Set([
  25,
  50,
  ...Array.from({ length: 20 }, (_, index) => index + 1).flatMap((value) => [value * 2, value * 3]),
]));

const isCheckoutCandidate = (remainingScore: number, checkOut: InOutRule) => {
  if (checkOut === 'Open') return remainingScore > 0 && remainingScore <= 180;
  if (checkOut === 'Double') {
    return remainingScore >= 2 && remainingScore <= 170 && !DOUBLE_OUT_BOGEY_SCORES.has(remainingScore);
  }
  return remainingScore >= 2 && remainingScore <= 180;
};

const getCheckoutProbability = (level: X01BotLevel) => {
  switch (level) {
    case 'PRO':
      return 0.72;
    case 'CONFIRME':
      return 0.46;
    case 'CLUB':
      return 0.3;
    case 'LOISIR':
      return 0.16;
    case 'AMATEUR':
      return 0.08;
  }
};

const getFinalDartCandidates = (checkOut: InOutRule) => {
  if (checkOut === 'Double') return DOUBLE_OUT_FINAL_DARTS;
  if (checkOut === 'Master') return MASTER_OUT_FINAL_DARTS;
  return ONE_DART_SCORES.filter((score) => score > 0);
};

export const getReachableCheckoutDarts = (remainingScore: number, checkOut: InOutRule): number | null => {
  if (!isCheckoutCandidate(remainingScore, checkOut)) return null;

  const finalDarts = getFinalDartCandidates(checkOut);

  if (finalDarts.includes(remainingScore)) {
    return 1;
  }

  for (const firstDart of ONE_DART_SCORES) {
    if (finalDarts.includes(remainingScore - firstDart)) {
      return 2;
    }
  }

  for (const firstDart of ONE_DART_SCORES) {
    for (const secondDart of ONE_DART_SCORES) {
      if (finalDarts.includes(remainingScore - firstDart - secondDart)) {
        return 3;
      }
    }
  }

  return null;
};

const getPlayableNonCheckoutLimit = (remainingScore: number, checkOut: InOutRule) => {
  if (checkOut === 'Double') return Math.max(0, remainingScore - 2);
  return Math.max(0, remainingScore - 1);
};

export const generateX01BotTurn = (
  params: {
    level: X01BotLevel;
    remainingScore: number;
    checkOut: InOutRule;
    random?: () => number;
  },
): X01BotTurn => {
  const random = params.random ?? Math.random;
  const definition = getX01BotLevelDefinition(params.level);
  const reachableCheckoutDarts = getReachableCheckoutDarts(params.remainingScore, params.checkOut);

  if (
    reachableCheckoutDarts !== null
    && random() <= getCheckoutProbability(params.level)
  ) {
    return {
      score: params.remainingScore,
      dartsThrown: reachableCheckoutDarts,
    };
  }

  const maxScore = Math.min(180, getPlayableNonCheckoutLimit(params.remainingScore, params.checkOut));
  if (maxScore <= 0) {
    return { score: 0, dartsThrown: 3 };
  }

  const targetAverage = definition.averageMin + (definition.averageMax - definition.averageMin) * random();
  const jitter = (random() - 0.5) * (definition.averageMax - definition.averageMin);
  const targetScore = Math.round(Math.max(0, Math.min(maxScore, targetAverage + jitter)));
  const candidates = [...POSSIBLE_TURN_SCORES].filter((score) => score <= maxScore);
  const score = candidates.reduce(
    (closest, candidate) =>
      Math.abs(candidate - targetScore) < Math.abs(closest - targetScore) ? candidate : closest,
    0,
  );

  return { score, dartsThrown: 3 };
};

export const buildX01BotTurnResult = (
  params: {
    match: MatchState;
    level: X01BotLevel;
    elapsedSeconds: number;
    random?: () => number;
  },
) => {
  const currentPlayer = params.match.players[params.match.currentPlayerIndex];
  const remainingScore = params.match.currentLeg.scores[currentPlayer.teamId];
  const botTurn = generateX01BotTurn({
    level: params.level,
    remainingScore,
    checkOut: params.match.config.checkOut,
    random: params.random,
  });
  const nextMatch = submitTurn(params.match, botTurn.score, botTurn.dartsThrown);
  const persistMatch = nextMatch.status === 'finished'
    ? { ...nextMatch, duration: params.elapsedSeconds }
    : nextMatch;

  return {
    botTurn,
    nextMatch: persistMatch,
    persistMatch,
    showWinnerScreen: persistMatch.status === 'finished',
  };
};
