// Spec: spec:counter/offline-scoring-terminal-foundation
// Rotation des lanceurs X01 : règles documentées dans docs/specifications.md,
// section « Rotation des joueurs X01 (simple et doubles) ».
import type { GameConfig, Player, Turn } from '../../../types';

type RotationConfig = Pick<GameConfig, 'isDoubles' | 'teamStarterIds' | 'initialStartingTeamId'>;

const getTeamIds = (players: Player[]) => Array.from(new Set(players.map((player) => player.teamId)));

/** Doublettes exploitables : exactement deux équipes, chacune avec au moins un joueur. */
const getDoublesTeamIds = (players: Player[], config: RotationConfig): [string, string] | null => {
  if (!config.isDoubles) return null;
  const teamIds = getTeamIds(players);
  return teamIds.length === 2 ? [teamIds[0], teamIds[1]] : null;
};

const getOpposingTeamId = (teamIds: [string, string], teamId: string | undefined) =>
  teamIds[0] === teamId ? teamIds[1] : teamIds[0];

/**
 * Ordre de passage interne d'une équipe, figé pour tout le match : le premier lanceur désigné
 * (`teamStarterIds`, s'il appartient bien à l'équipe), puis ses partenaires dans l'ordre de `players`.
 */
export const getTeamThrowOrder = (
  players: Player[],
  teamStarterIds: GameConfig['teamStarterIds'],
  teamId: string,
): Player[] => {
  const members = players.filter((player) => player.teamId === teamId);
  const designated = members.find((player) => player.id === teamStarterIds?.[teamId]);
  return designated ? [designated, ...members.filter((player) => player !== designated)] : members;
};

/**
 * Prochain lanceur d'une équipe dans la manche en cours : le successeur, dans l'ordre interne,
 * du dernier joueur de l'équipe ayant lancé dans cette manche ; à défaut, son premier lanceur désigné.
 * Ne dépend que de l'historique de la manche : une partie restaurée reprend exactement là où elle était.
 */
export const resolveUpcomingTeamThrower = (
  players: Player[],
  teamStarterIds: GameConfig['teamStarterIds'],
  legHistory: Turn[],
  teamId: string,
): Player | undefined => {
  const order = getTeamThrowOrder(players, teamStarterIds, teamId);
  for (let index = legHistory.length - 1; index >= 0; index -= 1) {
    const position = order.findIndex((player) => player.id === legHistory[index].playerId);
    if (position >= 0) return order[(position + 1) % order.length];
  }
  return order[0];
};

/**
 * Spec 132 : à 3 ou 4 camps en simple, l'ordre de passage choisi est obligatoire et les manches
 * s'ouvrent dans cet ordre (n° 1, n° 2…), y compris aux changements de set.
 */
export const isMultiSideSingles = (players: Player[], config: Pick<GameConfig, 'isDoubles'>): boolean =>
  !config.isDoubles && getTeamIds(players).length > 2;

/** Spec 132 : prochain lanceur (simple) en sautant les camps déjà classés pendant une place jouée. */
export const resolveNextUnplacedThrowerIndex = (
  players: Player[],
  currentPlayerIndex: number,
  placedTeamIds: readonly string[],
): number => {
  for (let step = 1; step <= players.length; step += 1) {
    const index = (currentPlayerIndex + step) % players.length;
    if (!placedTeamIds.includes(players[index].teamId)) return index;
  }
  return currentPlayerIndex;
};

/**
 * Index (dans `players`) du lanceur suivant, une fois la volée `legHistory.at(-1)` enregistrée.
 * Simple : joueur suivant dans `players`. Doublettes : l'autre équipe, avec son prochain lanceur.
 */
export const resolveNextThrowerIndex = (
  players: Player[],
  config: RotationConfig,
  legHistory: Turn[],
  currentPlayerIndex: number,
): number => {
  const cyclicNextIndex = (currentPlayerIndex + 1) % players.length;
  const teamIds = getDoublesTeamIds(players, config);
  if (!teamIds) return cyclicNextIndex;

  const opposingTeamId = getOpposingTeamId(teamIds, players[currentPlayerIndex]?.teamId);
  const nextThrower = resolveUpcomingTeamThrower(players, config.teamStarterIds, legHistory, opposingTeamId);
  const nextIndex = players.findIndex((player) => player.id === nextThrower?.id);
  return nextIndex >= 0 ? nextIndex : cyclicNextIndex;
};

/**
 * Index (dans `players`) du lanceur qui ouvre la manche suivante **dans le même set** (WDF § 9.03).
 * Ne dépend ni du finisseur ni du vainqueur : simple → joueur suivant celui qui a ouvert la manche
 * terminée ; doublettes → l'autre équipe que celle qui a ouvert la manche terminée, avec son premier
 * lanceur désigné. Au changement de set, utiliser `resolveSetOpeningStarterIndex`.
 */
export const resolveNextLegStarterIndex = (
  players: Player[],
  config: RotationConfig,
  finishedLegStartingPlayerIndex: number,
): number => {
  const cyclicNextIndex = (finishedLegStartingPlayerIndex + 1) % players.length;
  const teamIds = getDoublesTeamIds(players, config);
  if (!teamIds) return cyclicNextIndex;

  const finishedLegStartingTeamId =
    players[finishedLegStartingPlayerIndex]?.teamId ?? config.initialStartingTeamId ?? teamIds[0];
  const nextStartingTeamId = getOpposingTeamId(teamIds, finishedLegStartingTeamId);
  const nextStarter = getTeamThrowOrder(players, config.teamStarterIds, nextStartingTeamId)[0];
  const nextIndex = players.findIndex((player) => player.id === nextStarter?.id);
  return nextIndex >= 0 ? nextIndex : cyclicNextIndex;
};

/**
 * Index (dans `players`) du lanceur qui ouvre le set `setIndex` (0 = premier set), WDF § 12.02 :
 * le camp qui a ouvert le match ouvre les sets impairs (1er, 3e…), l'autre camp les sets pairs ; à
 * l'intérieur d'un set, les manches alternent ensuite à partir de ce départ (`resolveNextLegStarterIndex`).
 * Simple : rotation à partir du joueur qui a ouvert le match. Doublettes : équipe du lanceur qui a
 * ouvert le match ou l'autre équipe, toujours avec son premier lanceur désigné.
 */
export const resolveSetOpeningStarterIndex = (
  players: Player[],
  config: RotationConfig,
  matchStartingPlayerIndex: number,
  setIndex: number,
): number => {
  const sideOffset = Math.max(0, setIndex);
  const teamIds = getDoublesTeamIds(players, config);
  if (!teamIds) {
    const count = Math.max(1, players.length);
    return (((matchStartingPlayerIndex + sideOffset) % count) + count) % count;
  }

  const matchStartingTeamId =
    players[matchStartingPlayerIndex]?.teamId ?? config.initialStartingTeamId ?? teamIds[0];
  const openingTeamId = sideOffset % 2 === 0 ? matchStartingTeamId : getOpposingTeamId(teamIds, matchStartingTeamId);
  const opener = getTeamThrowOrder(players, config.teamStarterIds, openingTeamId)[0];
  const openerIndex = players.findIndex((player) => player.id === opener?.id);
  return openerIndex >= 0 ? openerIndex : Math.max(0, Math.min(players.length - 1, matchStartingPlayerIndex));
};
