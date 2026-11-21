import type { ReactNode } from 'react';

type MatchInputBarProps = {
  inputBuffer: string;
  proposedVoiceScoreValue: number | null;
  showVoicePanel: boolean;
  voiceDisplayText: string;
  /**
   * `bar` : barre historique (téléphone, bureau) ;
   * `display` : bandeau d'affichage du pavé tablette (portrait et arène), saisie en très grand.
   */
  layout?: 'bar' | 'display';
  /** Bandeau : le texte vocal est une erreur (affiché en rôle danger). */
  voiceError?: boolean;
  /** Bandeau : reste du joueur actif après la volée saisie (null si la saisie n'est pas un score jouable). */
  remainingAfter?: number | null;
  /** Bandeau : le joueur actif peut finir pendant cette volée. */
  checkoutPossible?: boolean;
};

type DisplayStatusProps = Pick<MatchInputBarProps, 'showVoicePanel' | 'voiceDisplayText' | 'voiceError' | 'remainingAfter' | 'checkoutPossible'>;

function DisplayStatus({ showVoicePanel, voiceDisplayText, voiceError, remainingAfter, checkoutPossible }: Readonly<DisplayStatusProps>) {
  let line: ReactNode;
  let tone: 'voice' | 'error' | 'remaining' | 'hint';
  if (showVoicePanel) {
    tone = voiceError ? 'error' : 'voice';
    line = voiceDisplayText || 'À l’écoute…';
  } else if (remainingAfter !== null && remainingAfter !== undefined) {
    tone = 'remaining';
    line = (
      <>
        Reste <span data-testid="x01-display-remaining" className="x01-display-remaining-value font-mono font-black tabular-nums text-fg">{remainingAfter}</span>
      </>
    );
  } else {
    tone = 'hint';
    line = 'Score de la volée';
  }

  const toneClass = {
    voice: 'text-info-fg',
    error: 'text-danger-fg',
    remaining: 'text-fg-muted',
    hint: 'text-fg-faint',
  }[tone];

  return (
    <div className="x01-display-status flex min-w-0 flex-col items-start justify-center" aria-live="polite">
      <div
        data-testid="x01-display-status"
        data-state={tone}
        title={showVoicePanel ? voiceDisplayText : undefined}
        className={`x01-display-line max-w-full font-black ${toneClass}`}
      >
        {line}
      </div>
      {checkoutPossible && (
        <div
          data-testid="x01-display-checkout"
          className="x01-display-chip mt-1 inline-flex max-w-full items-center rounded-full border border-brand-border bg-brand-subtle font-black uppercase text-brand-fg"
        >
          Sortie possible
        </div>
      )}
    </div>
  );
}

type ScoreState = 'filled' | 'empty';

const SCORE_TONES: Record<ScoreState, string> = {
  filled: 'text-brand-fg',
  empty: 'text-fg-disabled',
};

const VOICE_CHIP_CLASSES = {
  active: 'hidden border-info-border bg-info-subtle text-info-fg shadow-glow-info',
  idle: 'inline-flex border-border-subtle bg-surface-tint text-fg-faint',
} as const;

type InputDisplayProps = Readonly<DisplayStatusProps & {
  scoreState: ScoreState;
  displayedScore: string;
}>;

/** Bandeau d'affichage du pavé tablette (portrait et arène) : saisie en très grand et état de la volée. */
function MatchInputDisplay({ scoreState, displayedScore, remainingAfter, ...statusProps }: InputDisplayProps) {
  return (
    <div
      data-testid="x01-display"
      data-state={scoreState}
      className="x01-display grid items-center rounded-2xl border border-border-strong bg-surface-sunken shadow-inner"
    >
      <div className="x01-display-main flex min-w-0 items-center justify-center">
        <div
          data-testid="x01-input-score"
          data-state={scoreState}
          className={`x01-display-value x01-input-score shrink-0 text-right font-mono font-black tabular-nums ${SCORE_TONES[scoreState]}`}
        >
          {displayedScore}
        </div>
        <DisplayStatus {...statusProps} remainingAfter={scoreState === 'filled' ? remainingAfter : null} />
      </div>
    </div>
  );
}

export function MatchInputBar({
  inputBuffer,
  proposedVoiceScoreValue,
  showVoicePanel,
  voiceDisplayText,
  layout = 'bar',
  voiceError = false,
  remainingAfter = null,
  checkoutPossible = false,
}: Readonly<MatchInputBarProps>) {
  const hasDisplayedScore = Boolean(inputBuffer) || proposedVoiceScoreValue !== null;
  const scoreState: ScoreState = hasDisplayedScore ? 'filled' : 'empty';
  const displayedScore = inputBuffer || (proposedVoiceScoreValue === null ? '---' : String(proposedVoiceScoreValue));

  if (layout === 'display') {
    return (
      <MatchInputDisplay
        scoreState={scoreState}
        displayedScore={displayedScore}
        showVoicePanel={showVoicePanel}
        voiceDisplayText={voiceDisplayText}
        voiceError={voiceError}
        remainingAfter={remainingAfter}
        checkoutPossible={checkoutPossible}
      />
    );
  }

  const voiceState = showVoicePanel ? 'active' : 'idle';

  return (
    <div className="x01-inputbar laptop-compact-inputbar border-b border-border bg-surface-sunken px-2 py-1.5 sm:px-4 sm:py-2.5">
      <div className="x01-inputbar-row relative flex min-h-[2.75rem] items-center justify-between gap-2 sm:min-h-[3.5rem] sm:gap-3 md:min-h-[4rem] md:gap-4">
        <div className="min-w-0 flex-1 pr-16 sm:pr-24 md:pr-28">
          <div className="flex min-w-0 items-center gap-2">
            <div
              data-state={voiceState}
              className={`x01-inputbar-chip shrink-0 items-center rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] sm:inline-flex sm:px-3 sm:text-[10px] sm:tracking-[0.16em] ${VOICE_CHIP_CLASSES[voiceState]}`}
            >
              Voix IA
            </div>
            {/* Deux lignes au plus (au lieu d'une ligne tronquée) : les messages vocaux restent lisibles sur téléphone. */}
            <div className={`x01-inputbar-voice-text line-clamp-2 text-[11px] font-black leading-tight sm:text-[13px] md:text-[14px] ${voiceError ? 'text-danger-fg' : 'text-fg-soft'}`}>
              {showVoicePanel ? voiceDisplayText : ''}
            </div>
          </div>
        </div>

        {/* Centred over the row: label + score are capped to fit the row min-height (2.75/3.5/4rem),
            otherwise the block overflows the bar and SCORE sticks to its top edge. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[7.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center sm:w-[9rem] md:w-[10.5rem]">
          <div className="x01-input-score-label text-[9px] font-black uppercase leading-none tracking-[0.22em] text-fg-faint sm:text-[10px]">
            Score
          </div>
          <div
            data-testid="x01-input-score"
            data-state={scoreState}
            className={`x01-input-score legacy-match-input-score mt-0.5 font-mono text-[clamp(1.75rem,8vw,2rem)] font-black leading-none tracking-[0.08em] sm:mt-1 sm:text-[clamp(2.2rem,5vw,2.6rem)] md:text-[clamp(2.5rem,4vw,3rem)] ${SCORE_TONES[scoreState]}`}
          >
            {displayedScore}
          </div>
        </div>

        {/* Pendant symétrique du bloc de gauche : garde le score centré depuis le retrait de « Retour ». */}
        <div aria-hidden="true" className="min-w-0 flex-1" />
      </div>
    </div>
  );
}
