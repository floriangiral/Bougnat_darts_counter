// Spec 129 : saisie des raccourcis X01 partagée par la page Réglages et le menu de partie.
// Le brouillon reste local à l'écran pendant la frappe ; le score n'est enregistré qu'en quittant la case,
// et seulement s'il est valide. Sinon la case reprend le score enregistré. (Enregistrer à chaque frappe
// gardait la dernière valeur partielle valide : taper 179 enregistrait 17, taper 666 enregistrait 66.)
import { useState } from 'react';
import { useCounterSettings } from '../../app/useCounterSettings';
import {
  parseShortcutDraft,
  sanitizeShortcutDraft,
  setX01Shortcut,
  type ShortcutGroup,
  type X01Shortcuts,
} from './counterSettings';

type ShortcutDrafts = Record<ShortcutGroup, string[]>;

const toDrafts = (shortcuts: X01Shortcuts): ShortcutDrafts => ({
  left: shortcuts.left.map(String),
  right: shortcuts.right.map(String),
  mobile: shortcuts.mobile.map(String),
});

const replaceAt = (values: readonly string[], index: number, value: string) =>
  values.map((entry, entryIndex) => (entryIndex === index ? value : entry));

export function useShortcutDrafts() {
  const [settings, updateSettings] = useCounterSettings();
  const { shortcuts } = settings.x01;
  const [drafts, setDrafts] = useState<ShortcutDrafts>(() => toDrafts(shortcuts));

  const handleShortcutDraftChange = (group: ShortcutGroup, index: number, value: string) => {
    const sanitizedValue = sanitizeShortcutDraft(value);
    setDrafts((prev) => ({ ...prev, [group]: replaceAt(prev[group], index, sanitizedValue) }));
  };

  const commitShortcutDraft = (group: ShortcutGroup, index: number) => {
    const parsed = parseShortcutDraft(drafts[group][index]);
    const saved = parsed ?? shortcuts[group][index];
    if (parsed !== null && parsed !== shortcuts[group][index]) {
      updateSettings((current) => setX01Shortcut(current, group, index, parsed));
    }
    setDrafts((prev) => ({ ...prev, [group]: replaceAt(prev[group], index, String(saved)) }));
  };

  return { shortcuts, drafts, handleShortcutDraftChange, commitShortcutDraft };
}
