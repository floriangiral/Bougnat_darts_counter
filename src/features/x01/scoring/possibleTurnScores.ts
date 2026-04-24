export const POSSIBLE_TURN_SCORES = (() => {
  const oneDartScores = [0, 25, 50];

  for (let value = 1; value <= 20; value += 1) {
    oneDartScores.push(value, value * 2, value * 3);
  }

  const uniqueOneDartScores = Array.from(new Set(oneDartScores));
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
