import React from 'react';

import type { VoiceScoreProposalState } from './dartsSpeechTypes';

interface VoiceScoreProposalProps {
  isListening: boolean;
  liveTranscript: string;
  onConfirm: () => void;
  onDismiss: () => void;
  onRetry: () => void;
  proposal: VoiceScoreProposalState | null;
  voiceError: string | null;
  voiceStateLabel: string;
}

export const VoiceScoreProposal: React.FC<VoiceScoreProposalProps> = ({
  isListening,
  liveTranscript,
  onConfirm,
  onDismiss,
  onRetry,
  proposal,
  voiceError,
  voiceStateLabel,
}) => {
  const show = isListening || Boolean(proposal) || Boolean(voiceError);
  if (!show) {
    return null;
  }

  const transcript = proposal?.transcript || liveTranscript || voiceError || 'Annonce ton score ou tes fleches.';
  const badge =
    isListening
      ? 'ECOUTE'
      : proposal?.result.status === 'valid'
        ? `SCORE ${proposal.result.score ?? '-'}`
        : proposal?.result.status === 'ambiguous'
          ? 'A CONFIRMER'
          : voiceError
            ? 'ERREUR'
            : 'INVALIDE';
  const detail = proposal
    ? proposal.result.reason
      || (proposal.result.mode === 'darts'
        ? proposal.result.darts.map((dart) => dart.label).join(' · ')
        : 'Total annonce oralement')
    : voiceStateLabel;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
        {badge}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-white">{transcript}</div>
        <div className="hidden truncate text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 md:block">{detail}</div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {proposal && proposal.result.score !== null && proposal.result.status !== 'invalid' && (
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-emerald-500/35 bg-emerald-950/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-100 transition-colors hover:border-emerald-400/50 hover:text-white sm:px-3"
          >
            Charger
          </button>
        )}

        {((proposal && (proposal.result.status === 'ambiguous' || proposal.result.status === 'invalid')) || Boolean(voiceError)) && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-cyan-500/30 bg-cyan-950/25 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200 transition-colors hover:border-cyan-400/50 hover:text-white sm:px-3"
          >
            Refaire
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white sm:px-3"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
