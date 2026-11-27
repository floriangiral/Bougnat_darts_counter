// Spec 136 : façade des places jouées en Gotcha pour la vue (les vues n'importent pas src/domain).
import {
  applyGotchaThrowOrder,
  getGotchaPlacedIds,
  type GotchaPlayerState,
  type GotchaState,
} from '../../domain/gotcha/gotcha';
import { orderPlayers } from '../game-setup/throwOrder';
import { rankWithPlayedPlaces, type RankedEntry } from '../rankings/finalRanking';

export {
  continueGotchaForNextPlace,
  finishGotchaPlacements,
  getGotchaPlacedIds,
  isGotchaAwaitingPlacementChoice,
  isGotchaFinished,
  isGotchaOrderPending,
} from '../../domain/gotcha/gotcha';

/** Spec 136 : ordre de passage complet et obligatoire au-delà de 2 joueurs ; lève une erreur si incomplet. */
export const confirmGotchaThrowOrder = (state: GotchaState, orderedIds: readonly string[]): GotchaState =>
  applyGotchaThrowOrder(state, orderPlayers(state.players, orderedIds));

/** Places jouées d'abord, puis les non classés par score décroissant, ex æquo à score égal (RM-G4). */
export const getGotchaFinalRanking = (state: GotchaState): RankedEntry<GotchaPlayerState>[] =>
  rankWithPlayedPlaces(state.players, getGotchaPlacedIds(state), (a, b) => b.score - a.score);
