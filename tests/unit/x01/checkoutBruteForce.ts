import type { InOutRule } from '../../../types';

// Independent reference: enumerates every 1-, 2- and 3-dart sequence of the board.
const SEGMENTS = Array.from({ length: 20 }, (_, index) => index + 1);
const SINGLES = [...SEGMENTS, 25];
const DOUBLES = [...SEGMENTS.map((value) => value * 2), 50];
const TRIPLES = SEGMENTS.map((value) => value * 3);
const ANY_DART = [...SINGLES, ...DOUBLES, ...TRIPLES];

const FINAL_DARTS: Record<InOutRule, number[]> = {
  Open: ANY_DART,
  Double: DOUBLES,
  // Master-Out: double, triple or double bull; the single bull (25) is excluded.
  Master: [...DOUBLES, ...TRIPLES],
};

export const bruteForceMinDarts = (remaining: number, rule: InOutRule): number | null => {
  const finals = FINAL_DARTS[rule];
  let best: number | null = null;
  for (const last of finals) {
    if (last === remaining) return 1;
    for (const first of ANY_DART) {
      if (first + last === remaining) best = 2;
      if (best === null) {
        for (const second of ANY_DART) {
          if (first + second + last === remaining) best = 3;
        }
      }
    }
  }
  return best;
};

export const DOUBLE_OUT_IMPOSSIBLE_TOTALS = [159, 162, 165, 168, 171, 174, 177, 180];
