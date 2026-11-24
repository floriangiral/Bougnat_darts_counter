// Spec 052 (RM-03, Q3) : classement de fin d'un match X01 à N camps (joueurs ou équipes).
// Spec 132 (RM-08) : les places jouées après la victoire passent avant le classement calculé.
import type { MatchState } from '../../../types';
import { getPlacedTeamIds } from './matchLifecycle';

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
  /** Rang obtenu en jouant (vainqueur du match, places jouées) plutôt que calculé. */
  isPlayedPlace: boolean;
}

type RankingKey = Omit<X01RankingEntry, 'rank' | 'isTied' | 'isPlayedPlace'>;

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
 * Places jouées d'abord, dans l'ordre obtenu (vainqueur du match en premier), puis les autres camps :
 * vainqueur du match, sets gagnés (mode sets), manches gagnées, reste de la dernière manche, le plus
 * bas d'abord. Fonction pure : à égalité, l'ordre de jeu est conservé.
 */
export const rankX01Competitors = (match: MatchState): X01RankingEntry[] => {
  const keys: RankingKey[] = getCompetitorIds(match).map((competitorId) => ({
    competitorId,
    isMatchWinner: match.matchWinnerId === competitorId,
    setsWon: match.config.matchMode === 'SETS' ? match.setsWon[competitorId] ?? 0 : 0,
    legsWon: countLegsWon(match, competitorId),
    lastLegRemaining: match.currentLeg.scores[competitorId] ?? match.config.startingScore,
  }));
  const placed = getPlacedTeamIds(match).filter((id) => keys.some((key) => key.competitorId === id));
  const played: X01RankingEntry[] = placed.map((competitorId, index) => ({
    ...(keys.find((key) => key.competitorId === competitorId) as RankingKey),
    rank: index + 1,
    isTied: false,
    isPlayedPlace: true,
  }));
  const sorted = keys.filter((key) => !placed.includes(key.competitorId)).sort(compareCompetitors);

  return [
    ...played,
    ...sorted.map((entry) => {
      const equals = sorted.filter((other) => compareCompetitors(other, entry) === 0);
      return {
        ...entry,
        rank: placed.length + sorted.indexOf(equals[0]) + 1,
        isTied: equals.length > 1,
        isPlayedPlace: false,
      };
    }),
  ];
};
