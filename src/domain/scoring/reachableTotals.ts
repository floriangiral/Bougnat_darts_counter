// Spec ref: specs/054-counter-impossible-totals-validation (RM-01, RM-02).
const buildSingleDartScores = (): readonly number[] => {
  const scores = new Set<number>([0, 25, 50]);
  for (let value = 1; value <= 20; value += 1) {
    scores.add(value);
    scores.add(value * 2);
    scores.add(value * 3);
  }
  return [...scores].sort((left, right) => left - right);
};

export const SINGLE_DART_SCORES = buildSingleDartScores();

const reachableTotalsByDartCount = new Map<number, ReadonlySet<number>>([[0, new Set([0])]]);

export const getReachableTotals = (dartCount: number): ReadonlySet<number> => {
  if (!Number.isInteger(dartCount) || dartCount < 0) {
    throw new RangeError('Le nombre de fléchettes doit être un entier positif ou nul.');
  }

  const cached = reachableTotalsByDartCount.get(dartCount);
  if (cached) return cached;

  const totals = new Set<number>();
  for (const previousTotal of getReachableTotals(dartCount - 1)) {
    for (const dartScore of SINGLE_DART_SCORES) {
      totals.add(previousTotal + dartScore);
    }
  }
  reachableTotalsByDartCount.set(dartCount, totals);
  return totals;
};

export const isReachableTotal = (total: number, dartCount = 3): boolean => (
  Number.isInteger(total) && getReachableTotals(dartCount).has(total)
);
