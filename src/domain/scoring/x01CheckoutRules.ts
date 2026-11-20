import type { InOutRule } from '../../../types';

/**
 * Règles de sortie X01 (spec 045) : source unique de la finissabilité, du nombre minimal
 * de fléchettes et du trop. Les tables sont calculées à partir des segments de la cible,
 * aucune liste de « bogeys » n'est saisie à la main.
 */

type Dart = { value: number; label: string };

const SEGMENTS = Array.from({ length: 20 }, (_, index) => 20 - index);
const TRIPLES: Dart[] = SEGMENTS.map((segment) => ({ value: segment * 3, label: `T${segment}` }));
const DOUBLES: Dart[] = SEGMENTS.map((segment) => ({ value: segment * 2, label: `D${segment}` }));
const SINGLES: Dart[] = SEGMENTS.map((segment) => ({ value: segment, label: String(segment) }));
const BULL: Dart = { value: 50, label: 'Bull' };
const OUTER_BULL: Dart = { value: 25, label: '25' };

// Ordre de préférence des fléchettes de placement : les plus gros segments d'abord.
const SETUP_DARTS: Dart[] = [...TRIPLES, BULL, OUTER_BULL, ...SINGLES, ...DOUBLES];

// Doubles de sortie classiques d'abord (D16, D20, D8…), puis les autres.
const PREFERRED_DOUBLE_SEGMENTS = [16, 20, 8, 18, 12, 10, 4, 14, 19, 17, 15, 13, 11, 9, 7, 6, 5, 3, 2, 1];
const FINISHING_DOUBLES: Dart[] = PREFERRED_DOUBLE_SEGMENTS.map((segment) => ({ value: segment * 2, label: `D${segment}` }));

// Fléchettes finales autorisées, dans l'ordre de préférence de l'aide de sortie.
// Master-Out : double, triple ou double bull ; le simple bull (25) n'est pas une sortie.
const FINAL_DARTS: Record<InOutRule, Dart[]> = {
  Open: [...SINGLES, OUTER_BULL, ...FINISHING_DOUBLES, BULL, ...TRIPLES],
  Double: [...FINISHING_DOUBLES, BULL],
  Master: [...FINISHING_DOUBLES, BULL, ...TRIPLES],
};

export const MAX_X01_CHECKOUT_DARTS = 3;
const MAX_VISIT_SCORE = 180;

const buildMinDartsTable = (rule: InOutRule): ReadonlyArray<number | null> => {
  const table: Array<number | null> = Array.from({ length: MAX_VISIT_SCORE + 1 }, () => null);
  for (const final of FINAL_DARTS[rule]) {
    table[final.value] = 1;
  }
  for (let darts = 2; darts <= MAX_X01_CHECKOUT_DARTS; darts += 1) {
    const previous = [...table];
    for (let remaining = 1; remaining <= MAX_VISIT_SCORE; remaining += 1) {
      if (table[remaining] !== null) continue;
      const reachable = SETUP_DARTS.some((dart) => remaining > dart.value && previous[remaining - dart.value] === darts - 1);
      if (reachable) table[remaining] = darts;
    }
  }
  return table;
};

const MIN_CHECKOUT_DARTS: Record<InOutRule, ReadonlyArray<number | null>> = {
  Open: buildMinDartsTable('Open'),
  Double: buildMinDartsTable('Double'),
  Master: buildMinDartsTable('Master'),
};

/** Nombre minimal de fléchettes pour finir `remaining` selon la règle, ou `null` si c'est impossible en une visite. */
export const getCheckoutMinDarts = (remaining: number, rule: InOutRule): number | null => {
  if (!Number.isInteger(remaining) || remaining < 1 || remaining > MAX_VISIT_SCORE) return null;
  return MIN_CHECKOUT_DARTS[rule][remaining] ?? null;
};

/** Un reste est finissable s'il peut être ramené à 0 en une visite avec une fléchette finale autorisée. */
export const isCheckoutPossible = (remaining: number, rule: InOutRule): boolean =>
  getCheckoutMinDarts(remaining, rule) !== null;

/**
 * Trop : reste négatif, reste de 1 en Double-Out ou Master-Out, ou reste nul obtenu
 * sur un total que la règle ne permet pas de finir (ex. 180 en Double-Out).
 */
export const isX01Bust = (currentScore: number, scoredPoints: number, rule: InOutRule): boolean => {
  const remaining = currentScore - scoredPoints;
  if (remaining < 0) return true;
  if (remaining === 1) return rule !== 'Open';
  if (remaining === 0) return !isCheckoutPossible(currentScore, rule);
  return false;
};

/** Reste visé refusé par le bouton RESTE : 1 n'est jamais finissable en Double-Out ni en Master-Out. */
export const isDeadRemainingScore = (remaining: number, rule: InOutRule): boolean =>
  remaining === 1 && rule !== 'Open';

// Pour une valeur donnée, la fléchette de placement la plus simple : simple, puis triple, puis double.
const SETUP_DART_BY_VALUE = new Map<number, Dart>();
for (const dart of [...SINGLES, OUTER_BULL, ...TRIPLES, BULL, ...DOUBLES]) {
  if (!SETUP_DART_BY_VALUE.has(dart.value)) SETUP_DART_BY_VALUE.set(dart.value, dart);
}

const SINGLE_SETUP_DARTS = new Set<Dart>([...SINGLES, OUTER_BULL]);

const findTwoDartRoute = (remaining: number, rule: InOutRule): string[] | null => {
  // Premier passage : placement sur un simple (le plus courant), sinon n'importe quelle fléchette.
  for (const singleSetupOnly of [true, false]) {
    for (const final of FINAL_DARTS[rule]) {
      const setup = SETUP_DART_BY_VALUE.get(remaining - final.value);
      if (setup && (!singleSetupOnly || SINGLE_SETUP_DARTS.has(setup))) return [setup.label, final.label];
    }
  }
  return null;
};

/** Route de sortie la plus courte pour la règle (ex. « T20 T20 Bull »), ou `null`. */
export const getCheckoutRoute = (remaining: number, rule: InOutRule): string[] | null => {
  const darts = getCheckoutMinDarts(remaining, rule);
  if (darts === 1) {
    const final = FINAL_DARTS[rule].find((dart) => dart.value === remaining);
    return final ? [final.label] : null;
  }
  if (darts === 2) return findTwoDartRoute(remaining, rule);
  if (darts === 3) {
    for (const setup of SETUP_DARTS) {
      if (getCheckoutMinDarts(remaining - setup.value, rule) !== 2) continue;
      const rest = findTwoDartRoute(remaining - setup.value, rule);
      if (rest) return [setup.label, ...rest];
    }
  }
  return null;
};
