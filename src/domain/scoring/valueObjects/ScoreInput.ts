const oneDartScores = [0, 25, 50];

for (let value = 1; value <= 20; value += 1) {
  oneDartScores.push(value, value * 2, value * 3);
}

const uniqueOneDartScores = Array.from(new Set(oneDartScores));

export const POSSIBLE_THREE_DART_TURN_SCORES = (() => {
  const possibleScores = new Set<number>();

  for (const first of uniqueOneDartScores) {
    for (const second of uniqueOneDartScores) {
      for (const third of uniqueOneDartScores) {
        possibleScores.add(first + second + third);
      }
    }
  }

  return possibleScores;
})();

export type ScoreInputErrorReason = 'not_a_number' | 'negative' | 'impossible_turn_score';

export type ScoreInputValidationResult =
  | { ok: true; value: ScoreInput }
  | { ok: false; reason: ScoreInputErrorReason };

export class ScoreInput {
  private constructor(public readonly value: number) {}

  static create(raw: number): ScoreInputValidationResult {
    if (Number.isNaN(raw)) {
      return { ok: false, reason: 'not_a_number' };
    }

    if (raw < 0) {
      return { ok: false, reason: 'negative' };
    }

    if (!isPossibleThreeDartTurnScore(raw)) {
      return { ok: false, reason: 'impossible_turn_score' };
    }

    return { ok: true, value: new ScoreInput(raw) };
  }
}

export const isPossibleThreeDartTurnScore = (score: number) => (
  score === 0 || (score <= 180 && POSSIBLE_THREE_DART_TURN_SCORES.has(score))
);
