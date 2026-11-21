import React from 'react';
import { GameActionButton, type GameActionButtonProps } from './GameActionButton';
import { resolveUndoIntent, UNDO_INTENT_TITLES } from './undoIntent';

export interface GameUndoButtonProps extends Omit<GameActionButtonProps, 'action' | 'onClick' | 'label' | 'title'> {
  /** Une saisie est en cours : « Annuler » l'efface (comportement de l'ancienne touche C). */
  hasPendingInput: boolean;
  /** Une volée / fléchette validée peut être annulée (ancienne touche Retour). */
  canUndoLast: boolean;
  onClearInput: () => void;
  onUndoLast: () => void;
}

/**
 * Touche « Annuler » fusionnée des pavés numériques (X01, Gotcha, Capital en mode chiffré) :
 * saisie en cours → effacée ; sinon dernière volée annulée ; rien à annuler → désactivée.
 * Le nom accessible reste « Annuler » ; l'effet courant est exposé par data-undo-intent et l'infobulle.
 */
export const GameUndoButton: React.FC<GameUndoButtonProps> = ({
  hasPendingInput,
  canUndoLast,
  onClearInput,
  onUndoLast,
  disabled = false,
  ...props
}) => {
  const intent = resolveUndoIntent({ hasPendingInput, canUndoLast });
  const handleClick = () => {
    if (intent === 'clear-input') onClearInput();
    else if (intent === 'undo-last') onUndoLast();
  };
  return (
    <GameActionButton
      action="undo"
      title={UNDO_INTENT_TITLES[intent]}
      data-undo-intent={intent}
      disabled={disabled || intent === 'none'}
      onClick={handleClick}
      {...props}
    />
  );
};
