import type { InOutRule } from '../../../types';

type Dart = { score: number; kind: 'single' | 'double' | 'triple' };

const DARTS: Dart[] = [
  ...Array.from({ length: 20 }, (_, index) => index + 1).flatMap((value): Dart[] => [
    { score: value, kind: 'single' },
    { score: value * 2, kind: 'double' },
    { score: value * 3, kind: 'triple' },
  ]),
  { score: 25, kind: 'single' },
  { score: 50, kind: 'double' },
];

const matchesRule = (kind: Dart['kind'], rule: InOutRule): boolean =>
  rule === 'Open' || kind === 'double' || (rule === 'Master' && kind === 'triple');

/** Cherche une suite réelle de trois fléchettes au plus, en arrêtant la volée à la sortie ou au trop. */
export const canX01VisitBust = (score: number, checkIn: InOutRule, checkOut: InOutRule, opened: boolean): boolean => {
  if (!Number.isInteger(score) || score <= 0 || score > 181) return false;
  let states = new Set<number>([score]);
  for (let dartIndex = 0; dartIndex < 3; dartIndex += 1) {
    const next = new Set<number>();
    for (const remaining of states) {
      for (const dart of DARTS) {
        if (!opened && dartIndex === 0 && !matchesRule(dart.kind, checkIn)) continue;
        const after = remaining - dart.score;
        if (after < 0 || (after === 1 && checkOut !== 'Open') || (after === 0 && !matchesRule(dart.kind, checkOut))) return true;
        if (after > 0) next.add(after);
      }
    }
    states = next;
  }
  return false;
};
