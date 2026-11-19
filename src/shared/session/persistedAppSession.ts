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

/** X01 format imposed by an external match link (spec 030). */
export type ExternalMatchConfig = Pick<
  GameConfig,
  'startingScore' | 'checkIn' | 'checkOut' | 'matchMode' | 'legsToWin' | 'isDoubles'
> & { setsToWin?: number };

/**
 * External match link in progress (spec 030): the return URL plus the players and format
 * imposed by the link, so the result is only sent for the match the organizer created.
 */
export type ExternalMatchContext = {
  returnUrl: string;
  /** 2 names (singles) or 4 names (doubles, team 1 then team 2), in link order */
  playerNames: string[];
  config: ExternalMatchConfig;
  /** When the link was applied (epoch ms): stale contexts expire on a shared device */
  createdAt: number;
};

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
  /** External match link in progress (spec 030); re-validated before any use. */
  externalMatch?: ExternalMatchContext | null;
};

export type LocalGameHistoryEntry = {
  id: string;
  gameType: GameType | 'CRICKET' | 'CAPITAL' | 'KILLER' | 'GOTCHA' | 'TRIATHLON';
  completedAt: string;
  winnerId: string | null;
  payload: Record<string, unknown>;
};
