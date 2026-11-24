import React from 'react';
import { Button } from '../ui/Button';
import type { PlacementPrompt } from '../../src/features/x01/scoring/matchPlacement';

interface PlacementPromptDialogProps {
  prompt: PlacementPrompt;
  onPlay: () => void;
  onFinish: () => void;
}

/** Spec 132 (RM-05) : après la victoire ou une place, jouer la place suivante ou terminer le match. */
export const PlacementPromptDialog: React.FC<PlacementPromptDialogProps> = ({ prompt, onPlay, onFinish }) => (
  <dialog
    open
    aria-label={prompt.title}
    data-testid="placement-prompt"
    className="app-modal tablet-modal fixed inset-0 z-[100] m-0 flex h-full w-full max-h-none max-w-none flex-col items-center justify-center border-0 bg-overlay p-6 text-fg backdrop-blur-md"
  >
    <div className="bd-confirm-card flex w-full max-w-sm flex-col items-center text-center">
      <h2 className="bd-confirm-title mb-3 text-3xl font-black italic uppercase tracking-tighter text-brand-fg">{prompt.title}</h2>
      <p className="bd-confirm-text mb-8 text-base font-bold text-fg-soft">
        Les places suivantes peuvent se jouer dans la manche en cours. Sinon, le classement est calculé (manches, reste).
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
          Terminer le match
        </Button>
      </div>
    </div>
  </dialog>
);
