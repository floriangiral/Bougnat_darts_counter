// Spec 136 : façade du classement Killer pour les vues.
import { getKillerRankingOrder, type KillerPlayerState, type KillerState } from '../../domain/killer/killer';
import { rankWithPlayedPlaces, type RankedEntry } from '../rankings/finalRanking';

/** Survivant 1er, puis les éliminés du dernier au premier ; les éliminés sans ordre connu sont ex æquo. */
export const getKillerFinalRanking = (state: KillerState): RankedEntry<KillerPlayerState>[] => {
  const { ordered, unordered } = getKillerRankingOrder(state);
  return rankWithPlayedPlaces([...ordered, ...unordered], ordered.map((player) => player.id), () => 0);
};
