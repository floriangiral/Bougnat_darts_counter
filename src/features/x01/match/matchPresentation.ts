import type { MatchState } from '../../../../types';
import { ScoringRules } from '../../../domain/scoring';

export const isCheckoutPossible = (score: number, checkOut: MatchState['config']['checkOut']) => {
  return ScoringRules.isCheckoutPossible(score, checkOut);
};

export const getMatchFormatText = (match: MatchState) => (
  match.config.matchMode === 'SETS'
    ? `Premier à ${match.config.setsToWin} Sets (${match.config.legsToWin} Legs/Set)`
    : `Premier à ${match.config.legsToWin} Legs`
);

export const getMatchFormatCompactText = (match: MatchState) => (
  match.config.matchMode === 'SETS'
    ? `Premier a ${match.config.setsToWin} Sets`
    : `Premier a ${match.config.legsToWin} Manches`
);

export const getWinnerDisplayName = (match: MatchState, winnerTeamId: string | null) => {
  if (!winnerTeamId) return '';
  const winnerPlayers = match.players.filter((player) => player.teamId === winnerTeamId);
  if (match.config.isDoubles) {
    return winnerPlayers.map((player) => player.name).join(' / ');
  }
  return winnerPlayers[0]?.name || '';
};
