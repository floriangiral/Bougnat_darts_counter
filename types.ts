
export type InOutRule = 'Open' | 'Double' | 'Master';
export type MatchMode = 'LEGS' | 'SETS';

export interface Player {
  id: string;
  name: string;
  teamId: string; // New: logical grouping for score sharing
}

export interface GameConfig {
  startingScore: number;
  checkIn: InOutRule;
  checkOut: InOutRule;
  matchMode: MatchMode;
  setsToWin: number;
  legsToWin: number;
  isDoubles: boolean; // New: True if 2v2
}

export interface Turn {
  playerId: string;
  score: number;
  isBust: boolean;
  remainingAfter: number;
  dartsThrown: number;
}

export interface LegState {
  scores: Record<string, number>; // keys are teamId
  history: Turn[];
  winnerId: string | null; // winner is a teamId
  startingPlayerIndex: number;
}

export interface MatchState {
  id: string;
  config: GameConfig;
  players: Player[]; // Ordered rotation list
  setsWon: Record<string, number>; // keys are teamId
  legsWon: Record<string, number>; // keys are teamId
  completedLegs: LegState[];
  currentLeg: LegState;
  status: 'active' | 'finished';
  matchWinnerId: string | null; // teamId
  currentPlayerIndex: number;
}
