// Spec 129 (V2-SET-01) : page Réglages, ouverte depuis la roue crantée de l'accueil.
// Les options X01 sont les mêmes préférences que le menu de partie (MatchSettingsModal).
import React, { useId } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, IconButton } from '../components/ui/Button';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { ShortcutDraftGrid } from '../components/match/MatchSettingsModal';
import { useCounterSettings } from '../src/app/useCounterSettings';
import { updateX01Settings, type X01SettingsPatch } from '../src/features/settings/counterSettings';
import { useShortcutDrafts } from '../src/features/settings/useShortcutDrafts';
import { env } from '../src/lib/env';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<Readonly<SettingsViewProps>> = ({ onBack }) => {
  const [settings, updateSettings] = useCounterSettings();
  const { drafts, handleShortcutDraftChange, commitShortcutDraft } = useShortcutDrafts();
  const voiceScoringAvailable = env.VITE_ENABLE_VOICE_SCORING;
  const x01 = settings.x01;
  const patchX01 = (patch: X01SettingsPatch) => updateSettings((current) => updateX01Settings(current, patch));

  return (
    <div data-testid="settings-screen" className="settings-page min-h-screen bg-canvas text-fg">
      <div className="settings-shell mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center gap-4">
          <IconButton label="Retour à l’accueil" onClick={onBack} data-testid="settings-back" className="settings-back h-12 w-12">
            <ArrowLeft className="settings-back-icon h-5 w-5" aria-hidden="true" />
          </IconButton>
          <div>
            <div className="opt-kicker text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Bougnat Darts</div>
            <h1 className="settings-title text-3xl font-black italic uppercase text-fg sm:text-4xl">Réglages</h1>
          </div>
        </header>

        <p className="opt-desc max-w-3xl text-sm text-fg-subtle">
          Ces réglages sont mémorisés sur cet appareil, sans compte. Ils s’appliquent à la prochaine partie et restent
          modifiables pendant une partie X01 depuis son menu d’options.
        </p>

        <div className="settings-grid grid gap-4 md:grid-cols-2 md:items-start">
          <div className="settings-column space-y-4">
            <SettingsSection title="Apparence" testId="settings-section-appearance">
              <ThemeSelector className="[&>legend]:sr-only" />
              <p className="opt-help mt-3 text-center text-xs text-fg-faint">« Auto » suit le thème clair ou sombre de l’appareil.</p>
            </SettingsSection>

            <SettingsSection title="X01 · Aides de jeu" testId="settings-section-x01-aids">
              <SettingSwitch
                title="Suggestions de finish"
                description="Afficher l’aide de checkout pendant la partie."
                checked={x01.checkoutHints}
                onToggle={() => patchX01({ checkoutHints: !x01.checkoutHints })}
                testId="settings-x01-hints"
              />
              {voiceScoringAvailable && (
                <SettingSwitch
                  title="Assistance vocale IA"
                  description="Proposer le score dicté à voix haute. Active par défaut."
                  checked={x01.voiceAssist}
                  onToggle={() => patchX01({ voiceAssist: !x01.voiceAssist })}
                  testId="settings-x01-voice"
                />
              )}
            </SettingsSection>

            <SettingsSection title="Autres jeux" testId="settings-section-other-games">
              <p className="opt-desc text-sm text-fg-subtle">
                Cricket, Capital, Triathlon, Killer, Gotcha et 180 Around the Clock n’ont pas d’option à régler pour l’instant.
              </p>
            </SettingsSection>
          </div>

          <SettingsSection title="X01 · Raccourcis" testId="settings-section-x01-shortcuts">
            <SettingSwitch
              title="Barre de raccourcis (téléphone)"
              description="Ligne de scores rapides au-dessus du pavé. Masquée automatiquement si l’écran est trop petit."
              checked={x01.mobileShortcutsBar}
              onToggle={() => patchX01({ mobileShortcutsBar: !x01.mobileShortcutsBar })}
              testId="settings-x01-mobile-bar"
            />
            <ShortcutDraftGrid
              columns={3}
              drafts={drafts.mobile}
              label="Scores de la barre"
              group="mobile"
              onBlur={commitShortcutDraft}
              onChange={handleShortcutDraftChange}
            />
            <div>
              <div className="opt-title text-sm font-black uppercase text-fg">Colonnes latérales (tablette et PC)</div>
              <div className="opt-desc mt-1 text-sm text-fg-subtle">Scores rapides de part et d’autre du pavé.</div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <ShortcutDraftGrid
                drafts={drafts.left}
                label="Colonne gauche"
                group="left"
                onBlur={commitShortcutDraft}
                onChange={handleShortcutDraftChange}
              />
              <ShortcutDraftGrid
                drafts={drafts.right}
                label="Colonne droite"
                group="right"
                onBlur={commitShortcutDraft}
                onChange={handleShortcutDraftChange}
              />
            </div>
            <p className="opt-help text-xs text-fg-faint">
              Scores autorisés uniquement (0 à 180, réalisables en trois fléchettes). Si une valeur n’est pas valide, le
              raccourci précédent est conservé.
            </p>
          </SettingsSection>
        </div>

        <div className="flex justify-center pb-4">
          <Button variant="secondary" onClick={onBack} className="settings-back-bottom rounded-full">
            Retour à l’accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

function SettingsSection({
  title,
  testId,
  children,
}: Readonly<{ title: string; testId: string; children: React.ReactNode }>) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-testid={testId}
      className="opt-card settings-section rounded-xl border border-border-subtle bg-surface p-4 shadow-raised sm:p-5"
    >
      <h2 id={titleId} className="opt-kicker settings-section-title mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-fg-faint">
        {title}
      </h2>
      <div className="settings-section-body space-y-4">{children}</div>
    </section>
  );
}

function SettingSwitch({
  title,
  description,
  checked,
  onToggle,
  testId,
}: Readonly<{ title: string; description: string; checked: boolean; onToggle: () => void; testId: string }>) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div id={titleId} className="opt-title text-sm font-black uppercase text-fg">{title}</div>
        <div id={descriptionId} className="opt-desc mt-1 text-sm text-fg-subtle">{description}</div>
      </div>
      <Button
        role="switch"
        aria-checked={checked}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-state={checked ? 'on' : 'off'}
        data-testid={testId}
        variant={checked ? 'success' : 'secondary'}
        size="sm"
        onClick={onToggle}
        className="opt-toggle min-w-24 rounded-full"
      >
        {checked ? 'Activé' : 'Désactivé'}
      </Button>
    </div>
  );
}
