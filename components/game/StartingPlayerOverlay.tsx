import React from 'react';
import { Button } from '../ui/Button';
import { FitText } from '../ui/FitText';

interface StartingOption {
  id: string;
  label: string;
}

interface StartingPlayerOverlayProps {
  title?: string;
  options: StartingOption[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}

export const StartingPlayerOverlay: React.FC<StartingPlayerOverlayProps> = ({
  title = 'Qui commence ?',
  options,
  onSelect,
  onCancel,
}) => {
  return (
    <dialog
      open
      className="app-modal tablet-modal fixed inset-0 z-[120] m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-canvas px-4 text-fg"
      aria-label={title}
      data-testid="starting-player-overlay"
    >
      <div className="starter-panel w-full max-w-md rounded-[2rem] border border-border-subtle bg-surface p-6 shadow-elevated">
        <div className="text-center">
          <div className="starter-kicker text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Début De Partie</div>
          <h3 className="starter-title mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-fg">{title}</h3>
        </div>

        <div className="starter-options mt-6 grid gap-3">
          {options.map((option) => (
            <Button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              data-testid={`starter-option-${option.id}`}
              className="starter-option min-h-14 w-full rounded-2xl text-sm font-black uppercase tracking-[0.16em]"
            >
              <FitText className="flex-1">{option.label}</FitText>
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="danger"
          onClick={onCancel}
          data-testid="starter-cancel"
          className="starter-cancel mt-4 h-12 w-full rounded-2xl"
        >
          Quitter
        </Button>
      </div>
    </dialog>
  );
};
