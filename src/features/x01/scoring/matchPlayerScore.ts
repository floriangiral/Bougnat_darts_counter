import type { MatchState, Turn } from '../../../../types';
import { getDisplayedThrowerForTeam, type RemainingPreview } from './matchPreview';

export type PlayerScoreViewModel = {
  name: string;
  subtitle?: string;
  showMatchStarterBadge: boolean;
  isActive: boolean;
  score: number;
  legsWon: number;
  setsWon?: number;
  stats: {
    matchAvg: string;
    legAvg: string;
    legDarts: number;
    lastScore: number | null;
  };
};

export function buildPlayerScoreViewModel(
  match: MatchState,
  teamId: string,
  remainingPreview: RemainingPreview | null,
): PlayerScoreViewModel {
  const currentPlayer = match.players[match.currentPlayerIndex];
  const teamPlayers = match.players.filter((player) => player.teamId === teamId);
  const displayedThrower = getDisplayedThrowerForTeam(match, match.currentPlayerIndex, teamId);
  const displayName = match.config.isDoubles ? (displayedThrower?.name || teamPlayers[0]?.name) : teamPlayers[0]?.name;
  const subtitle = match.config.isDoubles ? teamPlayers.map((player) => player.name).join(' / ') : undefined;
  const matchStartingPlayer =
    match.completedLegs.length > 0
      ? match.players[match.completedLegs[0].startingPlayerIndex]
      : match.players[match.currentLeg.startingPlayerIndex];
  const allHistory = [...match.completedLegs, match.currentLeg]
    .flatMap((leg) => leg.history)
    .filter((turn) => match.players.find((player) => player.id === turn.playerId)?.teamId === teamId);
  const currentLegHistory = match.currentLeg.history.filter(
    (turn) => match.players.find((player) => player.id === turn.playerId)?.teamId === teamId,
  );
  const score =
    remainingPreview && remainingPreview.teamId === teamId
      ? remainingPreview.score
      : match.currentLeg.scores[teamId];

  return {
    name: displayName,
    subtitle,
    showMatchStarterBadge: matchStartingPlayer?.teamId === teamId,
    isActive: currentPlayer.teamId === teamId,
    score,
    legsWon: match.legsWon[teamId],
    setsWon: match.setsWon[teamId],
    stats: {
      matchAvg: calculateThreeDartAverage(allHistory),
      legAvg: calculateThreeDartAverage(currentLegHistory),
      legDarts: currentLegHistory.reduce((total, turn) => total + turn.dartsThrown, 0),
      lastScore: allHistory[allHistory.length - 1]?.score || null,
    },
  };
}

function calculateThreeDartAverage(history: Turn[]) {
  const score = history.reduce((total, turn) => total + (turn.isBust ? 0 : turn.score), 0);
  const darts = history.reduce((total, turn) => total + turn.dartsThrown, 0);
  return darts > 0 ? ((score / darts) * 3).toFixed(1) : '0.0';
}
