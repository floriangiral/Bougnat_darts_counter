import { useId } from 'react';
import type { ShortcutGroup } from '../../src/features/x01/hooks/useMatchShortcuts';
import { KEYPAD_TONES } from '../ui/buttonStyles';
import { ThemeSelector } from '../ui/ThemeSelector';

type MatchSettingsModalProps = {
  canCustomizeSideShortcuts: boolean;
  shortcutLayout?: 'columns' | 'row' | 'rows';
  leftShortcutDrafts: readonly string[];
  rightShortcutDrafts: readonly string[];
  mobileShortcutDrafts: readonly string[];
  mobileShortcutsEnabled: boolean;
  showHints: boolean;
  voiceAssistEnabled: boolean;
  voiceScoringAvailable: boolean;
  onClose: () => void;
  onDismissVoiceProposal: () => void;
  onCommitShortcutDraft: (group: ShortcutGroup, index: number) => void;
  onShortcutDraftChange: (group: ShortcutGroup, index: number, value: string) => void;
  onToggleHints: () => void;
  onToggleMobileShortcuts: () => void;
  onToggleVoiceAssist: () => void;
  /** Spec 080 FR-04 : ouvre la fiche « Voix et confidentialité ». */
  onShowVoicePrivacy: () => void;
};

export function MatchSettingsModal({
  canCustomizeSideShortcuts,
  shortcutLayout = 'columns',
  leftShortcutDrafts,
  rightShortcutDrafts,
  mobileShortcutDrafts,
  mobileShortcutsEnabled,
  showHints,
  voiceAssistEnabled,
  voiceScoringAvailable,
  onClose,
  onDismissVoiceProposal,
  onCommitShortcutDraft,
  onShortcutDraftChange,
  onToggleHints,
  onToggleMobileShortcuts,
  onToggleVoiceAssist,
  onShowVoicePrivacy,
}: Readonly<MatchSettingsModalProps>) {
  const dialogTitleId = useId();
  const toggleVoiceAssist = () => {
    if (voiceAssistEnabled) {
      onDismissVoiceProposal();
    }
    onToggleVoiceAssist();
  };

  return (
    <dialog open aria-labelledby={dialogTitleId} data-modal-size="wide" className="match-settings app-modal tablet-modal fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-overlay p-4 text-fg backdrop-blur-sm">
      <div className="match-settings-panel mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-border-strong bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="modal-kicker text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Configuration</div>
            <h3 id={dialogTitleId} className="modal-title mt-2 text-2xl font-black italic uppercase text-fg">Options de jeu</h3>
            {/* Spec 129 : mêmes préférences que la page Réglages de l'accueil. */}
            <p className="modal-help mt-1 text-xs text-fg-subtle">Mémorisées sur cet appareil, comme dans les Réglages.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-tint px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-fg-muted transition-colors hover:border-border-strong/20 hover:text-fg"
          >
            Fermer
          </button>
        </div>

        <div className="match-settings-body mt-5 space-y-4">
          <div className="opt-card rounded-xl border border-border-strong bg-surface-inset p-4">
            <div className="opt-kicker mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Aides de jeu</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="opt-title text-sm font-black uppercase text-fg">Suggestions de finish</div>
                  <div className="opt-desc mt-1 text-sm text-fg-subtle">Afficher ou masquer l’aide de checkout pendant la partie.</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleHints}
                  aria-pressed={showHints}
                  data-state={showHints ? 'on' : 'off'}
                  className={`opt-toggle rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                    showHints
                      ? 'border-brand-border bg-brand-subtle text-brand-fg'
                      : 'border-border-subtle bg-surface-tint text-fg-subtle hover:text-fg'
                  }`}
                >
                  {showHints ? 'Actif' : 'Off'}
                </button>
              </div>

              {voiceScoringAvailable && (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="opt-title text-sm font-black uppercase text-fg">Assistance vocale IA</div>
                    <div className="opt-desc mt-1 text-sm text-fg-subtle">
                      Active ou coupe la proposition vocale en X01. Désactivée par défaut.
                    </div>
                    <button
                      type="button"
                      onClick={onShowVoicePrivacy}
                      data-testid="voice-privacy-link"
                      className="opt-help mt-1 text-sm font-bold text-info-fg underline underline-offset-2 hover:text-fg"
                    >
                      En savoir plus sur la voix
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVoiceAssist}
                    aria-pressed={voiceAssistEnabled}
                    data-state={voiceAssistEnabled ? 'on' : 'off'}
                    className={`opt-toggle rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                      voiceAssistEnabled
                        ? 'border-info-border bg-info-subtle text-info-fg'
                        : 'border-border-subtle bg-surface-tint text-fg-subtle hover:text-fg'
                    }`}
                  >
                    {voiceAssistEnabled ? 'Actif' : 'Off'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <MatchSettingsShortcuts
            canCustomizeSideShortcuts={canCustomizeSideShortcuts}
            shortcutLayout={shortcutLayout}
            leftShortcutDrafts={leftShortcutDrafts}
            rightShortcutDrafts={rightShortcutDrafts}
            mobileShortcutDrafts={mobileShortcutDrafts}
            mobileShortcutsEnabled={mobileShortcutsEnabled}
            onCommitShortcutDraft={onCommitShortcutDraft}
            onShortcutDraftChange={onShortcutDraftChange}
            onToggleMobileShortcuts={onToggleMobileShortcuts}
          />

          {/* Spec 069 Q1 : préférence d'apparence aussi accessible pendant la partie. */}
          <div className="opt-card rounded-xl border border-border-strong bg-surface-inset p-4">
            <ThemeSelector />
          </div>
        </div>
      </div>
    </dialog>
  );
}

type MatchSettingsShortcutsProps = Pick<
  MatchSettingsModalProps,
  | 'canCustomizeSideShortcuts'
  | 'shortcutLayout'
  | 'leftShortcutDrafts'
  | 'rightShortcutDrafts'
  | 'mobileShortcutDrafts'
  | 'mobileShortcutsEnabled'
  | 'onCommitShortcutDraft'
  | 'onShortcutDraftChange'
  | 'onToggleMobileShortcuts'
>;

function MatchSettingsShortcuts({
  canCustomizeSideShortcuts,
  shortcutLayout = 'columns',
  leftShortcutDrafts,
  rightShortcutDrafts,
  mobileShortcutDrafts,
  mobileShortcutsEnabled,
  onCommitShortcutDraft,
  onShortcutDraftChange,
  onToggleMobileShortcuts,
}: Readonly<MatchSettingsShortcutsProps>) {
  const shortcutGroups = [
    { group: 'left', tone: 'double', drafts: leftShortcutDrafts },
    { group: 'right', tone: 'triple', drafts: rightShortcutDrafts },
  ] as const;
  const keypadShortcuts = shortcutGroups.flatMap(({ group, tone, drafts }) =>
    drafts.map((value, index) => ({ group, tone, value, index })));
  const shortcutColumns = shortcutLayout === 'rows'
    ? Math.max(leftShortcutDrafts.length, rightShortcutDrafts.length)
    : keypadShortcuts.length;

  return (
    <div className="match-settings-shortcuts opt-card min-w-0 rounded-xl border border-border-strong bg-surface-inset p-4">
      <div className="opt-kicker mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Raccourcis</div>
      {canCustomizeSideShortcuts ? (
        <div className="space-y-4">
          <p className="opt-desc text-sm text-fg-subtle">{getShortcutDescription(shortcutLayout)}</p>
          {shortcutLayout === 'columns' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ShortcutDraftGrid
                drafts={leftShortcutDrafts}
                label="Colonne gauche"
                group="left"
                onBlur={onCommitShortcutDraft}
                onChange={onShortcutDraftChange}
              />
              <ShortcutDraftGrid
                drafts={rightShortcutDrafts}
                label="Colonne droite"
                group="right"
                onBlur={onCommitShortcutDraft}
                onChange={onShortcutDraftChange}
              />
            </div>
          ) : (
            <fieldset aria-label="Raccourcis dans l’ordre du pavé" className="m-0 min-w-0 border-0 p-0">
              <div className="overflow-x-auto">
                <div
                  className="opt-shortcut-keypad grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${shortcutColumns}, minmax(3rem, 1fr))` }}
                >
                  {keypadShortcuts.map(({ group, tone, value, index }, position) => (
                    <ShortcutDraftInput
                      key={`${group}-${index}`}
                      label={`Raccourci ${position + 1}`}
                      value={value}
                      tone={tone}
                      onChange={(draft) => onShortcutDraftChange(group, index, draft)}
                      onBlur={() => onCommitShortcutDraft(group, index)}
                    />
                  ))}
                </div>
              </div>
            </fieldset>
          )}
          <p className="opt-help text-xs text-fg-faint">
            Scores autorisés uniquement. Si une valeur n’est pas valide, le raccourci précédent est conservé.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="opt-title text-sm font-black uppercase text-fg">Barre de raccourcis</div>
              <div className="opt-desc mt-1 text-sm text-fg-subtle">
                Ligne de scores rapides au-dessus du pavé. Masquée automatiquement si l’écran est trop petit.
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleMobileShortcuts}
              aria-pressed={mobileShortcutsEnabled}
              data-state={mobileShortcutsEnabled ? 'on' : 'off'}
              data-testid="toggle-mobile-shortcuts"
              className={`opt-toggle rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                mobileShortcutsEnabled
                  ? 'border-brand-border bg-brand-subtle text-brand-fg'
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
                onBlur={onCommitShortcutDraft}
                onChange={onShortcutDraftChange}
              />
              <p className="opt-help text-xs text-fg-faint">
                Scores autorisés uniquement. Si une valeur n’est pas valide, le raccourci précédent est conservé.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getShortcutDescription(layout: NonNullable<MatchSettingsModalProps['shortcutLayout']>): string {
  switch (layout) {
    case 'columns':
      return 'Les raccourcis sont placés de part et d’autre du pavé numérique. Modifie-les ici avec des scores valides.';
    case 'rows':
      return 'Les raccourcis sont placés au-dessus des chiffres, sur deux rangées. Retrouve ici le même ordre et les mêmes couleurs que sur le pavé.';
    case 'row':
      return 'Les raccourcis sont placés au-dessus des chiffres, sur une ligne. Retrouve ici le même ordre et les mêmes couleurs que sur le pavé.';
  }
}

export function ShortcutDraftGrid({
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
      <div className="opt-kicker mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-fg-faint">{label}</div>
      <div className={`opt-shortcut-grid grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {drafts.map((value, index) => (
          <ShortcutDraftInput
            key={`${group}-shortcut-${index}`}
            label={`${label} ${index + 1}`}
            value={value}
            onChange={(draft) => onChange(group, index, draft)}
            onBlur={() => onBlur(group, index)}
          />
        ))}
      </div>
    </div>
  );
}

function ShortcutDraftInput({
  label,
  value,
  tone,
  onChange,
  onBlur,
}: Readonly<{
  label: string;
  value: string;
  tone?: 'double' | 'triple';
  onChange: (value: string) => void;
  onBlur: () => void;
}>) {
  const colors = tone ? KEYPAD_TONES[tone] : 'border border-border-subtle bg-surface-sunken text-fg';
  return (
    <input
      aria-label={label}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      data-tone={tone}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      className={`opt-shortcut-input rounded-xl px-3 py-2 text-center text-sm font-black transition-colors focus:border-brand-border ${colors}`}
    />
  );
}
