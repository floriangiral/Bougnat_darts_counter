import type {
  CapitalPlayerState,
  CricketMatchSummary,
  GameConfig,
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
  activeLobbyCode: string;
  arenaPrefillPlayers: string[];
  arenaPrefillConfig?: Partial<GameConfig>;
  sharedMatchSessionId: string | null;
  cricketResults: CricketMatchSummary | null;
  triathlonData: TriathlonFinishPayload | null;
  capitalResults: CapitalPlayerState[];
  matchRuntime: MatchRuntimeSnapshot | null;
};

export type LocalGameHistoryEntry = {
  id: string;
  gameType: GameType | 'CRICKET' | 'CAPITAL' | 'TRIATHLON';
  completedAt: string;
  winnerId: string | null;
  payload: Record<string, unknown>;
};
