/** Ordre de passage complet : chaque joueur doit apparaître une seule fois (spec 136). */
export const orderPlayers = <T extends { id: string }>(players: readonly T[], orderedIds: readonly string[]): T[] => {
  if (orderedIds.length !== players.length || new Set(orderedIds).size !== players.length) {
    throw new Error("L'ordre de passage doit contenir chaque joueur une seule fois.");
  }
  const byId = new Map(players.map((player) => [player.id, player]));
  return orderedIds.map((id) => {
    const player = byId.get(id);
    if (!player) throw new Error("L'ordre de passage contient un joueur inconnu.");
    return player;
  });
};
