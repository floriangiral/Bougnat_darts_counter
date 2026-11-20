import type { MatchState } from '../../../types';
import { rankX01Competitors } from '../../application/scoring/x01Ranking';
import { STATS_LABELS_FR } from './statsLabels.fr';

export interface PresentedX01RankingEntry {
  competitorId: string;
  rank: number;
  rankLabel: string;
  name: string;
  isMatchWinner: boolean;
  detail: string;
}

const countLabel = (count: number, singular: string, plural: string) => `${count} ${count > 1 ? plural : singular}`;

export const formatX01RankLabel = (rank: number, isTied: boolean): string =>
  `${rank === 1 ? '1er' : `${rank}e`}${isTied ? ` ${STATS_LABELS_FR.statsView.tied}` : ''}`;

/** Spec 052 (RM-03) : classement de fin présenté en français (rang, nom du camp, sets, manches, reste). */
export const presentX01Ranking = (match: MatchState): PresentedX01RankingEntry[] =>
  rankX01Competitors(match).map((entry) => {
    const details = [
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
      detail: details.join(' · '),
    };
  });
