import type { Score } from './Score';
import type { Turn } from './Turn';

export interface Leg {
  id: string;
  startingScore: Score;
  currentScore: Score;
  turns: Turn[];
  winnerId: string | null;
}
