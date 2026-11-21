// Spec 129 : saisie des raccourcis X01 partagée par la page Réglages et le menu de partie.
// Le brouillon reste local à l'écran ; seul un score valide est enregistré dans la préférence.
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
    const parsed = parseShortcutDraft(sanitizedValue);
    if (parsed === null) return;
    updateSettings((current) => setX01Shortcut(current, group, index, parsed));
  };

  const resetShortcutDraft = (group: ShortcutGroup, index: number) => {
    setDrafts((prev) => ({ ...prev, [group]: replaceAt(prev[group], index, String(shortcuts[group][index])) }));
  };

  return { shortcuts, drafts, handleShortcutDraftChange, resetShortcutDraft };
}
