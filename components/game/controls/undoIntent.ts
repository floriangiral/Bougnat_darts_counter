// Décision PO du 2026-11-20 : sur les pavés numériques, « C » et « Retour » fusionnent en une seule
// touche « Annuler » : elle efface d'abord la saisie en cours, sinon elle annule la dernière volée validée.

export type UndoIntent = 'clear-input' | 'undo-last' | 'none';

export interface UndoState {
  /** Une saisie est en cours (chiffres tapés, total vocal proposé…). */
  hasPendingInput: boolean;
  /** Une volée / fléchette validée peut être annulée (même garde qu'avant la fusion). */
  canUndoLast: boolean;
}

export const resolveUndoIntent = ({ hasPendingInput, canUndoLast }: UndoState): UndoIntent => {
  if (hasPendingInput) return 'clear-input';
  return canUndoLast ? 'undo-last' : 'none';
};

export const UNDO_INTENT_TITLES: Record<UndoIntent, string> = {
  'clear-input': 'Effacer la saisie en cours',
  'undo-last': 'Annuler la dernière volée',
  none: 'Rien à annuler',
};
