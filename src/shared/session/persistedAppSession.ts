import type {
  CapitalPlayerState,
  CricketMatchSummary,
  GameConfig,
  GotchaMatchSummary,
  KillerMatchSummary,
  MatchState,
  TriathlonFinishPayload,
} from '../../../types';
import type { GameType } from '../../../utils/arenaFlow';
import type { TournamentScoringContext, TournamentSubmissionRecord } from '../../application/scoring/tournamentScoring';

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
  gotchaResults?: GotchaMatchSummary | null;
  matchRuntime: MatchRuntimeSnapshot | null;
  tournamentContext?: TournamentScoringContext | null;
  tournamentSubmission?: TournamentSubmissionRecord | null;
};

export type LocalGameHistoryEntry = {
  id: string;
  gameType: GameType | 'CRICKET' | 'CAPITAL' | 'KILLER' | 'GOTCHA' | 'TRIATHLON';
  completedAt: string;
  winnerId: string | null;
  payload: Record<string, unknown>;
};
