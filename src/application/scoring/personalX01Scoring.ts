import type { LegState, MatchState, Turn } from '../../../types';
import type { PersonalX01MatchPayload } from '../../features/player-account/playerAccountTypes';
import { calculateDetailedStatsForTeam } from './matchStats';

export type X01VisitBands = {
  count180: number;
  count140Plus: number;
  count100Plus: number;
};

type LegWithIndex = {
  leg: LegState;
  legIndex: number;
};

const roundTwoDecimals = (value: number): number => Math.round(value * 100) / 100;

const getTeamIds = (match: MatchState): string[] =>
  Array.from(new Set(match.players.map((player) => player.teamId)));

const getTurnTeamId = (match: MatchState, turn: Turn): string | null =>
  match.players.find((player) => player.id === turn.playerId)?.teamId ?? null;

const getAllPlayedLegs = (match: MatchState): LegWithIndex[] => {
  const legs = match.completedLegs.map((leg, legIndex) => ({ leg, legIndex }));
  if (match.currentLeg.history.length > 0 || match.currentLeg.winnerId) {
    legs.push({ leg: match.currentLeg, legIndex: legs.length });
  }
  return legs;
};

export const calculateX01VisitBands = (turns: Turn[]): X01VisitBands => ({
  count180: turns.filter((turn) => !turn.isBust && turn.score === 180).length,
  count140Plus: turns.filter((turn) => !turn.isBust && turn.score >= 140 && turn.score < 180).length,
  count100Plus: turns.filter((turn) => !turn.isBust && turn.score >= 100 && turn.score < 140).length,
});

const isCheckoutAttempt = (
  match: MatchState,
  remainingBeforeTurn: number,
  turn: Turn,
  leg: LegState,
  turnIndex: number,
  teamId: string,
): boolean => {
  const maxCheckout = match.config.checkOut === 'Double' ? 170 : 180;
  if (remainingBeforeTurn <= 1 || remainingBeforeTurn > maxCheckout) {
    return false;
  }

  const isWinningTurn = leg.winnerId === teamId && turnIndex === leg.history.length - 1 && !turn.isBust;
  return turn.isBust || isWinningTurn;
};

const buildDartSummary = (turn: Turn): string => {
  if (turn.isBust) {
    return 'Bust';
  }
  if (turn.score === 180 && turn.dartsThrown === 3) {
    return 'T20 / T20 / T20';
  }
  if (turn.dartsThrown === 0) {
    return String(turn.score);
  }
  return `${turn.score} (${turn.dartsThrown} fleche${turn.dartsThrown > 1 ? 's' : ''})`;
};

const getScoreForTeam = (match: MatchState, teamId: string): number =>
  match.config.matchMode === 'SETS'
    ? match.setsWon[teamId] ?? 0
    : match.legsWon[teamId] ?? 0;

const getOpponentName = (match: MatchState, playerTeamId: string): string => {
  const opponentTeamId = getTeamIds(match).find((teamId) => teamId !== playerTeamId);
  const opponentNames = match.players
    .filter((player) => player.teamId === opponentTeamId)
    .map((player) => player.name.trim())
    .filter(Boolean);
  return opponentNames.join(' / ') || 'Adversaire local';
};

const getSetAndLegNumber = (match: MatchState, legIndex: number): { setNumber: number; legNumber: number } => {
  if (match.config.matchMode !== 'SETS') {
    return { setNumber: 1, legNumber: legIndex + 1 };
  }

  const legsPerSet = Math.max(1, match.config.legsToWin * 2 - 1);
  return {
    setNumber: Math.floor(legIndex / legsPerSet) + 1,
    legNumber: (legIndex % legsPerSet) + 1,
  };
};

export const buildPersonalX01MatchPayload = (
  match: MatchState,
  options: {
    completedAt?: string;
    playerTeamId?: string;
    participantKey?: string;
    targetPlayerId?: string;
  } = {},
): PersonalX01MatchPayload => {
  const playerTeamId = options.playerTeamId ?? match.players[0]?.teamId ?? 'team1';
  const opponentTeamId = getTeamIds(match).find((teamId) => teamId !== playerTeamId) ?? '';
  const completedAt = options.completedAt ?? new Date().toISOString();
  const completedAtDate = new Date(completedAt);
  const startedAt = Number.isNaN(completedAtDate.getTime())
    ? completedAt
    : new Date(completedAtDate.getTime() - Math.max(0, match.duration) * 1000).toISOString();
  const playerTurns: Turn[] = [];
  let visitIndex = 0;

  const turns = getAllPlayedLegs(match).flatMap(({ leg, legIndex }) => {
    const teamScores: Record<string, number> = Object.fromEntries(
      getTeamIds(match).map((teamId) => [teamId, match.config.startingScore]),
    );
    const legNumbers = getSetAndLegNumber(match, legIndex);

    return leg.history.map((turn, turnIndex) => {
      visitIndex += 1;
      const teamId = getTurnTeamId(match, turn) ?? '';
      const isPlayer = teamId === playerTeamId;
      const remainingBeforeTurn = teamScores[teamId] ?? match.config.startingScore;
      if (isPlayer) {
        playerTurns.push(turn);
      }
      if (!turn.isBust) {
        teamScores[teamId] = turn.remainingAfter;
      }

      return {
        visit_index: visitIndex,
        participant: isPlayer ? 'player' as const : 'opponent' as const,
        set_number: legNumbers.setNumber,
        leg_number: legNumbers.legNumber,
        points_scored: turn.isBust ? 0 : turn.score,
        remaining_points: turn.remainingAfter,
        checkout_attempt: isCheckoutAttempt(match, remainingBeforeTurn, turn, leg, turnIndex, teamId),
        dart_count: turn.dartsThrown,
        dart_summary: buildDartSummary(turn),
        scored_at: completedAt,
      };
    });
  });

  const stats = calculateDetailedStatsForTeam(match, playerTeamId);
  const bands = calculateX01VisitBands(playerTurns);
  const playerScore = getScoreForTeam(match, playerTeamId);
  const opponentScore = opponentTeamId ? getScoreForTeam(match, opponentTeamId) : 0;
  const result =
    match.matchWinnerId === playerTeamId
      ? 'win'
      : match.matchWinnerId && match.matchWinnerId !== playerTeamId
        ? 'loss'
        : 'draw';

  return {
    client_match_id: match.id,
    participant_key: options.participantKey,
    target_player_id: options.targetPlayerId,
    confirmation_policy: options.targetPlayerId ? 'player_confirmation_required' : undefined,
    game_mode: 'x01',
    target: match.config.startingScore,
    started_at: startedAt,
    completed_at: completedAt,
    duration_sec: Math.max(0, Math.round(match.duration)),
    opponent: {
      type: 'local',
      name: getOpponentName(match, playerTeamId),
    },
    result,
    player_score: playerScore,
    opponent_score: opponentScore,
    stats: {
      match_average: roundTwoDecimals(stats.threeDartAverage),
      count_180: bands.count180,
      count_140_plus: bands.count140Plus,
      count_100_plus: bands.count100Plus,
      best_checkout: stats.highestCheckout,
      checkout_rate: roundTwoDecimals(stats.checkoutRate),
    },
    turns,
  };
};
