import type { InOutRule, MatchState } from '../../../../types';
import { getTeamLegVisitCount } from '../../../application/scoring/matchLifecycle';

/** Bandeau d'une équipe pas encore ouverte en Double-In ou Master-In (spec 046). */
export const getOpeningRequirementLabel = (checkIn: InOutRule): string =>
  checkIn === 'Master' ? 'Ouverture : double ou triple requis' : 'Ouverture : double requis';

export const getOpeningConfirmQuestion = (checkIn: InOutRule, score: number): string => {
  const dartLabel = checkIn === 'Master' ? 'un double ou un triple' : 'un double';
  return `Ouverture réussie sur ${dartLabel} : ${score} points comptés ?`;
};

/** Volée en cours du camp actif sur la limite de la manche, ou `null` sans limite. */
export const getVisitLimitProgress = (match: MatchState): { current: number; limit: number } | null => {
  const limit = match.config.maxVisitsPerLeg;
  if (!limit) return null;
  const teamId = match.players[match.currentPlayerIndex]?.teamId;
  if (!teamId) return null;
  return { current: Math.min(getTeamLegVisitCount(match, teamId) + 1, limit), limit };
};

const withVisitLimit = (match: MatchState, text: string, compact: boolean) => {
  const progress = getVisitLimitProgress(match);
  if (!progress) return text;
  const visitText = `${progress.current}/${progress.limit}`;
  const visitLabel = compact ? visitText : `Volée ${visitText}`;
  return `${text} · ${visitLabel}`;
};

export const getMatchFormatText = (match: MatchState) =>
  withVisitLimit(
    match,
    match.config.matchMode === 'SETS'
      ? `Premier à ${match.config.setsToWin} Sets (${match.config.legsToWin} Legs/Set)`
      : `Premier à ${match.config.legsToWin} Legs`,
    false,
  );

export const getMatchFormatCompactText = (match: MatchState) =>
  withVisitLimit(
    match,
    match.config.matchMode === 'SETS'
      ? `1er à ${match.config.setsToWin} sets`
      : `1er à ${match.config.legsToWin} manches`,
    true,
  );

export const getStarterOptions = (match: MatchState) =>
  match.config.isDoubles
    ? [
        {
          id: 'team1',
          label:
            match.players.find((player) => player.id === match.config.teamStarterIds?.team1)?.name
            || match.players.find((player) => player.teamId === 'team1')?.name
            || 'Joueur 1',
        },
        {
          id: 'team2',
          label:
            match.players.find((player) => player.id === match.config.teamStarterIds?.team2)?.name
            || match.players.find((player) => player.teamId === 'team2')?.name
            || 'Joueur 3',
        },
      ]
    : match.players.map((player, index) => ({
        id: String(index),
        label: player.name,
      }));

export const getWinnerDisplayName = (match: MatchState, winnerTeamId: string | null) => {
  if (!winnerTeamId) return '';
  const winnerPlayers = match.players.filter((player) => player.teamId === winnerTeamId);
  if (match.config.isDoubles) {
    return winnerPlayers.map((player) => player.name).join(' / ');
  }
  return winnerPlayers[0]?.name || '';
};
