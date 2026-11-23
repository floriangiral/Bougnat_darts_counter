// Façade feature des règles X01 du domaine, pour les vues et composants (règle de dépendance, docs/architecture.md).
export { getCheckoutRoute, isCheckoutPossible, isDeadRemainingScore } from '../../../domain/scoring/x01CheckoutRules';
export { isX01TeamOpened } from '../../../domain/scoring/x01OpeningRules';
export { canSubmitBustTurn } from '../../../application/scoring/matchLifecycle';
