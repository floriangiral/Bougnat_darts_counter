type MatchInputBarProps = {
  canUndo: boolean;
  inputBuffer: string;
  proposedVoiceScoreValue: number | null;
  showVoicePanel: boolean;
  voiceDisplayText: string;
  onUndo: () => void;
};

export function MatchInputBar({
  canUndo,
  inputBuffer,
  proposedVoiceScoreValue,
  showVoicePanel,
  voiceDisplayText,
  onUndo,
}: MatchInputBarProps) {
  const displayedScore = inputBuffer || (proposedVoiceScoreValue !== null ? String(proposedVoiceScoreValue) : '---');
  const hasDisplayedScore = inputBuffer || proposedVoiceScoreValue !== null;

  return (
    <div className="laptop-compact-inputbar border-b border-gray-800 bg-[linear-gradient(180deg,rgba(4,8,16,0.95),rgba(2,6,12,0.92))] px-2 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2.5">
      <div className="relative flex min-h-[2.75rem] items-center justify-between gap-2 sm:min-h-[3.5rem] sm:gap-3 md:min-h-[4rem] md:gap-4">
        <div className="min-w-0 flex-1 pr-16 sm:pr-24 md:pr-28">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={`shrink-0 items-center rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] sm:inline-flex sm:px-3 sm:text-[10px] sm:tracking-[0.16em] ${
                showVoicePanel ? 'hidden' : 'inline-flex'
              } ${
                showVoicePanel
                  ? 'border-cyan-500/40 bg-cyan-500/12 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                  : 'border-white/10 bg-white/[0.03] text-gray-500'
              }`}
            >
              AI Scoring
            </div>
            <div className="truncate text-[11px] font-black text-white/90 sm:text-[13px] md:text-[14px]">
              {showVoicePanel ? voiceDisplayText : ''}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[7.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center sm:w-[9rem] md:w-[10.5rem]">
          <div className="text-[9px] font-black uppercase leading-none tracking-[0.22em] text-gray-500 sm:text-[10px]">
            Score
          </div>
          <div className={`legacy-match-input-score mt-0.5 text-[clamp(1.75rem,8vw,3.5rem)] font-black leading-none tracking-[0.08em] font-mono sm:mt-1 sm:text-[clamp(2.2rem,5vw,4rem)] md:text-[clamp(2.5rem,4vw,4.5rem)] ${hasDisplayedScore ? 'text-orange-500' : 'text-gray-700'}`}>
            {displayedScore}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 pl-16 sm:gap-2 sm:pl-24 md:pl-28">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 transition-colors hover:text-white disabled:opacity-40 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-[10px] sm:tracking-[0.18em]"
          >
            <span>Retour</span> <span className="text-base leading-none">↶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
