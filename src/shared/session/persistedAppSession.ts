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
import type { GotchaState } from '../../domain/gotcha/gotcha';
import type { KillerState } from '../../domain/killer/killer';

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
  /** `stats=1`: the result also carries match statistics (averages, 180s, checkouts, duration) */
  includeStats?: boolean;
};

/**
 * Version of the persisted session schema (spec 010, ADR-0003). Sessions written before the
 * schema was versioned carry no `schemaVersion` and are read as version 1.
 */
export const APP_SESSION_SCHEMA_VERSION = 2;

/** A session older than this is purged at startup (spec 010, decision Q6). */
export const APP_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Undo entries kept in the persisted snapshot of a game (spec 010; in-memory depth is unchanged). */
export const PERSISTED_UNDO_LIMIT = 50;

/** Game clock as persisted: elapsed seconds read at `measuredAt` (epoch ms), running or not. */
export type GameTiming = {
  elapsedSeconds: number;
  measuredAt: number;
  running: boolean;
};

/** One X01 undo step, as kept by MatchView. */
export type X01UndoSnapshot = {
  match: MatchState;
  elapsedSeconds: number;
  showWinnerScreen: boolean;
  hasGameStarted: boolean;
};

export type MatchRuntimeSnapshot = {
  match: MatchState;
  hasGameStarted: boolean;
  elapsedSeconds: number;
  /** When `elapsedSeconds` was read (epoch ms); absent in sessions saved before schema 2. */
  measuredAt?: number;
  /** Most recent undo steps (bounded by PERSISTED_UNDO_LIMIT); absent before schema 2. */
  undoStack?: X01UndoSnapshot[];
};

/** Gotcha in progress: state plus its undo stack (newest first, as kept by the view). */
export type GotchaRuntimeSnapshot = {
  gameType: 'GOTCHA';
  state: GotchaState;
  history: GotchaState[];
  timing: GameTiming;
};

/** Killer in progress: state plus its undo stack (newest first, as kept by the view). */
export type KillerRuntimeSnapshot = {
  gameType: 'KILLER';
  state: KillerState;
  history: KillerState[];
  timing: GameTiming;
};

/** Snapshot of a non-X01 game in progress (spec 058 `GameRuntimeSnapshot`), persisted by spec 010. */
export type GameRuntimeSnapshot = GotchaRuntimeSnapshot | KillerRuntimeSnapshot;

export type PersistedAppSession = {
  /** Absent in sessions saved before schema 2; always set on write. */
  schemaVersion?: number;
  /** Last write (epoch ms); absent in sessions saved before schema 2; always set on write. */
  savedAt?: number;
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
  /** Non-X01 game in progress (absent before schema 2). */
  gameRuntime?: GameRuntimeSnapshot | null;
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
