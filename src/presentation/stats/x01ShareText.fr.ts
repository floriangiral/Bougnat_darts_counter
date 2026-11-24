import { calculateDetailedStats, calculateDetailedStatsForTeam } from '../../application/scoring/matchStats';
import { formatDuration } from '../../application/scoring/matchLifecycle';
import type { MatchState, Player } from '../../../types';
import { presentX01Ranking } from './x01RankingPresenter.fr';

export interface X01ShareContent {
  title: string;
  text: string;
}

const formatRule: Record<MatchState['config']['checkIn'], string> = {
  Open: 'libre',
  Double: 'double',
  Master: 'master',
};

const formatAverage = (value: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);

const teamName = (players: Player[]) => players.map((player) => player.name).join(' / ');

export const buildX01ShareContent = (match: MatchState, winnerId: string): X01ShareContent => {
  const teams = Array.from(new Set(match.players.map((player) => player.teamId))).map((teamId) => {
    const players = match.players.filter((player) => player.teamId === teamId);
    const stats = match.config.isDoubles
      ? calculateDetailedStatsForTeam(match, teamId)
      : calculateDetailedStats(match, players[0].id);

    return {
      id: teamId,
      name: teamName(players),
      stats,
      matchCount: match.config.matchMode === 'SETS' ? match.setsWon[teamId] : match.legsWon[teamId],
    };
  });
  const winner = teams.find((team) => team.id === winnerId);
  const winnerName = winner?.name ?? 'Vainqueur inconnu';
  const countUnit = match.config.matchMode === 'SETS' ? 'set(s)' : 'manche(s)';
  const score = teams.map((team) => `${team.name} ${team.matchCount ?? 0}`).join(' — ');
  const statistics = teams.map(({ name, stats }) =>
    `${name} : moyenne 3 fléchettes ${formatAverage(stats.threeDartAverage)} ; meilleur score ${stats.highestScore} ; meilleur checkout ${stats.highestCheckout || '—'}`,
  );
  // Spec 132 (RM-08) : au-delà de deux camps, le classement (places jouées ou calculées) est partagé.
  const ranking = teams.length > 2
    ? [`Classement : ${presentX01Ranking(match).map((entry) => `${entry.rankLabel} ${entry.name}`).join(', ')}`]
    : [];
  const text = [
    'Bougnat Darts — résultat X01',
    `${match.config.startingScore} — entrée ${formatRule[match.config.checkIn]} — sortie ${formatRule[match.config.checkOut]}`,
    `${winnerName} remporte le match (${score} ${countUnit})`,
    ...ranking,
    `Durée : ${formatDuration(match.duration)}`,
    'Statistiques :',
    ...statistics,
  ].join('\n');

  return {
    title: `Résultat X01 — ${winnerName}`,
    text,
  };
};
