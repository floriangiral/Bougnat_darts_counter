import { useCallback, useState } from 'react';

export interface ExitConfirmation {
  /** Ouvre le dialogue « Quitter la partie ? » (à brancher sur le bouton Quitter). */
  requestExit: () => void;
  /** Props à passer telles quelles à ConfirmExitDialog. */
  dialogProps: { open: boolean; onCancel: () => void; onConfirm: () => void };
}

/**
 * Sortie toujours confirmée : le dialogue se ferme AVANT d'appeler onExit, pour qu'un dialogue
 * suivant (match lié, spec 030) ne reste pas masqué et qu'une annulation ramène à la partie.
 */
export const useExitConfirmation = (onExit: () => void): ExitConfirmation => {
  const [open, setOpen] = useState(false);
  const requestExit = useCallback(() => setOpen(true), []);
  const onCancel = useCallback(() => setOpen(false), []);
  const onConfirm = useCallback(() => {
    setOpen(false);
    onExit();
  }, [onExit]);
  return { requestExit, dialogProps: { open, onCancel, onConfirm } };
};
