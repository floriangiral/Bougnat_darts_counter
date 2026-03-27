
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
  initialStartingPlayerIndex?: number;
  initialStartingTeamId?: string;
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

export interface CricketMatchSummary {
    competitors: CricketPlayerState[];
    legsWon: Record<string, number>;
    setsWon: Record<string, number>;
    currentSetLegsWon: Record<string, number>;
    winnerId: string | null;
    config: GameConfig;
    isDoubles: boolean;
    memberNamesByCompetitor: Record<string, string[]>;
}

// --- Capital Types ---

export type CapitalTarget = 'CAPITAL' | '20' | 'SUITE' | '19' | 'COTE_A_COTE' | '18' | '57' | '17' | 'COULEUR' | '16' | 'TRIPLE' | '15' | 'DOUBLE' | '14' | '17_OU_MOINS' | '13' | 'CENTRE';

export interface CapitalDart {
  value: number; // 0-20, 25
  multiplier: 1 | 2 | 3;
}

export interface CapitalHistoryItem {
  target: CapitalTarget;
  darts: CapitalDart[];
  pointsScored: number;
  isSuccess: boolean;
}

export interface CapitalPlayerState {
  id: string;
  name: string;
  score: number;
  targetIndex: number; // 0 to 16
  history: CapitalHistoryItem[];
}
