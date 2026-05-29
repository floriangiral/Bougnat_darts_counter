import type { CricketMatchSummary, CricketPlayerState, CricketTarget } from '../../../types';
import { CRICKET_TARGETS } from '../../../utils/cricketLogic';
import type { CricketTurnPayload, PersonalCricketMatchPayload } from '../../features/player-account/playerAccountTypes';

type CricketDart = CricketPlayerState['history'][number];

const roundTwoDecimals = (value: number): number => Math.round(value * 100) / 100;

const cricketTargetKey = (target: CricketTarget): keyof CricketTurnPayload['cricket']['segment_hits'] =>
  target === 25 ? 'bull' : String(target) as keyof CricketTurnPayload['cricket']['segment_hits'];

const formatCricketDart = (dart: CricketDart): string => {
  if (dart.isMiss || dart.target === null) return 'Miss';
  if (dart.target === 25) {
    if (dart.multiplier === 2) return 'DBULL';
    return 'BULL';
  }
  if (dart.multiplier === 3) return `T${dart.target}`;
  if (dart.multiplier === 2) return `D${dart.target}`;
  return `S${dart.target}`;
};

const getTotalMarks = (player: CricketPlayerState): number =>
  player.history.reduce((sum, dart) => sum + (dart.isMiss ? 0 : dart.multiplier), 0);

const getMarksForTarget = (player: CricketPlayerState, target: CricketTarget): number =>
  player.history.reduce((sum, dart) => sum + (!dart.isMiss && dart.target === target ? dart.multiplier : 0), 0);

const getVisitMarks = (darts: CricketDart[]): number =>
  darts.reduce((sum, dart) => sum + (dart.isMiss ? 0 : dart.multiplier), 0);

const getClosedSegments = (marks: Record<CricketTarget, number>): string[] =>
  CRICKET_TARGETS
    .filter((target) => marks[target] >= 3)
    .map((target) => cricketTargetKey(target));

const getCompetitorVisits = (
  competitor: CricketPlayerState,
  participant: 'player' | 'opponent',
  completedAt: string,
): CricketTurnPayload[] => {
  const runningMarks: Record<CricketTarget, number> = { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 };
  const visits: CricketTurnPayload[] = [];

  for (let index = 0; index < competitor.history.length; index += 3) {
    const darts = competitor.history.slice(index, index + 3);
    const segmentHits: CricketTurnPayload['cricket']['segment_hits'] = {
      '20': 0,
      '19': 0,
      '18': 0,
      '17': 0,
      '16': 0,
      '15': 0,
      bull: 0,
    };

    for (const dart of darts) {
      if (dart.isMiss || dart.target === null) continue;
      const key = cricketTargetKey(dart.target);
      segmentHits[key] += dart.multiplier;
      runningMarks[dart.target] += dart.multiplier;
    }

    const pointsScored = darts.reduce((sum, dart) => sum + dart.pointsScored, 0);
    visits.push({
      visit_index: visits.length + 1,
      participant,
      dart_count: darts.length,
      points_scored: pointsScored,
      dart_summary: darts.map(formatCricketDart).join(' / '),
      cricket: {
        marks_scored: getVisitMarks(darts),
        points_scored: pointsScored,
        segment_hits: segmentHits,
        closed_segments_after: getClosedSegments(runningMarks),
      },
      scored_at: completedAt,
    });
  }

  return visits;
};

const getOpponentName = (summary: CricketMatchSummary, playerId: string): string =>
  summary.competitors
    .filter((competitor) => competitor.id !== playerId)
    .map((competitor) => competitor.name.trim())
    .filter(Boolean)
    .join(' / ') || 'Adversaire local';

const getTopOpponent = (summary: CricketMatchSummary, playerId: string): CricketPlayerState | null =>
  summary.competitors
    .filter((competitor) => competitor.id !== playerId)
    .sort((a, b) => b.score - a.score)[0] ?? null;

const getPlayerResult = (summary: CricketMatchSummary, playerId: string): PersonalCricketMatchPayload['result'] => {
  if (!summary.winnerId) return 'draw';
  return summary.winnerId === playerId ? 'win' : 'loss';
};

export const buildPersonalCricketMatchPayload = (
  summary: CricketMatchSummary,
  options: {
    completedAt?: string;
    playerId?: string;
    participantKey?: string;
    targetPlayerId?: string;
  } = {},
): PersonalCricketMatchPayload => {
  const player = summary.competitors.find((competitor) => competitor.id === options.playerId) ?? summary.competitors[0];
  if (!player) {
    throw new Error('Aucun joueur Cricket disponible pour synchroniser le match.');
  }

  const opponent = getTopOpponent(summary, player.id);
  const completedAt = options.completedAt ?? summary.completedAt ?? new Date().toISOString();
  const completedAtDate = new Date(completedAt);
  const durationSec = Math.max(0, Math.round(summary.durationSec ?? 0));
  const startedAt = summary.startedAt ?? (
    Number.isNaN(completedAtDate.getTime())
      ? completedAt
      : new Date(completedAtDate.getTime() - durationSec * 1000).toISOString()
  );
  const totalMarks = getTotalMarks(player);
  const dartsThrown = player.dartsThrown;
  const visitsCount = Math.ceil(dartsThrown / 3);
  const matchMpr = dartsThrown > 0 ? (totalMarks * 3) / dartsThrown : 0;
  const visitMarks = Array.from({ length: visitsCount }, (_, visitIndex) => (
    getVisitMarks(player.history.slice(visitIndex * 3, visitIndex * 3 + 3))
  ));
  const pointsScored = player.score;
  const pointsAllowed = opponent?.score ?? 0;
  const closeRate = CRICKET_TARGETS.length > 0
    ? (CRICKET_TARGETS.filter((target) => player.marks[target] >= 3).length / CRICKET_TARGETS.length) * 100
    : 0;

  const turns = summary.competitors.flatMap((competitor) => (
    getCompetitorVisits(competitor, competitor.id === player.id ? 'player' : 'opponent', completedAt)
  )).map((turn, index) => ({ ...turn, visit_index: index + 1 }));

  return {
    client_match_id: summary.clientMatchId ?? `cricket-${completedAt}`,
    participant_key: options.participantKey,
    target_player_id: options.targetPlayerId,
    confirmation_policy: options.targetPlayerId ? 'player_confirmation_required' : undefined,
    game_mode: 'cricket',
    variant: 'standard',
    started_at: startedAt,
    completed_at: completedAt,
    duration_sec: durationSec,
    opponent: {
      type: 'local',
      name: getOpponentName(summary, player.id),
    },
    result: getPlayerResult(summary, player.id),
    player_score: pointsScored,
    opponent_score: pointsAllowed,
    stats: {
      cricket: {
        match_mpr: roundTwoDecimals(matchMpr),
        total_marks: totalMarks,
        count_9_marks: visitMarks.filter((marks) => marks === 9).length,
        count_8_marks: visitMarks.filter((marks) => marks === 8).length,
        count_7_marks: visitMarks.filter((marks) => marks === 7).length,
        count_6_plus_marks: visitMarks.filter((marks) => marks >= 6).length,
        points_scored: pointsScored,
        points_allowed: pointsAllowed,
        bull_marks: getMarksForTarget(player, 25),
        marks_20: getMarksForTarget(player, 20),
        marks_19: getMarksForTarget(player, 19),
        marks_18: getMarksForTarget(player, 18),
        marks_17: getMarksForTarget(player, 17),
        marks_16: getMarksForTarget(player, 16),
        marks_15: getMarksForTarget(player, 15),
        close_rate: roundTwoDecimals(closeRate),
        darts_thrown: dartsThrown,
        visits_count: visitsCount,
      },
    },
    turns,
  };
};
