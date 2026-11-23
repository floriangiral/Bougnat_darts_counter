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
import type { Atc180State } from '../../domain/atc180/atc180';
import type { GotchaState } from '../../domain/gotcha/gotcha';
import type { KillerState } from '../../domain/killer/killer';
import type { CapitalGameState } from '../../features/capital/capitalGameModel';
import type { CricketGameState } from '../../features/cricket/cricketGameModel';
import type { TriathlonFlowState } from '../../features/triathlon/triathlonFlow';

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

export type PartnerResultStatus = {
  state: 'sent' | 'failed';
  host: string;
};

/**
 * Version of the persisted session schema (spec 010, ADR-0003). Sessions written before the
 * schema was versioned carry no `schemaVersion` and are read as version 1.
 */
export const APP_SESSION_SCHEMA_VERSION = 2;

/** A session older than this is purged at startup (spec 010, decision Q6). */
export const APP_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Undo steps kept in the stored session (spec 010, product owner decision: 20); the in-memory
 * depth during a game is unchanged.
 */
export const PERSISTED_UNDO_LIMIT = 20;

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

/**
 * 180 Around the Clock in progress (spec 130): the state holds every finished volley, so undo is
 * derived from it (no undo stack). `hasGameStarted` is false while « Qui commence ? » is open.
 */
export type Atc180RuntimeSnapshot = {
  gameType: 'ATC180';
  state: Atc180State;
  hasGameStarted: boolean;
  timing: GameTiming;
};

/** Capital in progress: reducer state (its `history` is the undo stack, oldest first). */
export type CapitalRuntimeSnapshot = {
  gameType: 'CAPITAL';
  state: CapitalGameState;
  hasGameStarted: boolean;
  timing: GameTiming;
};

/** Cricket in progress: reducer state (its `history` is the undo stack, oldest first). */
export type CricketRuntimeSnapshot = {
  gameType: 'CRICKET';
  state: CricketGameState;
  timing: GameTiming;
};

/** Embedded game of the current Triathlon event; its phase always equals the flow phase. */
export type TriathlonStageRuntime =
  | { phase: 'CAPITAL'; runtime: CapitalRuntimeSnapshot }
  | { phase: 'CRICKET'; runtime: CricketRuntimeSnapshot }
  | { phase: 'X01' | 'TIE_BREAK_X01'; runtime: MatchRuntimeSnapshot };

/** Triathlon in progress: event flow (phase, finished events) plus the embedded game. */
export type TriathlonRuntimeSnapshot = {
  gameType: 'TRIATHLON';
  flow: TriathlonFlowState;
  stage: TriathlonStageRuntime | null;
  timing: GameTiming;
};

/** Snapshot of a non-X01 game in progress (spec 058 `GameRuntimeSnapshot`), persisted by spec 010. */
export type GameRuntimeSnapshot =
  | GotchaRuntimeSnapshot
  | KillerRuntimeSnapshot
  | CapitalRuntimeSnapshot
  | CricketRuntimeSnapshot
  | TriathlonRuntimeSnapshot
  | Atc180RuntimeSnapshot;

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
  /** Last external result delivery state, kept to restore the partner stats actions. */
  partnerResultStatus?: PartnerResultStatus | null;
};

export type LocalGameHistoryEntry = {
  id: string;
  gameType: GameType | 'CRICKET' | 'CAPITAL' | 'KILLER' | 'GOTCHA' | 'TRIATHLON';
  completedAt: string;
  winnerId: string | null;
  payload: Record<string, unknown>;
};
