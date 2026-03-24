export const getRandomTargetForTier = (tier: number): number => {
  let min = 41;
  let max = 60;

  switch (tier) {
    case 1:
      min = 41; max = 60; break;
    case 2:
      min = 61; max = 80; break;
    case 3:
      min = 81; max = 90; break;
    case 4:
      min = 91; max = 100; break;
    case 5:
      min = 101; max = 130; break;
    case 6:
      min = 131; max = 170; break;
    default:
      min = 41; max = 60; break;
  }

  // Generate a random number between min and max inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getPointsForTier = (tier: number): number => {
  switch (tier) {
    case 1: return 1;
    case 2: return 2;
    case 3: return 3;
    case 4: return 4;
    case 5: return 5;
    case 6: return 10;
    default: return 1;
  }
};
