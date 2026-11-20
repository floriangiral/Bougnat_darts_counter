import React from 'react';
import { LoaderCircle, Mic, MicOff } from 'lucide-react';

import { Button } from '../../../../components/ui/Button';

interface VoiceScoringControlProps {
  disabled?: boolean;
  enabled: boolean;
  error?: string | null;
  isListening: boolean;
  onToggle: () => void;
  stateLabel: string;
}

const getListeningButtonClass = (isListening: boolean, error?: string | null): string => {
  if (isListening) return '!border-success-border !bg-success-subtle !text-fg hover:!bg-success-subtle';
  if (error) return '!border-warning-border !bg-warning-subtle !text-warning-fg hover:!bg-warning-subtle';
  return '!border-success-border !bg-success-subtle !text-success-fg hover:!border-success-border hover:!bg-success-subtle hover:!text-fg';
};

export const VoiceScoringControl: React.FC<VoiceScoringControlProps> = ({
  disabled = false,
  enabled,
  error,
  isListening,
  onToggle,
  stateLabel,
}) => {
  if (!enabled) {
    return (
      <Button
        variant="secondary"
        disabled
        aria-label="Scoring vocal désactivé"
        title="Scoring vocal désactivé"
        className="row-span-2 h-full min-h-0 !border-success-border !bg-success-subtle px-1 py-1 !text-success-fg/45 shadow-inner hover:!bg-success-subtle hover:!border-success-border disabled:cursor-not-allowed disabled:!border-success-border disabled:!bg-success-subtle disabled:!text-success-fg/45 disabled:opacity-100"
      >
        <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
          <MicOff className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          <span className="text-[7px] font-black leading-none tracking-[0.01em] sm:text-[9px]">Annonce</span>
          <span className="text-[7px] font-black leading-none tracking-[0.01em] sm:text-[9px]">ton score</span>
        </div>
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={isListening}
      aria-label={isListening ? 'Arrêter l’écoute vocale' : 'Lancer l’écoute vocale'}
      title={stateLabel}
      className={`row-span-2 h-full min-h-0 px-1 py-1 shadow-inner transition-colors ${getListeningButtonClass(isListening, error)}`}
    >
      <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
        {disabled ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin sm:h-5 sm:w-5" />
        ) : (
          <Mic className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${isListening ? 'animate-pulse' : ''}`} />
        )}
        <span className="text-[7px] font-black leading-none tracking-[0.01em] sm:text-[9px]">Annonce</span>
        <span className="text-[7px] font-black leading-none tracking-[0.01em] sm:text-[9px]">ton score</span>
      </div>
    </Button>
  );
};
