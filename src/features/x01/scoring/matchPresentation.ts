import type { MatchState } from '../../../../types';

export const getMatchFormatText = (match: MatchState) =>
  match.config.matchMode === 'SETS'
    ? `Premier à ${match.config.setsToWin} Sets (${match.config.legsToWin} Legs/Set)`
    : `Premier à ${match.config.legsToWin} Legs`;

export const getMatchFormatCompactText = (match: MatchState) =>
  match.config.matchMode === 'SETS'
    ? `Premier a ${match.config.setsToWin} Sets`
    : `Premier a ${match.config.legsToWin} Manches`;

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
