import type { InOutRule, MatchState, X01BotLevel } from '../../../types';
import { submitTurn } from '../scoring/matchLifecycle';
import { getX01BotLevelDefinition } from '../../domain/x01Bot/x01Bot';
import { getCheckoutMinDarts, isDeadRemainingScore } from '../../domain/scoring/x01CheckoutRules';
import { POSSIBLE_TURN_SCORES } from '../../features/x01/scoring/possibleTurnScores';

export type X01BotTurn = {
  score: number;
  dartsThrown: number;
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

export const getReachableCheckoutDarts = (remainingScore: number, checkOut: InOutRule): number | null =>
  getCheckoutMinDarts(remainingScore, checkOut);

// Placement : ne jamais laisser 1 en Double-Out ni en Master-Out (reste impossible à finir).
const getPlayableNonCheckoutLimit = (remainingScore: number, checkOut: InOutRule) => {
  const minimumLeft = isDeadRemainingScore(1, checkOut) ? 2 : 1;
  return Math.max(0, remainingScore - minimumLeft);
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
