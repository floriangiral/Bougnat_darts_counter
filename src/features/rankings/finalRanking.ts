// Spec 136 : classement complet de fin de partie, commun aux jeux hors X01 et Triathlon.

export type RankedEntry<T> = {
  item: T;
  rank: number;
  /** Place obtenue en jouant (vainqueur compris), par opposition à une place calculée. */
  played: boolean;
};

/**
 * Places jouées d'abord, dans l'ordre où elles ont été obtenues, puis les autres selon `compare`
 * (négatif = `a` devant `b`, zéro = ex æquo, rangs partagés : 1, 2, 2, 4).
 */
export const rankWithPlayedPlaces = <T extends { id: string }>(
  items: readonly T[],
  playedIds: readonly string[],
  compare: (a: T, b: T) => number,
): RankedEntry<T>[] => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const played = playedIds
    .map((id) => byId.get(id))
    .filter((item): item is T => item !== undefined);
  const playedSet = new Set(played.map((item) => item.id));
  const others = items.filter((item) => !playedSet.has(item.id)).sort(compare);

  const ranked: RankedEntry<T>[] = played.map((item, index) => ({ item, rank: index + 1, played: true }));
  others.forEach((item, index) => {
    const previous = ranked.at(-1);
    const tied = index > 0 && previous !== undefined && compare(others[index - 1], item) === 0;
    ranked.push({ item, rank: tied ? previous.rank : ranked.length + 1, played: false });
  });
  return ranked;
};

/** Le classement complet n'est affiché qu'au-delà de deux joueurs. */
export const shouldShowFullRanking = (playerCount: number): boolean => playerCount > 2;

export const formatRankOrdinal = (rank: number): string => (rank === 1 ? '1er' : `${rank}e`);
