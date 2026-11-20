import { useId } from 'react';
import type { ShortcutGroup } from '../../src/features/x01/hooks/useMatchShortcuts';

type MatchSettingsModalProps = {
  canCustomizeSideShortcuts: boolean;
  leftShortcutDrafts: readonly string[];
  rightShortcutDrafts: readonly string[];
  mobileShortcutDrafts: readonly string[];
  mobileShortcutsEnabled: boolean;
  showHints: boolean;
  voiceAssistEnabled: boolean;
  voiceScoringAvailable: boolean;
  onClose: () => void;
  onDismissVoiceProposal: () => void;
  onResetShortcutDraft: (group: ShortcutGroup, index: number) => void;
  onShortcutDraftChange: (group: ShortcutGroup, index: number, value: string) => void;
  onToggleHints: () => void;
  onToggleMobileShortcuts: () => void;
  onToggleVoiceAssist: () => void;
};

export function MatchSettingsModal({
  canCustomizeSideShortcuts,
  leftShortcutDrafts,
  rightShortcutDrafts,
  mobileShortcutDrafts,
  mobileShortcutsEnabled,
  showHints,
  voiceAssistEnabled,
  voiceScoringAvailable,
  onClose,
  onDismissVoiceProposal,
  onResetShortcutDraft,
  onShortcutDraftChange,
  onToggleHints,
  onToggleMobileShortcuts,
  onToggleVoiceAssist,
}: Readonly<MatchSettingsModalProps>) {
  const dialogTitleId = useId();
  const toggleVoiceAssist = () => {
    if (voiceAssistEnabled) {
      onDismissVoiceProposal();
    }
    onToggleVoiceAssist();
  };

  return (
    <dialog open aria-labelledby={dialogTitleId} className="app-modal tablet-modal fixed inset-0 z-50 m-0 max-h-none max-w-none border-0 bg-overlay p-4 text-fg backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Configuration</div>
            <h3 id={dialogTitleId} className="mt-2 text-2xl font-black italic uppercase text-fg">Options de jeu</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-tint px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-fg-muted transition-colors hover:border-border-strong/20 hover:text-fg"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-border-strong bg-surface-inset p-4">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Aides de jeu</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black uppercase text-fg">Suggestions de finish</div>
                  <div className="mt-1 text-sm text-fg-subtle">Afficher ou masquer l’aide de checkout pendant la partie.</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleHints}
                  className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                    showHints
                      ? 'border-brand-border bg-brand-subtle text-brand-fg-faint'
                      : 'border-border-subtle bg-surface-tint text-fg-subtle hover:text-fg'
                  }`}
                >
                  {showHints ? 'Actif' : 'Off'}
                </button>
              </div>

              {voiceScoringAvailable && (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black uppercase text-fg">Assistance vocale IA</div>
                    <div className="mt-1 text-sm text-fg-subtle">
                      Active ou coupe la proposition vocale pendant ce match X01. Active par défaut.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVoiceAssist}
                    className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                      voiceAssistEnabled
                        ? 'border-info-border bg-info-subtle text-cyan-300'
                        : 'border-border-subtle bg-surface-tint text-fg-subtle hover:text-fg'
                    }`}
                  >
                    {voiceAssistEnabled ? 'Actif' : 'Off'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border-strong bg-surface-inset p-4">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Raccourcis</div>
            {canCustomizeSideShortcuts ? (
              <div className="space-y-4">
                <p className="text-sm text-fg-subtle">
                  Les raccourcis latéraux sont visibles sur tablette, PC et affichages larges. Tu peux les modifier ici avec des scores valides.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ShortcutDraftGrid
                    drafts={leftShortcutDrafts}
                    label="Colonne gauche"
                    group="left"
                    onBlur={onResetShortcutDraft}
                    onChange={onShortcutDraftChange}
                  />
                  <ShortcutDraftGrid
                    drafts={rightShortcutDrafts}
                    label="Colonne droite"
                    group="right"
                    onBlur={onResetShortcutDraft}
                    onChange={onShortcutDraftChange}
                  />
                </div>
                <p className="text-xs text-fg-faint">
                  Scores autorisés uniquement. Si une valeur n’est pas valide, le raccourci précédent est conservé.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black uppercase text-fg">Barre de raccourcis</div>
                    <div className="mt-1 text-sm text-fg-subtle">
                      Ligne de scores rapides au-dessus du pavé. Masquée automatiquement si l’écran est trop petit.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleMobileShortcuts}
                    aria-pressed={mobileShortcutsEnabled}
                    data-testid="toggle-mobile-shortcuts"
                    className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                      mobileShortcutsEnabled
                        ? 'border-brand-border bg-brand-subtle text-brand-fg-faint'
                        : 'border-border-subtle bg-surface-tint text-fg-subtle hover:text-fg'
                    }`}
                  >
                    {mobileShortcutsEnabled ? 'Actif' : 'Off'}
                  </button>
                </div>
                {mobileShortcutsEnabled && (
                  <>
                    <ShortcutDraftGrid
                      columns={3}
                      drafts={mobileShortcutDrafts}
                      label="Scores de la barre"
                      group="mobile"
                      onBlur={onResetShortcutDraft}
                      onChange={onShortcutDraftChange}
                    />
                    <p className="text-xs text-fg-faint">
                      Scores autorisés uniquement. Si une valeur n’est pas valide, le raccourci précédent est conservé.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

function ShortcutDraftGrid({
  columns = 2,
  drafts,
  label,
  group,
  onBlur,
  onChange,
}: Readonly<{
  columns?: 2 | 3;
  drafts: readonly string[];
  label: string;
  group: ShortcutGroup;
  onBlur: (group: ShortcutGroup, index: number) => void;
  onChange: (group: ShortcutGroup, index: number, value: string) => void;
}>) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-fg-faint">{label}</div>
      <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {drafts.map((value, index) => (
          <input
            key={`${group}-shortcut-${index}`}
            aria-label={`${label} ${index + 1}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(event) => onChange(group, index, event.target.value)}
            onBlur={() => onBlur(group, index)}
            className="rounded-xl border border-border-subtle bg-[#0a1018] px-3 py-2 text-center text-sm font-black text-fg outline-none transition-colors focus:border-brand-border"
          />
        ))}
      </div>
    </div>
  );
}
