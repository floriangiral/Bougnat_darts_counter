import { CapitalDart, CapitalTarget } from '../types';

export const CAPITAL_TARGETS: CapitalTarget[] = [
  'CAPITAL', '20', 'SUITE', '19', 'COTE_A_COTE', '18', '57', '17', 'COULEUR', '16', 'TRIPLE', '15', 'DOUBLE', '14', '17_OU_MOINS', '13', 'CENTRE'
];

export const CAPITAL_TARGET_NAMES: Record<CapitalTarget, string> = {
  'CAPITAL': 'Capital',
  '20': 'Le 20',
  'SUITE': 'La Suite',
  '19': 'Le 19',
  'COTE_A_COTE': '3 a cotes',
  '18': 'Le 18',
  '57': '57 points',
  '17': 'Le 17',
  'COULEUR': 'La Couleur',
  '16': 'Le 16',
  'TRIPLE': 'Le Triple',
  '15': 'Le 15',
  'DOUBLE': 'Le Double',
  '14': 'Le 14',
  '17_OU_MOINS': 'Moins de 21, 21 inclus',
  '13': 'Le 13',
  'CENTRE': 'Bulle ou D-Bull'
};

const BOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

function getDartColor(dart: CapitalDart): 'BLACK' | 'WHITE' | 'RED' | 'GREEN' | 'NONE' {
  if (dart.value === 0) return 'NONE';
  if (dart.value === 25) {
    return dart.multiplier === 2 ? 'RED' : 'GREEN';
  }
  const isBlackSingle = [20, 18, 13, 10, 2, 3, 7, 8, 14, 12].includes(dart.value);
  if (dart.multiplier === 1) {
    return isBlackSingle ? 'BLACK' : 'WHITE';
  } else {
    return isBlackSingle ? 'RED' : 'GREEN';
  }
}

export function shouldResolveCapitalRound(target: CapitalTarget, darts: CapitalDart[]): boolean {
  if (darts.length === 0) return false;

  if (target === 'CAPITAL') {
    return true;
  }

  if (target === '57') {
    const total = darts.reduce((sum, dart) => sum + (dart.value * dart.multiplier), 0);
    return total >= 57 || darts.length === 3;
  }

  return darts.length === 3;
}

export function evaluateCapitalRound(target: CapitalTarget, darts: CapitalDart[], currentScore: number): { newScore: number, pointsScored: number, isSuccess: boolean } {
  let isSuccess = false;
  let pointsScored = 0;

  const totalDartsScore = darts.reduce((sum, d) => sum + (d.value * d.multiplier), 0);

  switch (target) {
    case 'CAPITAL':
      isSuccess = true;
      pointsScored = totalDartsScore;
      break;
    case '20':
    case '19':
    case '18':
    case '17':
    case '16':
    case '15':
    case '13':
    case '14':
      const targetVal = parseInt(target);
      const validDarts = darts.filter(d => d.value === targetVal);
      if (validDarts.length > 0) {
        isSuccess = true;
        pointsScored = validDarts.reduce((sum, d) => sum + (d.value * d.multiplier), 0);
      }
      break;
    case 'COTE_A_COTE':
      if (darts.length === 3 && darts.every(d => d.value > 0 && d.value !== 25)) {
        const indices = darts.map(d => BOARD_ORDER.indexOf(d.value)).sort((a, b) => a - b);
        const diffs = [
          indices[1] - indices[0],
          indices[2] - indices[1],
          (indices[0] - indices[2] + 20) % 20
        ].sort((a, b) => a - b);
        
        if (diffs[0] === 1 && diffs[1] === 1 && diffs[2] === 18) {
          isSuccess = true;
          pointsScored = totalDartsScore;
        }
      }
      break;
    case 'SUITE':
      if (darts.length === 3 && darts.every(d => d.value > 0 && d.value !== 25)) {
        const vals = darts.map(d => d.value).sort((a, b) => a - b);
        if (vals[1] === vals[0] + 1 && vals[2] === vals[1] + 1) {
          isSuccess = true;
          pointsScored = totalDartsScore;
        }
      }
      break;
    case 'DOUBLE':
      const doubles = darts.filter(d => d.multiplier === 2 && d.value > 0);
      if (doubles.length > 0) {
        isSuccess = true;
        pointsScored = doubles.reduce((sum, d) => sum + (d.value * d.multiplier), 0);
      }
      break;
    case 'TRIPLE':
      const triples = darts.filter(d => d.multiplier === 3 && d.value > 0 && d.value !== 25);
      if (triples.length > 0) {
        isSuccess = true;
        pointsScored = triples.reduce((sum, d) => sum + (d.value * d.multiplier), 0);
      }
      break;
    case '57':
      if (totalDartsScore === 57 && darts.some(d => d.value > 0)) {
        isSuccess = true;
        pointsScored = 57;
      }
      break;
    case '17_OU_MOINS':
      if (darts.length === 3 && totalDartsScore <= 21) {
        isSuccess = true;
        pointsScored = totalDartsScore;
      }
      break;
    case 'COULEUR':
      const colors = darts.map(getDartColor).filter(c => c !== 'NONE');
      const uniqueColors = new Set(colors);
      if (uniqueColors.size === 3 && darts.length === 3) {
        isSuccess = true;
        pointsScored = totalDartsScore;
      }
      break;
    case 'CENTRE':
      const centres = darts.filter(d => d.value === 25);
      if (centres.length > 0) {
        isSuccess = true;
        pointsScored = centres.reduce((sum, d) => sum + (d.value * d.multiplier), 0);
      }
      break;
  }

  let newScore = currentScore;
  if (isSuccess) {
    newScore += pointsScored;
  } else {
    newScore = Math.ceil(newScore / 2);
  }

  return { newScore, pointsScored, isSuccess };
}
