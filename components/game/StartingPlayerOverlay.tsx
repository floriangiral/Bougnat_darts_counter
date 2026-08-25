import React from 'react';
import { Button } from '../ui/Button';

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
    <div
      className="app-modal tablet-modal fixed inset-0 z-[120] flex items-center justify-center bg-[#030508] px-4"
      role="dialog"
      aria-modal="true"
      data-testid="starting-player-overlay"
    >
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b1119] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
        <div className="text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Debut De Partie</div>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">{title}</h3>
        </div>

        <div className="mt-6 grid gap-3">
          {options.map((option) => (
            <Button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              data-testid={`starter-option-${option.id}`}
              className="h-14 w-full rounded-2xl text-sm font-black uppercase tracking-[0.16em]"
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          data-testid="starter-cancel"
          className="mt-4 h-12 w-full rounded-2xl border-red-900/30 text-red-400 hover:bg-red-950/30 hover:text-red-300"
        >
          Quitter
        </Button>
      </div>
    </div>
  );
};
