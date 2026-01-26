export type InOutRule = 'Open' | 'Double' | 'Master';

export interface Player {
  id: string;
  name: string;
}

export interface GameConfig {
  startingScore: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
  legsToWin: number; // e.g., 3 to win (Best of 5)
}

export interface Turn {
  playerId: string;
  score: number;
  isBust: boolean;
  remainingAfter: number;
  dartsThrown: number; // Usually 3, unless checkout
}

export interface LegState {
  scores: Record<string, number>; // playerId -> remaining score
  history: Turn[];
  winnerId: string | null;
  startingPlayerIndex: number; // Rotates each leg
}

export interface MatchState {
  id: string;
  config: GameConfig;
  players: Player[];
  legsWon: Record<string, number>; // playerId -> count
  completedLegs: LegState[]; // History of previous legs for stats
  currentLeg: LegState;
  status: 'active' | 'finished';
  matchWinnerId: string | null;
  currentPlayerIndex: number; // Who throws now
}