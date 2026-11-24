import React from 'react';
import { LoaderCircle, Mic, MicOff } from 'lucide-react';

import { Button } from '../../../../components/ui/Button';
import type { VoiceRuntimeIssue } from './dartsSpeechTypes';

interface VoiceScoringControlProps {
  disabled?: boolean;
  enabled: boolean;
  error?: string | null;
  /** Cause de l'erreur : un délai d'écoute sans annonce n'est pas une panne du micro. */
  issue?: VoiceRuntimeIssue | null;
  isListening: boolean;
  onToggle: () => void;
  stateLabel: string;
}

type VoiceControlState = 'unavailable' | 'listening' | 'error' | 'ready';

/**
 * État exposé en data-state (spec 065 FR-04) : l'écoute active prime sur une erreur antérieure. Un délai
 * d'écoute écoulé sans annonce (issue « timeout ») laisse la touche prête : ce n'est pas une panne du micro,
 * le message reste affiché dans la barre de saisie.
 */
const getVoiceControlState = (
  enabled: boolean,
  isListening: boolean,
  error?: string | null,
  issue?: VoiceRuntimeIssue | null,
): VoiceControlState => {
  if (!enabled) return 'unavailable';
  if (isListening) return 'listening';
  if (error && issue !== 'timeout') return 'error';
  return 'ready';
};

const KEY_CLASS = 'x01-voice-key h-full min-h-0 px-1 py-1 shadow-inner transition-colors';

// Libellé visible sur la touche : l'écoute et l'erreur se lisent sans dépendre de la couleur (WCAG 1.4.1).
const LABELS: Record<VoiceControlState, readonly [string, string]> = {
  unavailable: ['Annonce', 'ton score'],
  ready: ['Annonce', 'ton score'],
  listening: ['À l’écoute', 'touche pour arrêter'],
  error: ['Micro en erreur', 'touche pour réessayer'],
};

const Label = ({ state }: { state: VoiceControlState }) => (
  <>
    {LABELS[state].map((line, index) => (
      <span
        key={line}
        // Consigne d'usage (« touche pour… ») : seulement sur les grandes touches tablette (x01.css).
        className={`x01-voice-label font-black tracking-[0.01em] ${index === 1 && (state === 'listening' || state === 'error') ? 'x01-voice-hint' : ''}`}
      >
        {line}
      </span>
    ))}
  </>
);

export const VoiceScoringControl: React.FC<VoiceScoringControlProps> = ({
  disabled = false,
  enabled,
  error,
  issue,
  isListening,
  onToggle,
  stateLabel,
}) => {
  const state = getVoiceControlState(enabled, isListening, error, issue);

  if (state === 'unavailable') {
    return (
      <Button
        variant="success"
        disabled
        data-state={state}
        aria-label="Scoring vocal désactivé"
        title="Scoring vocal désactivé"
        className={KEY_CLASS}
      >
        <div className="flex min-w-0 items-center justify-center text-center">
          <MicOff aria-hidden="true" className="x01-voice-icon" />
          <div className="flex min-w-0 flex-col items-center">
            <Label state={state} />
          </div>
        </div>
      </Button>
    );
  }

  const listeningProps = state === 'listening'
    ? { variant: 'keypad' as const, tone: 'success' as const }
    : { variant: state === 'error' ? 'danger' as const : 'success' as const };

  return (
    <Button
      {...listeningProps}
      disabled={disabled}
      onClick={onToggle}
      data-state={state}
      aria-pressed={isListening}
      aria-label={isListening ? 'Arrêter l’écoute vocale' : 'Lancer l’écoute vocale'}
      title={error && !isListening ? `${stateLabel} : ${error}` : stateLabel}
      className={KEY_CLASS}
    >
      <div className="flex min-w-0 items-center justify-center text-center">
        {disabled ? (
          <LoaderCircle aria-hidden="true" className="x01-voice-icon animate-spin" />
        ) : (
          <Mic aria-hidden="true" className={`x01-voice-icon ${isListening ? 'animate-pulse' : ''}`} />
        )}
        <div className="flex min-w-0 flex-col items-center">
          <Label state={state} />
        </div>
      </div>
    </Button>
  );
};
