import type { MatchState } from '../../../types';
import { rankX01Competitors } from '../../application/scoring/x01Ranking';
import { STATS_LABELS_FR } from './statsLabels.fr';

export interface PresentedX01RankingEntry {
  competitorId: string;
  rank: number;
  rankLabel: string;
  name: string;
  isMatchWinner: boolean;
  /** Spec 132 : rang obtenu en jouant (vainqueur, places jouées) plutôt que calculé. */
  isPlayedPlace: boolean;
  detail: string;
}

const countLabel = (count: number, singular: string, plural: string) => `${count} ${count > 1 ? plural : singular}`;

export const formatX01RankLabel = (rank: number, isTied: boolean): string => {
  const ordinal = rank === 1 ? '1er' : `${rank}e`;
  const tiedSuffix = isTied ? ` ${STATS_LABELS_FR.statsView.tied}` : '';
  return `${ordinal}${tiedSuffix}`;
};

/**
 * Spec 052 (RM-03) : classement de fin présenté en français (rang, nom du camp, sets, manches, reste).
 * Spec 132 (RM-08) : dès qu'une place a été jouée, chaque rang hors vainqueur indique s'il a été joué ou calculé.
 */
export const presentX01Ranking = (match: MatchState): PresentedX01RankingEntry[] => {
  const ranking = rankX01Competitors(match);
  const hasPlayedPlaces = ranking.some((entry) => entry.isPlayedPlace && !entry.isMatchWinner);
  return ranking.map((entry) => {
    const origin = entry.isPlayedPlace
      ? STATS_LABELS_FR.statsView.playedPlace
      : STATS_LABELS_FR.statsView.computedPlace;
    const details = [
      ...(hasPlayedPlaces && !entry.isMatchWinner ? [origin] : []),
      ...(match.config.matchMode === 'SETS' ? [countLabel(entry.setsWon, 'set', 'sets')] : []),
      countLabel(entry.legsWon, 'manche', 'manches'),
      `${STATS_LABELS_FR.statsView.remaining} ${entry.lastLegRemaining}`,
    ];
    return {
      competitorId: entry.competitorId,
      rank: entry.rank,
      rankLabel: formatX01RankLabel(entry.rank, entry.isTied),
      name: match.players
        .filter((player) => player.teamId === entry.competitorId)
        .map((player) => player.name)
        .join(' / '),
      isMatchWinner: entry.isMatchWinner,
      isPlayedPlace: entry.isPlayedPlace,
      detail: details.join(' · '),
    };
  });
};
