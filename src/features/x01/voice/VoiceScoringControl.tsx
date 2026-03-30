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
        className="row-span-2 h-full min-h-0 !border-emerald-900/40 !bg-emerald-950/25 px-1 py-1 !text-emerald-300/45 shadow-inner hover:!bg-emerald-950/25 hover:!border-emerald-900/40 disabled:cursor-not-allowed disabled:!border-emerald-900/40 disabled:!bg-emerald-950/25 disabled:!text-emerald-300/45 disabled:opacity-100"
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
      aria-label={isListening ? 'Arrêter l écoute vocale' : 'Lancer l écoute vocale'}
      title={stateLabel}
      className={`row-span-2 h-full min-h-0 px-1 py-1 shadow-inner transition-colors ${
        isListening
          ? '!border-emerald-400/70 !bg-emerald-600/55 !text-white hover:!bg-emerald-500/60'
          : error
            ? '!border-amber-500/40 !bg-amber-950/30 !text-amber-200 hover:!bg-amber-900/40'
            : '!border-emerald-500/55 !bg-emerald-900/55 !text-emerald-100 hover:!border-emerald-400/70 hover:!bg-emerald-800/65 hover:!text-white'
      }`}
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
