export type ThrowSegment = number | 'MISS';

export interface Throw {
  points: number;
  multiplier: 0 | 1 | 2 | 3;
  segment: ThrowSegment;
}
