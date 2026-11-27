import React from 'react';
import { Button } from '../ui/Button';

interface PlacementPromptDialogProps {
  prompt: { title: string; playLabel: string };
  onPlay: () => void;
  onFinish: () => void;
  /** Explication propre au jeu (spec 136) ; par défaut, celle du X01. */
  description?: string;
  finishLabel?: string;
  /** Spec 136 (RM-09) : la fenêtre masque le plateau, l'annulation de la volée doit y rester accessible. */
  onUndo?: () => void;
}

const X01_DESCRIPTION = 'Les places suivantes peuvent se jouer dans la manche en cours. Sinon, le classement est calculé (manches, reste).';

/** Spec 132 (RM-05) et spec 136 : après la victoire ou une place, jouer la place suivante ou terminer. */
export const PlacementPromptDialog: React.FC<PlacementPromptDialogProps> = ({
  prompt,
  onPlay,
  onFinish,
  description = X01_DESCRIPTION,
  finishLabel = 'Terminer le match',
  onUndo,
}) => (
  <dialog
    open
    aria-label={prompt.title}
    data-testid="placement-prompt"
    className="app-modal tablet-modal fixed inset-0 z-[100] m-0 flex h-full w-full max-h-none max-w-none flex-col items-center justify-center border-0 bg-overlay p-6 text-fg backdrop-blur-md"
  >
    <div className="bd-confirm-card flex w-full max-w-sm flex-col items-center text-center">
      <h2 className="bd-confirm-title mb-3 text-3xl font-black italic uppercase tracking-tighter text-brand-fg">{prompt.title}</h2>
      <p className="bd-confirm-text mb-8 text-base font-bold text-fg-soft">
        {description}
      </p>
      <div className="bd-confirm-actions flex w-full flex-col gap-3">
        <Button
          data-testid="placement-play"
          onClick={onPlay}
          className="bd-confirm-button h-16 w-full text-xl uppercase sm:h-20"
        >
          {prompt.playLabel}
        </Button>
        <Button
          variant="secondary"
          data-testid="placement-finish"
          onClick={onFinish}
          className="bd-confirm-button h-16 w-full text-xl uppercase sm:h-20"
        >
          {finishLabel}
        </Button>
        {onUndo && (
          <Button
            variant="ghost"
            data-testid="placement-undo"
            onClick={onUndo}
            className="bd-confirm-button h-12 w-full text-base uppercase"
          >
            Annuler le dernier coup
          </Button>
        )}
      </div>
    </div>
  </dialog>
);
