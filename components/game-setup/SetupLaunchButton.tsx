import React from 'react';

import { Button } from '../ui/Button';

interface SetupLaunchButtonProps {
  onStart: () => void;
  disabled?: boolean;
}

// Bouton unique des modes rapide et personnalisé : même gabarit partout, poussé en bas de colonne.
export const SetupLaunchButton: React.FC<SetupLaunchButtonProps> = ({ onStart, disabled = false }) => (
  <Button
    data-testid="setup-launch"
    onClick={onStart}
    disabled={disabled}
    className="setup-launch h-14 w-full shrink-0 rounded-2xl text-xl disabled:shadow-none sm:h-16"
  >
    Lancer La Partie
  </Button>
);
