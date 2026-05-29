import type { GameConfig, InOutRule, MatchMode, MatchState, Player } from '../../../types';
import { createMatch } from './matchLifecycle';
import { calculateDetailedStatsForTeam } from './matchStats';

export type TournamentScoringRight = {
  canScore: boolean;
  canSubmitResult: boolean;
  canEdit?: boolean;
  reason?: string;
};

export type TournamentMatchStatus =
  | 'assigned'
  | 'ready'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'locked'
  | 'unknown';

export type TournamentMatchSummary = {
  tournamentId: string;
  matchId: string;
  tournamentName: string;
  label: string;
  boardLabel?: string;
  status: TournamentMatchStatus;
  formatLabel: string;
  players: string[];
  rights: TournamentScoringRight;
  raw?: unknown;
};

export type TournamentScoringContext = {
  tournamentId: string;
  matchId: string;
  assignmentId?: string;
  tournamentName?: string;
  boardLabel?: string;
  status: TournamentMatchStatus;
  format: {
    gameType: 'X01';
    label: string;
  };
  players: Player[];
  rules: GameConfig;
  rights: TournamentScoringRight;
  loadedAt: string;
  raw?: unknown;
};

export type TournamentMatchDetail = {
  context: TournamentScoringContext;
  match: MatchState;
};

export type TournamentResultSubmissionStatus =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'rejected'
  | 'conflict'
  | 'network_error'
  | 'error';

export type TournamentX01ResultPayload = {
  contract: 'bougnat-counter.x01-result.v0';
  tournament_id: string;
  match_id: string;
  idempotency_key: string;
  submitted_at: string;
  duration_sec: number;
  game_type: 'x01';
  players: Array<{ id: string; name: string; team_id: string }>;
  teams: Array<{ team_id: string; player_ids: string[]; player_names: string[] }>;
  winner_team_id: string | null;
  final_score: Record<string, number>;
  format: {
    mode: MatchMode;
    legs_to_win: number;
    sets_to_win: number;
  };
  rules: {
    starting_score: number;
    check_in: InOutRule;
    check_out: InOutRule;
    is_doubles: boolean;
  };
  legs: Array<{
    leg_number: number;
    winner_team_id: string | null;
    turns: Array<{
      visit_number: number;
      player_id: string;
      team_id: string;
      score: number;
      is_bust: boolean;
      remaining_after: number;
      darts_thrown: number;
    }>;
  }>;
  stats: Record<string, {
    three_dart_average: number;
    checkout_rate: number;
    checkout_made: number;
    checkout_attempts: number;
    highest_checkout: number;
    highest_score: number;
    count_180: number;
    count_140_plus: number;
    count_100_plus: number;
    best_leg_darts: number | null;
  }>;
};

export type TournamentResultSubmission = {
  idempotencyKey: string;
  tournamentId: string;
  matchId: string;
  context: TournamentScoringContext;
  match: MatchState;
  completedAt: string;
  payload: TournamentX01ResultPayload;
};

export type TournamentSubmissionRecord = TournamentResultSubmission & {
  status: TournamentResultSubmissionStatus;
  remoteSubmissionId?: string;
  errorMessage?: string;
  updatedAt: string;
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? value as Record<string, unknown> : null;

const readString = (records: Array<Record<string, unknown> | null>, keys: string[], fallback = ''): string => {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
  }
  return fallback;
};

const readNumber = (records: Array<Record<string, unknown> | null>, keys: string[], fallback: number): number => {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) return parsed;
      }
    }
  }
  return fallback;
};

const readBoolean = (records: Array<Record<string, unknown> | null>, keys: string[], fallback: boolean): boolean => {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
  }
  return fallback;
};

const readRecord = (record: Record<string, unknown> | null, keys: string[]): Record<string, unknown> | null => {
  if (!record) return null;
  for (const key of keys) {
    const nested = getRecord(record[key]);
    if (nested) return nested;
  }
  return null;
};

const normalizeStatus = (value: string): TournamentMatchStatus => {
  const normalized = value.toLowerCase();
  if (['assigned', 'ready', 'in_progress', 'submitted', 'completed', 'locked'].includes(normalized)) {
    return normalized as TournamentMatchStatus;
  }
  return 'unknown';
};

const normalizeRule = <T extends string>(value: string, allowed: readonly T[], fallback: T): T => {
  const normalized = value.toLowerCase();
  const match = allowed.find((item) => item.toLowerCase() === normalized);
  return match ?? fallback;
};

const normalizePlayers = (rawPlayers: unknown): Player[] => {
  const values = Array.isArray(rawPlayers) ? rawPlayers : [];
  const players = values
    .map((value, index) => {
      const record = getRecord(value);
      if (!record) return null;
      const teamId = readString([record], ['team_id', 'teamId', 'team'], index % 2 === 0 ? 'team1' : 'team2');
      const id = readString([record], ['counter_player_id', 'counterPlayerId', 'id', 'player_id', 'playerId'], `p${index + 1}`);
      const name = readString([record], ['display_name', 'displayName', 'name', 'player_name', 'playerName'], `Joueur ${index + 1}`);
      return { id, name, teamId };
    })
    .filter((player): player is Player => Boolean(player));

  return players.length >= 2
    ? players
    : [
        { id: 'p1', name: 'Joueur 1', teamId: 'team1' },
        { id: 'p2', name: 'Joueur 2', teamId: 'team2' },
      ];
};

const buildFormatLabel = (config: GameConfig) =>
  config.matchMode === 'SETS'
    ? `${config.startingScore} - ${config.setsToWin} sets / ${config.legsToWin} legs`
    : `${config.startingScore} - ${config.legsToWin} legs`;

export const mapTournamentMatchSummary = (value: unknown): TournamentMatchSummary | null => {
  const record = getRecord(value);
  if (!record) return null;
  const tournament = readRecord(record, ['tournament']);
  const match = readRecord(record, ['match']);
  const format = readRecord(record, ['format', 'rules']);
  const rights = readRecord(record, ['rights', 'permissions']);
  const rawPlayers = record.players ?? match?.players ?? record.participants ?? match?.participants;
  const players = normalizePlayers(rawPlayers);
  const tournamentId = readString([record, match, tournament], ['tournament_id', 'tournamentId', 'id']);
  const matchId = readString([record, match], ['match_id', 'matchId', 'id']);
  if (!tournamentId || !matchId) return null;

  const startingScore = readNumber([record, match, format], ['starting_score', 'startingScore', 'target'], 501);
  const matchMode = normalizeRule(readString([record, match, format], ['match_mode', 'matchMode', 'mode'], 'LEGS'), ['LEGS', 'SETS'] as const, 'LEGS');
  const config: GameConfig = {
    startingScore,
    checkIn: normalizeRule(readString([record, match, format], ['check_in', 'checkIn'], 'Open'), ['Open', 'Double', 'Master'] as const, 'Open'),
    checkOut: normalizeRule(readString([record, match, format], ['check_out', 'checkOut'], 'Double'), ['Open', 'Double', 'Master'] as const, 'Double'),
    matchMode,
    setsToWin: readNumber([record, match, format], ['sets_to_win', 'setsToWin'], 1),
    legsToWin: readNumber([record, match, format], ['legs_to_win', 'legsToWin'], 3),
    isDoubles: readBoolean([record, match, format], ['is_doubles', 'isDoubles', 'doubles'], players.length > 2),
  };

  return {
    tournamentId,
    matchId,
    tournamentName: readString([record, tournament], ['tournament_name', 'tournamentName', 'name'], 'Tournoi'),
    label: readString([record, match], ['label', 'name', 'round', 'stage_name', 'stageName'], `Match ${matchId}`),
    boardLabel: readString([record, match], ['board_label', 'boardLabel', 'board']) || undefined,
    status: normalizeStatus(readString([record, match], ['status', 'state'], 'assigned')),
    formatLabel: buildFormatLabel(config),
    players: players.map((player) => player.name),
    rights: {
      canScore: readBoolean([rights, record], ['can_score', 'canScore'], true),
      canSubmitResult: readBoolean([rights, record], ['can_submit_result', 'canSubmitResult'], true),
      canEdit: readBoolean([rights, record], ['can_edit', 'canEdit'], false),
      reason: readString([rights], ['reason']) || undefined,
    },
    raw: value,
  };
};

export const mapTournamentMatchDetail = (value: unknown): TournamentMatchDetail => {
  const record = getRecord(value);
  const matchRecord = readRecord(record, ['match']);
  const tournament = readRecord(record, ['tournament']);
  const format = readRecord(record, ['format', 'rules']) ?? readRecord(matchRecord, ['format', 'rules']);
  const rights = readRecord(record, ['rights', 'permissions']) ?? readRecord(matchRecord, ['rights', 'permissions']);
  const players = normalizePlayers(record?.players ?? matchRecord?.players ?? record?.participants ?? matchRecord?.participants);
  const matchMode = normalizeRule(readString([record, matchRecord, format], ['match_mode', 'matchMode', 'mode'], 'LEGS'), ['LEGS', 'SETS'] as const, 'LEGS');
  const config: GameConfig = {
    startingScore: readNumber([record, matchRecord, format], ['starting_score', 'startingScore', 'target'], 501),
    checkIn: normalizeRule(readString([record, matchRecord, format], ['check_in', 'checkIn'], 'Open'), ['Open', 'Double', 'Master'] as const, 'Open'),
    checkOut: normalizeRule(readString([record, matchRecord, format], ['check_out', 'checkOut'], 'Double'), ['Open', 'Double', 'Master'] as const, 'Double'),
    matchMode,
    setsToWin: readNumber([record, matchRecord, format], ['sets_to_win', 'setsToWin'], 1),
    legsToWin: readNumber([record, matchRecord, format], ['legs_to_win', 'legsToWin'], 3),
    isDoubles: readBoolean([record, matchRecord, format], ['is_doubles', 'isDoubles', 'doubles'], players.length > 2),
  };
  const tournamentId = readString([record, matchRecord, tournament], ['tournament_id', 'tournamentId', 'id'], 'unknown-tournament');
  const matchId = readString([record, matchRecord], ['match_id', 'matchId', 'id'], 'unknown-match');
  const match = {
    ...createMatch(players, config),
    id: `tournament:${tournamentId}:${matchId}`,
  };
  const context: TournamentScoringContext = {
    tournamentId,
    matchId,
    assignmentId: readString([record, matchRecord], ['assignment_id', 'assignmentId']) || undefined,
    tournamentName: readString([record, tournament], ['tournament_name', 'tournamentName', 'name']) || undefined,
    boardLabel: readString([record, matchRecord], ['board_label', 'boardLabel', 'board']) || undefined,
    status: normalizeStatus(readString([record, matchRecord], ['status', 'state'], 'assigned')),
    format: {
      gameType: 'X01',
      label: buildFormatLabel(config),
    },
    players,
    rules: config,
    rights: {
      canScore: readBoolean([rights, record], ['can_score', 'canScore'], true),
      canSubmitResult: readBoolean([rights, record], ['can_submit_result', 'canSubmitResult'], true),
      canEdit: readBoolean([rights, record], ['can_edit', 'canEdit'], false),
      reason: readString([rights], ['reason']) || undefined,
    },
    loadedAt: new Date().toISOString(),
    raw: value,
  };

  return { context, match };
};

export const buildTournamentResultIdempotencyKey = (context: TournamentScoringContext, match: MatchState): string =>
  `tournament:${context.tournamentId}:match:${context.matchId}:result:${match.id}`;

export const mapX01TournamentResultSubmission = (
  context: TournamentScoringContext,
  match: MatchState,
  completedAt = new Date().toISOString(),
): TournamentResultSubmission => {
  const idempotencyKey = buildTournamentResultIdempotencyKey(context, match);
  const teams = Array.from(new Set(match.players.map((player) => player.teamId)));
  const allLegs = [...match.completedLegs];
  if (match.currentLeg.winnerId || match.currentLeg.history.length > 0) {
    allLegs.push(match.currentLeg);
  }

  const payload: TournamentX01ResultPayload = {
    contract: 'bougnat-counter.x01-result.v0',
    tournament_id: context.tournamentId,
    match_id: context.matchId,
    idempotency_key: idempotencyKey,
    submitted_at: completedAt,
    duration_sec: match.duration,
    game_type: 'x01',
    players: match.players.map((player) => ({ id: player.id, name: player.name, team_id: player.teamId })),
    teams: teams.map((teamId) => ({
      team_id: teamId,
      player_ids: match.players.filter((player) => player.teamId === teamId).map((player) => player.id),
      player_names: match.players.filter((player) => player.teamId === teamId).map((player) => player.name),
    })),
    winner_team_id: match.matchWinnerId,
    final_score: Object.fromEntries(teams.map((teamId) => [
      teamId,
      match.config.matchMode === 'SETS' ? match.setsWon[teamId] ?? 0 : match.legsWon[teamId] ?? 0,
    ])),
    format: {
      mode: match.config.matchMode,
      legs_to_win: match.config.legsToWin,
      sets_to_win: match.config.setsToWin,
    },
    rules: {
      starting_score: match.config.startingScore,
      check_in: match.config.checkIn,
      check_out: match.config.checkOut,
      is_doubles: match.config.isDoubles,
    },
    legs: allLegs.map((leg, legIndex) => ({
      leg_number: legIndex + 1,
      winner_team_id: leg.winnerId,
      turns: leg.history.map((turn, turnIndex) => {
        const player = match.players.find((candidate) => candidate.id === turn.playerId);
        return {
          visit_number: turnIndex + 1,
          player_id: turn.playerId,
          team_id: player?.teamId ?? '',
          score: turn.score,
          is_bust: turn.isBust,
          remaining_after: turn.remainingAfter,
          darts_thrown: turn.dartsThrown,
        };
      }),
    })),
    stats: Object.fromEntries(teams.map((teamId) => {
      const stats = calculateDetailedStatsForTeam(match, teamId);
      return [teamId, {
        three_dart_average: stats.threeDartAverage,
        checkout_rate: stats.checkoutRate,
        checkout_made: stats.checkoutMade,
        checkout_attempts: stats.checkoutAttempts,
        highest_checkout: stats.highestCheckout,
        highest_score: stats.highestScore,
        count_180: stats.scoreCounts.c180,
        count_140_plus: stats.scoreCounts.c140 + stats.scoreCounts.c160 + stats.scoreCounts.c180,
        count_100_plus: stats.scoreCounts.c100 + stats.scoreCounts.c120 + stats.scoreCounts.c140 + stats.scoreCounts.c160 + stats.scoreCounts.c180,
        best_leg_darts: stats.bestLegDarts,
      }];
    })),
  };

  return {
    idempotencyKey,
    tournamentId: context.tournamentId,
    matchId: context.matchId,
    context,
    match,
    completedAt,
    payload,
  };
};
