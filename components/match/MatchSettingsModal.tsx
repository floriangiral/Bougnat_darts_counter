type MatchSettingsModalProps = {
  canCustomizeSideShortcuts: boolean;
  leftShortcutDrafts: string[];
  rightShortcutDrafts: string[];
  showHints: boolean;
  voiceAssistEnabled: boolean;
  voiceScoringAvailable: boolean;
  onClose: () => void;
  onDismissVoiceProposal: () => void;
  onResetShortcutDraft: (side: 'left' | 'right', index: number) => void;
  onShortcutDraftChange: (side: 'left' | 'right', index: number, value: string) => void;
  onToggleHints: () => void;
  onToggleVoiceAssist: () => void;
};

export function MatchSettingsModal({
  canCustomizeSideShortcuts,
  leftShortcutDrafts,
  rightShortcutDrafts,
  showHints,
  voiceAssistEnabled,
  voiceScoringAvailable,
  onClose,
  onDismissVoiceProposal,
  onResetShortcutDraft,
  onShortcutDraftChange,
  onToggleHints,
  onToggleVoiceAssist,
}: MatchSettingsModalProps) {
  const toggleVoiceAssist = () => {
    if (voiceAssistEnabled) {
      onDismissVoiceProposal();
    }
    onToggleVoiceAssist();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Configuration</div>
            <h3 className="mt-2 text-2xl font-black italic uppercase text-white">Options de jeu</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Aides de jeu</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black uppercase text-white">Suggestions de finish</div>
                  <div className="mt-1 text-sm text-gray-400">Afficher ou masquer l aide de checkout pendant la partie.</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleHints}
                  className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                    showHints
                      ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                      : 'border-white/10 bg-white/[0.04] text-gray-400 hover:text-white'
                  }`}
                >
                  {showHints ? 'Actif' : 'Off'}
                </button>
              </div>

              {voiceScoringAvailable && (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black uppercase text-white">Assistance vocale IA</div>
                    <div className="mt-1 text-sm text-gray-400">
                      Active ou coupe la proposition vocale pendant ce match X01. Active par defaut.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVoiceAssist}
                    className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                      voiceAssistEnabled
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                        : 'border-white/10 bg-white/[0.04] text-gray-400 hover:text-white'
                    }`}
                  >
                    {voiceAssistEnabled ? 'Actif' : 'Off'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Raccourcis</div>
            {canCustomizeSideShortcuts ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Les raccourcis lateraux sont visibles sur tablette, PC et affichages larges. Tu peux les modifier ici avec des scores valides.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ShortcutDraftGrid
                    drafts={leftShortcutDrafts}
                    label="Colonne gauche"
                    side="left"
                    onBlur={onResetShortcutDraft}
                    onChange={onShortcutDraftChange}
                  />
                  <ShortcutDraftGrid
                    drafts={rightShortcutDrafts}
                    label="Colonne droite"
                    side="right"
                    onBlur={onResetShortcutDraft}
                    onChange={onShortcutDraftChange}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Scores autorises uniquement. Si une valeur n est pas valide, le raccourci precedent est conserve.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Les raccourcis rapides lateraux ne sont pas affiches sur ce format d ecran. La modification sera disponible automatiquement sur tablette, PC ou affichage plus large.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutDraftGrid({
  drafts,
  label,
  side,
  onBlur,
  onChange,
}: {
  drafts: string[];
  label: string;
  side: 'left' | 'right';
  onBlur: (side: 'left' | 'right', index: number) => void;
  onChange: (side: 'left' | 'right', index: number, value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {drafts.map((value, index) => (
          <input
            key={`${side}-shortcut-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(event) => onChange(side, index, event.target.value)}
            onBlur={() => onBlur(side, index)}
            className="rounded-xl border border-white/10 bg-[#0a1018] px-3 py-2 text-center text-sm font-black text-white outline-none transition-colors focus:border-orange-400/40"
          />
        ))}
      </div>
    </div>
  );
}
