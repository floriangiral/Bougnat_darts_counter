import type { InOutRule, MatchState } from '../../../types';
import { isCheckoutPossible } from './x01CheckoutRules';

/**
 * Ouverture X01 (spec 046, option B « attestation ») : en Double-In, les points ne comptent
 * qu'à partir de la première fléchette dans un double (double bull compris), fléchette incluse ;
 * en Master-In, un double ou un triple. Le joueur saisit les points comptés à partir de cette
 * fléchette et atteste l'ouverture.
 */

/**
 * Les fléchettes d'une visite s'additionnent dans n'importe quel ordre : un total qui commence
 * par un double (ou un triple en Master) est donc possible exactement quand le même total peut
 * se terminer par cette fléchette. Le calcul de sortie sert de référence unique.
 */
export const isOpeningTotalPossible = (total: number, rule: InOutRule): boolean =>
  rule === 'Open' ? total >= 0 : isCheckoutPossible(total, rule);

/**
 * État dérivé de l'historique de la manche (aucun champ persisté) : une équipe est ouverte dès
 * qu'elle a une visite non « trop » de score positif. En doublettes, l'ouverture vaut pour l'équipe.
 */
export const isX01TeamOpened = (
  match: Pick<MatchState, 'config' | 'players' | 'currentLeg'>,
  teamId: string,
): boolean => {
  if (match.config.checkIn === 'Open') return true;
  const teamPlayerIds = new Set(match.players.filter((player) => player.teamId === teamId).map((player) => player.id));
  return match.currentLeg.history.some((turn) => teamPlayerIds.has(turn.playerId) && !turn.isBust && turn.score > 0);
};
