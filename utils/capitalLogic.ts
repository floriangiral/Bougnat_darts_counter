import { CapitalDart, CapitalTarget } from '../types';

export const CAPITAL_TARGETS: CapitalTarget[] = [
  'CAPITAL', '20', 'SUITE', '19', 'COTE_A_COTE', '18', '57', '17', 'COULEUR', '16', 'TRIPLE', '15', 'DOUBLE', '14', '21_OU_MOINS', '13', 'CENTRE',
];

export const CAPITAL_TARGET_NAMES: Record<CapitalTarget, string> = {
  CAPITAL: 'Capital',
  '20': 'Le 20',
  SUITE: 'La Suite',
  '19': 'Le 19',
  COTE_A_COTE: '3 a cotes',
  '18': 'Le 18',
  '57': '57 points',
  '17': 'Le 17',
  COULEUR: 'La Couleur',
  '16': 'Le 16',
  TRIPLE: 'Le Triple',
  '15': 'Le 15',
  DOUBLE: 'Le Double',
  '14': 'Le 14',
  '21_OU_MOINS': 'Moins de 21, 21 inclus',
  '13': 'Le 13',
  CENTRE: 'Bulle ou D-Bull',
};

const BOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const NUMBERED_TARGETS = new Set<CapitalTarget>(['20', '19', '18', '17', '16', '15', '14', '13']);

type CapitalRoundResult = {
  isSuccess: boolean;
  pointsScored: number;
};

type CapitalRule = {
  shouldResolve: (darts: CapitalDart[]) => boolean;
  evaluate: (darts: CapitalDart[]) => CapitalRoundResult;
};

const sumDarts = (darts: CapitalDart[]) => darts.reduce((sum, dart) => sum + (dart.value * dart.multiplier), 0);

const allTargetHits = (darts: CapitalDart[]) => darts.every((dart) => dart.value > 0 && dart.value !== 25);

const scoreMatchingDarts = (darts: CapitalDart[], predicate: (dart: CapitalDart) => boolean) => {
  const matchingDarts = darts.filter(predicate);
  return {
    isSuccess: matchingDarts.length > 0,
    pointsScored: matchingDarts.reduce((sum, dart) => sum + (dart.value * dart.multiplier), 0),
  };
};

function getDartColor(dart: CapitalDart): 'BLACK' | 'WHITE' | 'RED' | 'GREEN' | 'NONE' {
  if (dart.value === 0) return 'NONE';
  if (dart.value === 25) {
    return dart.multiplier === 2 ? 'RED' : 'GREEN';
  }

  const isBlackSingle = [20, 18, 13, 10, 2, 3, 7, 8, 14, 12].includes(dart.value);
  if (dart.multiplier === 1) {
    return isBlackSingle ? 'BLACK' : 'WHITE';
  }

  return isBlackSingle ? 'RED' : 'GREEN';
}

const resolveAfterSingleDart = () => true;
const resolveAfterThreeDarts = (darts: CapitalDart[]) => darts.length === 3;
const resolve57 = (darts: CapitalDart[]) => sumDarts(darts) >= 57 || darts.length === 3;

const evaluateCapital = (darts: CapitalDart[]): CapitalRoundResult => ({
  isSuccess: true,
  pointsScored: sumDarts(darts),
});

const createNumberedRule = (target: Extract<CapitalTarget, '20' | '19' | '18' | '17' | '16' | '15' | '14' | '13'>): CapitalRule => {
  const targetValue = parseInt(target, 10);
  return {
    shouldResolve: resolveAfterThreeDarts,
    evaluate: (darts) => scoreMatchingDarts(darts, (dart) => dart.value === targetValue),
  };
};

const suiteRule: CapitalRule = {
  shouldResolve: resolveAfterThreeDarts,
  evaluate: (darts) => {
    if (darts.length !== 3 || !allTargetHits(darts)) {
      return { isSuccess: false, pointsScored: 0 };
    }

    const values = darts.map((dart) => dart.value).sort((a, b) => a - b);
    const isSuite = values[1] === values[0] + 1 && values[2] === values[1] + 1;
    return {
      isSuccess: isSuite,
      pointsScored: isSuite ? sumDarts(darts) : 0,
    };
  },
};

const coteACoteRule: CapitalRule = {
  shouldResolve: resolveAfterThreeDarts,
  evaluate: (darts) => {
    if (darts.length !== 3 || !allTargetHits(darts)) {
      return { isSuccess: false, pointsScored: 0 };
    }

    const indices = darts.map((dart) => BOARD_ORDER.indexOf(dart.value)).sort((a, b) => a - b);
    const diffs = [
      indices[1] - indices[0],
      indices[2] - indices[1],
      (indices[0] - indices[2] + 20) % 20,
    ].sort((a, b) => a - b);
    const isAdjacentTriplet = diffs[0] === 1 && diffs[1] === 1 && diffs[2] === 18;

    return {
      isSuccess: isAdjacentTriplet,
      pointsScored: isAdjacentTriplet ? sumDarts(darts) : 0,
    };
  },
};

const doubleRule: CapitalRule = {
  shouldResolve: resolveAfterThreeDarts,
  evaluate: (darts) => scoreMatchingDarts(darts, (dart) => dart.multiplier === 2 && dart.value > 0),
};

const tripleRule: CapitalRule = {
  shouldResolve: resolveAfterThreeDarts,
  evaluate: (darts) => scoreMatchingDarts(darts, (dart) => dart.multiplier === 3 && dart.value > 0 && dart.value !== 25),
};

const exact57Rule: CapitalRule = {
  shouldResolve: resolve57,
  evaluate: (darts) => {
    const total = sumDarts(darts);
    return {
      isSuccess: total === 57 && darts.some((dart) => dart.value > 0),
      pointsScored: total === 57 ? 57 : 0,
    };
  },
};

const twentyOneOrLessRule: CapitalRule = {
  shouldResolve: resolveAfterThreeDarts,
  evaluate: (darts) => {
    const total = sumDarts(darts);
    const isSuccess = darts.length === 3 && darts.every((dart) => dart.value > 0) && total <= 21;
    return {
      isSuccess,
      pointsScored: isSuccess ? total : 0,
    };
  },
};

const couleurRule: CapitalRule = {
  shouldResolve: resolveAfterThreeDarts,
  evaluate: (darts) => {
    if (darts.length !== 3) {
      return { isSuccess: false, pointsScored: 0 };
    }

    const colors = darts.map(getDartColor).filter((color) => color !== 'NONE');
    const uniqueColors = new Set(colors);
    const isSuccess = uniqueColors.size === 3;

    return {
      isSuccess,
      pointsScored: isSuccess ? sumDarts(darts) : 0,
    };
  },
};

const centreRule: CapitalRule = {
  shouldResolve: resolveAfterThreeDarts,
  evaluate: (darts) => scoreMatchingDarts(darts, (dart) => dart.value === 25),
};

const TARGET_RULES: Record<CapitalTarget, CapitalRule> = {
  CAPITAL: {
    shouldResolve: resolveAfterSingleDart,
    evaluate: evaluateCapital,
  },
  '20': createNumberedRule('20'),
  SUITE: suiteRule,
  '19': createNumberedRule('19'),
  COTE_A_COTE: coteACoteRule,
  '18': createNumberedRule('18'),
  '57': exact57Rule,
  '17': createNumberedRule('17'),
  COULEUR: couleurRule,
  '16': createNumberedRule('16'),
  TRIPLE: tripleRule,
  '15': createNumberedRule('15'),
  DOUBLE: doubleRule,
  '14': createNumberedRule('14'),
  '21_OU_MOINS': twentyOneOrLessRule,
  '13': createNumberedRule('13'),
  CENTRE: centreRule,
};

export function shouldResolveCapitalRound(target: CapitalTarget, darts: CapitalDart[]): boolean {
  if (darts.length === 0) {
    return false;
  }

  return TARGET_RULES[target].shouldResolve(darts);
}

export function evaluateCapitalRound(target: CapitalTarget, darts: CapitalDart[], currentScore: number): { newScore: number; pointsScored: number; isSuccess: boolean } {
  const { isSuccess, pointsScored } = TARGET_RULES[target].evaluate(darts);

  return {
    newScore: isSuccess ? currentScore + pointsScored : Math.ceil(currentScore / 2),
    pointsScored,
    isSuccess,
  };
}

export const __capitalLogicInternals = {
  NUMBERED_TARGETS,
};
