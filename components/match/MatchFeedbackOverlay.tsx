import type { FeedbackKind } from '../../src/features/x01/scoring/matchSubmission';
import { getFeedbackPresentation, type FeedbackTone } from '../../src/features/x01/scoring/matchFeedback';

// Traduction du ton (spec 066 FR-06) en rôles de tokens : aucune couleur n'est décidée par la règle.
const TONE_CLASSES: Record<FeedbackTone, { card: string; accent: string; kicker: string; value: string }> = {
  bust: { card: 'border-game-bust', accent: 'bg-game-bust', kicker: 'text-game-bust-fg', value: 'text-game-bust-fg' },
  miss: { card: 'border-border-strong', accent: 'bg-fg-faint', kicker: 'text-fg-muted', value: 'text-fg' },
  notice: { card: 'border-warning-border', accent: 'bg-warning', kicker: 'text-warning-fg', value: 'text-fg' },
  info: { card: 'border-brand-border', accent: 'bg-brand', kicker: 'text-brand-fg', value: 'text-fg' },
};

type MatchFeedbackOverlayProps = Readonly<{
  text: string;
  type: FeedbackKind;
}>;

export function MatchFeedbackOverlay({ text, type }: MatchFeedbackOverlayProps) {
  const { tone, label } = getFeedbackPresentation(type);
  const classes = TONE_CLASSES[tone];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-scrim backdrop-blur-sm animate-in fade-in duration-200">
      <output
        data-testid="x01-feedback"
        data-tone={tone}
        className={`relative block min-w-[220px] overflow-hidden rounded-[1.5rem] border-2 bg-surface-raised px-8 py-6 shadow-elevated sm:min-w-[340px] sm:px-10 sm:py-8 ${classes.card}`}
      >
        <div className={`absolute inset-x-0 top-0 h-1.5 ${classes.accent}`} />
        <div className="relative flex flex-col items-center text-center">
          <span className={`mb-3 text-[11px] font-black uppercase tracking-[0.28em] ${classes.kicker}`}>{label}</span>
          <span className={`text-5xl font-black uppercase leading-none sm:text-6xl ${classes.value}`}>{text}</span>
        </div>
      </output>
    </div>
  );
}
