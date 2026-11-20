import { RotateCw } from 'lucide-react';

interface OrientationHintProps {
  onDismiss: () => void;
}

// Spec 028 (option B) : invite non bloquante sur téléphone en paysage, fermable au clavier, centrée en
// haut de l'écran de jeu pour ne masquer ni les scores ni la saisie.
export const OrientationHint = ({ onDismiss }: OrientationHintProps) => (
  <div
    role="status"
    data-testid="orientation-hint"
    data-hint="rotate-to-portrait"
    className="pointer-events-none fixed inset-x-0 top-0 z-[150] flex justify-center px-3 pt-[max(0.5rem,var(--app-safe-top))]"
  >
    <div className="pointer-events-auto flex max-w-[min(92vw,34rem)] items-center gap-3 rounded-2xl border border-brand-border bg-surface-glass px-3 py-2 text-fg shadow-elevated backdrop-blur-md">
      <RotateCw className="h-5 w-5 shrink-0 text-brand-fg" aria-hidden="true" />
      <span className="text-xs font-bold sm:text-sm">Tourne ton téléphone pour l’affichage portrait</span>
      <button
        type="button"
        data-testid="orientation-hint-dismiss"
        onClick={onDismiss}
        className="min-h-11 shrink-0 rounded-xl border border-border-subtle bg-surface-tint px-3 text-[11px] font-black uppercase tracking-[0.12em] text-fg-muted hover:text-fg"
      >
        Continuer en paysage
      </button>
    </div>
  </div>
);
