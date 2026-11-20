// Briques communes des commandes et claviers de jeu (voir docs/design-system.md §7).
export { GAME_ACTIONS, EXIT_DIALOG_COPY, type GameAction, type GameActionSpec } from './gameActions';
export { GameActionButton, type GameActionButtonProps } from './GameActionButton';
export { ConfirmExitDialog, type ConfirmExitDialogProps } from './ConfirmExitDialog';
export { useExitConfirmation, type ExitConfirmation } from './useExitConfirmation';
export { GameHeaderActions, type GameHeaderActionsProps } from './GameHeaderActions';
export { GameHeader, type GameHeaderProps, type GameHeaderClock } from './GameHeader';
export { GameUndoButton, type GameUndoButtonProps } from './GameUndoButton';
export { resolveUndoIntent, UNDO_INTENT_TITLES, type UndoIntent, type UndoState } from './undoIntent';
export { KeypadKey, type KeypadKeyProps, type KeypadKeySize } from './KeypadKey';
export {
  KeypadPanel,
  KeypadGrid,
  KeypadActionRow,
  type KeypadPanelProps,
  type KeypadGridProps,
  type KeypadActionRowProps,
} from './KeypadGrid';
