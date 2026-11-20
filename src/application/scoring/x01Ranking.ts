// Spec 052 (RM-03, Q3) : classement de fin d'un match X01 à N camps (joueurs ou équipes).
import type { MatchState } from '../../../types';

export interface X01RankingEntry {
  /** Camp classé (`teamId` : le joueur en simple, l'équipe en doublettes). */
  competitorId: string;
  /** Rang à partir de 1 ; des camps à égalité sur tous les critères partagent le même rang (1, 2, 2, 4). */
  rank: number;
  isTied: boolean;
  isMatchWinner: boolean;
  setsWon: number;
  /** Manches gagnées sur tout le match (tous sets confondus). */
  legsWon: number;
  /** Reste du camp dans la dernière manche jouée (0 pour celui qui l'a gagnée). */
  lastLegRemaining: number;
}

type RankingKey = Omit<X01RankingEntry, 'rank' | 'isTied'>;

const getCompetitorIds = (match: MatchState): string[] =>
  Array.from(new Set(match.players.map((player) => player.teamId)));

const countLegsWon = (match: MatchState, competitorId: string): number =>
  [...match.completedLegs, match.currentLeg].filter((leg) => leg.winnerId === competitorId).length;

const compareCompetitors = (a: RankingKey, b: RankingKey): number =>
  Number(b.isMatchWinner) - Number(a.isMatchWinner)
  || b.setsWon - a.setsWon
  || b.legsWon - a.legsWon
  || a.lastLegRemaining - b.lastLegRemaining;

/**
 * Vainqueur du match d'abord, puis sets gagnés (mode sets), puis manches gagnées, puis reste de la
 * dernière manche, le plus bas d'abord. Fonction pure : à égalité, l'ordre de jeu est conservé.
 */
export const rankX01Competitors = (match: MatchState): X01RankingEntry[] => {
  const keys: RankingKey[] = getCompetitorIds(match).map((competitorId) => ({
    competitorId,
    isMatchWinner: match.matchWinnerId === competitorId,
    setsWon: match.config.matchMode === 'SETS' ? match.setsWon[competitorId] ?? 0 : 0,
    legsWon: countLegsWon(match, competitorId),
    lastLegRemaining: match.currentLeg.scores[competitorId] ?? match.config.startingScore,
  }));
  const sorted = [...keys].sort(compareCompetitors);

  return sorted.map((entry) => {
    const equals = sorted.filter((other) => compareCompetitors(other, entry) === 0);
    return { ...entry, rank: sorted.indexOf(equals[0]) + 1, isTied: equals.length > 1 };
  });
};
