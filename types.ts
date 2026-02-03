
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
  enableVoice: boolean; // New: True if AI voice is active
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
  duration: number; // Total match duration in seconds
}

// --- New Types for Clock/180 Games ---

export interface ClockHistoryItem {
    target: number;
    points: number;
    hitType: 'MISS' | 'SINGLE' | 'DOUBLE' | 'TRIPLE';
}

export interface ClockPlayerState {
    id: string;
    name: string;
    score: number;
    totalDarts: number;
    targetIndex: number; 
    history: ClockHistoryItem[];
}

// --- Cricket Types ---

export type CricketTarget = 20 | 19 | 18 | 17 | 16 | 15 | 25;

export interface CricketPlayerState {
    id: string;
    name: string;
    score: number;
    marks: Record<CricketTarget, number>; // 0 to 3
    dartsThrown: number;
    history: {
        target: CricketTarget | null;
        multiplier: 1 | 2 | 3;
        isMiss: boolean;
        pointsScored: number;
    }[];
}
