export interface Score {
  value: number;
}

export const createScore = (value: number): Score => ({ value });
