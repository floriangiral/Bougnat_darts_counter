import type { MatchState, Turn } from '../../../../types';
import { getPlacedTeamIds, requiresThrowOrder } from '../../../application/scoring/matchLifecycle';
import { isX01TeamOpened } from '../../../domain/scoring/x01OpeningRules';
import { getDisplayedThrowerForTeam, type RemainingPreview } from './matchPreview';
import { getOpeningRequirementLabel } from './matchPresentation';

export type PlayerScoreViewModel = {
  name: string;
  subtitle?: string;
  showMatchStarterBadge: boolean;
  /** Spec 132 : à 3 ou 4 camps, n° d'ordre de passage (ou place obtenue) à la place de « D ». */
  badgeLabel?: string;
  badgeTitle?: string;
  openingStatus: string | null;
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
    remainingPreview?.teamId === teamId
      ? remainingPreview.score
      : match.currentLeg.scores[teamId];

  const orderBadge = getOrderBadge(match, teamId);

  return {
    name: displayName,
    subtitle,
    showMatchStarterBadge: orderBadge !== null || matchStartingPlayer?.teamId === teamId,
    ...(orderBadge ?? {}),
    openingStatus: isX01TeamOpened(match, teamId) ? null : getOpeningRequirementLabel(match.config.checkIn),
    isActive: currentPlayer.teamId === teamId,
    score,
    legsWon: match.legsWon[teamId],
    setsWon: match.setsWon[teamId],
    stats: {
      matchAvg: calculateThreeDartAverage(allHistory),
      legAvg: calculateThreeDartAverage(currentLegHistory),
      legDarts: currentLegHistory.reduce((total, turn) => total + turn.dartsThrown, 0),
      lastScore: allHistory.at(-1)?.score || null,
    },
  };
}

function calculateThreeDartAverage(history: Turn[]) {
  const score = history.reduce((total, turn) => total + (turn.isBust ? 0 : turn.score), 0);
  const darts = history.reduce((total, turn) => total + turn.dartsThrown, 0);
  return darts > 0 ? ((score / darts) * 3).toFixed(1) : '0.0';
}

const formatPlace = (rank: number) => (rank === 1 ? '1er' : `${rank}e`);

/** Spec 132 (RM-03) : n° d'ordre de passage, ou place obtenue une fois le camp classé. */
function getOrderBadge(match: MatchState, teamId: string): { badgeLabel: string; badgeTitle: string } | null {
  if (!requiresThrowOrder(match)) return null;
  const placeIndex = match.placement ? getPlacedTeamIds(match).indexOf(teamId) : -1;
  if (placeIndex >= 0) {
    const place = formatPlace(placeIndex + 1);
    return { badgeLabel: place, badgeTitle: `Termine ${place}` };
  }
  const order = match.players.findIndex((player) => player.teamId === teamId) + 1;
  return { badgeLabel: String(order), badgeTitle: `Ordre de passage : n° ${order}` };
}
