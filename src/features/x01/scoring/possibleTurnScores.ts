import { getReachableTotals } from '../../../domain/scoring/reachableTotals';

// Totaux réalisables en une volée de 3 fléchettes : source unique dans le domaine.
export const POSSIBLE_TURN_SCORES = getReachableTotals(3);
