import React, { useEffect, useId, useRef } from 'react';
import { Button } from '../../ui/Button';
import { EXIT_DIALOG_COPY } from './gameActions';

export interface ConfirmExitDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Titre propre à un contexte (à éviter : le titre commun est « Quitter la partie ? »). */
  title?: string;
  description?: string;
  'data-testid'?: string;
}

type ExitChoice = 'cancel' | 'confirm';

// Button (components/ui) ne transmet pas de ref : les deux choix sont retrouvés par attribut.
const findChoice = (dialog: HTMLDialogElement | null, name: ExitChoice) =>
  dialog?.querySelector<HTMLButtonElement>(`[data-exit-choice='${name}']`) ?? null;

/**
 * Dialogue unique de sortie de partie : « Non » (secondaire, à gauche, focus initial) et « Oui »
 * (danger, à droite). Échap équivaut à « Non » ; le focus reste dans le dialogue et revient au
 * déclencheur à la fermeture. Surface app-modal / tablet-modal existante, au-dessus des panneaux de jeu.
 */
export const ConfirmExitDialog: React.FC<ConfirmExitDialogProps> = ({
  open,
  onCancel,
  onConfirm,
  title = EXIT_DIALOG_COPY.title,
  description = EXIT_DIALOG_COPY.description,
  'data-testid': testId = 'confirm-exit-dialog',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const choice = (name: ExitChoice) => findChoice(dialogRef.current, name);

  useEffect(() => {
    if (!open) return undefined;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    findChoice(dialogRef.current, 'cancel')?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const leavingLast = !event.shiftKey && document.activeElement === choice('confirm');
    const leavingFirst = event.shiftKey && document.activeElement === choice('cancel');
    if (leavingLast || leavingFirst) {
      event.preventDefault();
      choice(leavingLast ? 'cancel' : 'confirm')?.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      open
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-testid={testId}
      onKeyDown={handleKeyDown}
      className="bd-exit-dialog app-modal tablet-modal fixed inset-0 z-[90] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-scrim p-4 text-fg backdrop-blur-sm"
    >
      <div className="bd-exit-dialog-card bd-confirm-card w-full max-w-sm rounded-xl border border-border-strong bg-surface p-6 text-center shadow-elevated">
        <h2 id={titleId} className="bd-confirm-title mb-2 text-2xl font-black uppercase italic text-fg">{title}</h2>
        {description && <p id={descriptionId} className="bd-confirm-text text-sm text-fg-muted">{description}</p>}
        <div className="bd-confirm-actions mt-8 grid grid-cols-2 gap-3">
          <Button variant="secondary" data-exit-choice="cancel" onClick={onCancel} data-testid="confirm-exit-cancel" className="bd-confirm-button">
            {EXIT_DIALOG_COPY.cancel}
          </Button>
          <Button variant="danger" data-exit-choice="confirm" onClick={onConfirm} data-testid="confirm-exit-confirm" className="bd-confirm-button">
            {EXIT_DIALOG_COPY.confirm}
          </Button>
        </div>
      </div>
    </dialog>
  );
};
