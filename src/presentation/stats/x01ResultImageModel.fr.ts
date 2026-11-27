import type { MatchState, Player } from '../../../types';
import { calculateDetailedStats, calculateDetailedStatsForTeam } from '../../application/scoring/matchStats';
import { presentX01DetailedStats, X01_SCORE_COUNT_ROWS } from './statsPresenter.fr';
import { STATS_LABELS_FR } from './statsLabels.fr';
import { presentX01Ranking } from './x01RankingPresenter.fr';
import { presentX01ResultHeader } from './x01ResultHeader.fr';

export interface X01ImageSection {
  title: string;
  lines: string[];
}

export interface X01ResultImageModel {
  heading: string;
  sections: X01ImageSection[];
}

const playerName = (player: Player) => `${player.name}${player.isBot ? ' (robot)' : ''}`;
const sideName = (match: MatchState, id: string) =>
  match.players.filter((player) => player.teamId === id).map(playerName).join(' / ');

const statsSection = (
  match: MatchState,
  title: string,
  stats: ReturnType<typeof calculateDetailedStats>,
  individualDoubles: boolean,
): X01ImageSection => {
  const presented = presentX01DetailedStats(stats);
  const labels = STATS_LABELS_FR.x01.overview;
  const singleLeg = match.config.matchMode === 'LEGS' && match.config.legsToWin === 1;
  const notApplicable = 'Non applicable (manches gagnées en équipe)';
  return {
    title,
    lines: [
      `${labels.matchDuration} : ${match.duration ? presentX01ResultHeader(match, match.matchWinnerId ?? '').durationLabel : '-'}`,
      `${labels.threeDartAverage} : ${presented.threeDartAverage}`,
      `${labels.until170Average} : ${presented.nonCheckoutAverage}`,
      `${labels.checkoutRate} : ${presented.checkoutRate}`,
      presented.checkoutSummary,
      ...presented.checkoutBreakdown,
      `${labels.highestCheckout} : ${presented.highestCheckout}`,
      `${labels.highestScore} : ${presented.highestScore}`,
      `${singleLeg ? labels.averageWinningDarts : labels.averageWinningLegDarts} : ${individualDoubles ? notApplicable : presented.averageWinningLegDarts}`,
      `${singleLeg ? labels.winningDarts : labels.bestWorstLeg} : ${individualDoubles ? notApplicable : singleLeg ? presented.bestLegDarts ?? '-' : `${presented.bestLegDarts ?? '-'} / ${presented.worstLegDarts ?? '-'}`}`,
      STATS_LABELS_FR.x01.tabs.scoring,
      ...X01_SCORE_COUNT_ROWS.map(({ label, key }) => `${label} : ${presented.scoreCounts[key]}`),
    ],
  };
};

/** Modèle indépendant du rendu, partagé par les tests et la génération locale. */
export const buildX01ResultImageModel = (match: MatchState): X01ResultImageModel => {
  if (match.status !== 'finished' || !match.matchWinnerId || !match.players.length) {
    throw new Error('Impossible de générer une image pour un match non terminé.');
  }
  const header = presentX01ResultHeader(match, match.matchWinnerId);
  const winner = header.sides.find((side) => side.isWinner);
  if (!winner) throw new Error('Impossible de déterminer le vainqueur du match.');

  const format = match.config.checkIn === 'Open'
    ? `${header.formatLabel} · Entrée libre`
    : header.formatLabel;
  const sections: X01ImageSection[] = [{
    title: 'Résultat',
    lines: [
      `X01 · ${format}`,
      `${STATS_LABELS_FR.statsView.winnerPrefix} ${sideName(match, winner.id)}`,
      ...header.sides.map((side) =>
        `${sideName(match, side.id)} : ${side.count} ${side.count === 1 ? header.unitLabel.slice(0, -1) : header.unitLabel}`),
      `${STATS_LABELS_FR.x01.overview.matchDuration} : ${match.duration ? header.durationLabel : '-'}`,
    ],
  }];
  if (header.sides.length > 2) {
    sections.push({
      title: STATS_LABELS_FR.statsView.ranking,
      lines: presentX01Ranking(match).map((entry) =>
        `${entry.rankLabel} · ${sideName(match, entry.competitorId)} · ${entry.detail}`),
    });
  }
  for (const [index, side] of header.sides.entries()) {
    const players = match.players.filter((player) => player.teamId === side.id);
    const title = match.config.isDoubles
      ? `Équipe ${index + 1} · ${sideName(match, side.id)}`
      : sideName(match, side.id);
    const stats = match.config.isDoubles
      ? calculateDetailedStatsForTeam(match, side.id)
      : calculateDetailedStats(match, players[0].id);
    sections.push(statsSection(match, title, stats, false));
    if (match.config.isDoubles) {
      for (const player of players) {
        sections.push(statsSection(match, `Statistiques individuelles · ${playerName(player)}`, calculateDetailedStats(match, player.id), true));
      }
    }
  }
  return { heading: 'BOUGNAT DARTS · MATCH TERMINÉ', sections };
};
