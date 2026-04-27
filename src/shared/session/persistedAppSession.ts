import type {
  CapitalPlayerState,
  CricketMatchSummary,
  GameConfig,
  KillerMatchSummary,
  MatchState,
  TriathlonFinishPayload,
} from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';

export type MatchRuntimeSnapshot = {
  match: MatchState;
  hasGameStarted: boolean;
  elapsedSeconds: number;
};

export type PersistedAppSession = {
  screen: string;
  selectedGameType: GameType;
  currentMatch: MatchState | null;
  matchWinner: string;
  arenaPrefillPlayers: string[];
  arenaPrefillConfig?: Partial<GameConfig>;
  cricketResults: CricketMatchSummary | null;
  triathlonData: TriathlonFinishPayload | null;
  capitalResults: CapitalPlayerState[];
  killerResults?: KillerMatchSummary | null;
  matchRuntime: MatchRuntimeSnapshot | null;
};

export type LocalGameHistoryEntry = {
  id: string;
  gameType: GameType | 'CRICKET' | 'CAPITAL' | 'KILLER' | 'TRIATHLON';
  completedAt: string;
  winnerId: string | null;
  payload: Record<string, unknown>;
};
