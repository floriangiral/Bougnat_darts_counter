type MatchInputBarProps = {
  canUndo: boolean;
  inputBuffer: string;
  proposedVoiceScoreValue: number | null;
  showVoicePanel: boolean;
  voiceDisplayText: string;
  onUndo: () => void;
  /** En arène, Retour est posé à côté de OK dans le pavé (spec 072 FR-07) : la barre ne le répète pas. */
  showUndo?: boolean;
};

export function MatchInputBar({
  canUndo,
  inputBuffer,
  proposedVoiceScoreValue,
  showVoicePanel,
  voiceDisplayText,
  onUndo,
  showUndo = true,
}: Readonly<MatchInputBarProps>) {
  const displayedScore = inputBuffer || (proposedVoiceScoreValue !== null ? String(proposedVoiceScoreValue) : '---');
  const hasDisplayedScore = inputBuffer || proposedVoiceScoreValue !== null;

  return (
    <div className="x01-inputbar laptop-compact-inputbar border-b border-border bg-surface-sunken px-2 py-1.5 sm:px-4 sm:py-2.5">
      <div className="x01-inputbar-row relative flex min-h-[2.75rem] items-center justify-between gap-2 sm:min-h-[3.5rem] sm:gap-3 md:min-h-[4rem] md:gap-4">
        <div className="min-w-0 flex-1 pr-16 sm:pr-24 md:pr-28">
          <div className="flex min-w-0 items-center gap-2">
            <div
              data-state={showVoicePanel ? 'active' : 'idle'}
              className={`shrink-0 items-center rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] sm:inline-flex sm:px-3 sm:text-[10px] sm:tracking-[0.16em] ${
                showVoicePanel ? 'hidden' : 'inline-flex'
              } ${
                showVoicePanel
                  ? 'border-info-border bg-info-subtle text-info-fg shadow-glow-info'
                  : 'border-border-subtle bg-surface-tint text-fg-faint'
              }`}
            >
              AI Scoring
            </div>
            <div className="truncate text-[11px] font-black text-fg-soft sm:text-[13px] md:text-[14px]">
              {showVoicePanel ? voiceDisplayText : ''}
            </div>
          </div>
        </div>

        {/* Centred over the row: label + score are capped to fit the row min-height (2.75/3.5/4rem),
            otherwise the block overflows the bar and SCORE sticks to its top edge. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[7.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center sm:w-[9rem] md:w-[10.5rem]">
          <div className="text-[9px] font-black uppercase leading-none tracking-[0.22em] text-fg-faint sm:text-[10px]">
            Score
          </div>
          <div
            data-testid="x01-input-score"
            data-state={hasDisplayedScore ? 'filled' : 'empty'}
            className={`legacy-match-input-score mt-0.5 font-mono text-[clamp(1.75rem,8vw,2rem)] font-black leading-none tracking-[0.08em] sm:mt-1 sm:text-[clamp(2.2rem,5vw,2.6rem)] md:text-[clamp(2.5rem,4vw,3rem)] ${hasDisplayedScore ? 'text-brand-fg' : 'text-fg-disabled'}`}
          >
            {displayedScore}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 pl-16 sm:gap-2 sm:pl-24 md:pl-28">
          {showUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              data-testid="x01-keypad-undo"
              className="inline-flex h-8 items-center gap-1 rounded-full border border-border-subtle bg-surface-tint px-2 text-[9px] font-black uppercase tracking-[0.14em] text-fg-subtle transition-colors hover:text-fg disabled:opacity-40 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-[10px] sm:tracking-[0.18em]"
            >
              <span>Retour</span> <span className="text-base leading-none">↶</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
