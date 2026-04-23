import type { Leg } from './Leg';

export type GameKind = 'X01' | 'CRICKET' | 'CAPITAL' | 'TRIATHLON';

export interface Game {
  id: string;
  kind: GameKind;
  legs: Leg[];
  activeLegIndex: number;
  status: 'active' | 'finished';
  winnerId: string | null;
}
