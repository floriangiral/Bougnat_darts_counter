// Spec 132 : façade X01 de l'ordre de passage (3 ou 4 camps) et des places jouées pour les vues.
import type { MatchState } from '../../../../types';
import {
  canPlayForNextPlace,
  getNextPlaceRank,
  getPlacedTeamIds,
} from '../../../application/scoring/matchLifecycle';
import { getWinnerDisplayName } from './matchPresentation';

export {
  canPlayForNextPlace,
  requiresThrowOrder,
  resolveMatchOrder,
  startPlacementRound,
} from '../../../application/scoring/matchLifecycle';

export const formatPlaceOrdinal = (rank: number): string => (rank === 1 ? '1er' : `${rank}e`);

/** Joueurs proposés dans l'écran « Ordre de passage », dans l'ordre de saisie. */
export const getThrowOrderOptions = (match: MatchState) =>
  match.players.map((player) => ({ id: player.id, label: player.name }));

export type PlacementPrompt = {
  /** « Alice gagne le match ! » ou « Bruno termine 2e ». */
  title: string;
  /** « Jouer la 2e place ». */
  playLabel: string;
  nextRank: number;
};

/** Fenêtre proposée après la victoire ou une place jouée, s'il reste au moins deux camps à départager. */
export const getPlacementPrompt = (match: MatchState): PlacementPrompt | null => {
  if (!canPlayForNextPlace(match)) return null;
  const placed = getPlacedTeamIds(match);
  const lastPlacedName = getWinnerDisplayName(match, placed.at(-1) ?? null);
  const nextRank = getNextPlaceRank(match);
  return {
    title: placed.length === 1
      ? `${lastPlacedName} gagne le match !`
      : `${lastPlacedName} termine ${formatPlaceOrdinal(placed.length)}`,
    playLabel: `Jouer la ${formatPlaceOrdinal(nextRank)} place`,
    nextRank,
  };
};
