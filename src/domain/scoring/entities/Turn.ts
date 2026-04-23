import type { Score } from './Score';
import type { Throw } from './Throw';

export interface Turn {
  playerId: string;
  throws: Throw[];
  score: Score;
  isBust: boolean;
  remainingAfter: number;
  dartsThrown: number;
}
