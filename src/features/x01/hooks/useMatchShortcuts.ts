// Customizable quick-score shortcuts for the match keypad.
// Manages shortcut values, draft strings, responsive layout mode, and edit handlers.
// Tablet/PC show two side columns (left/right); phones show one row above the keypad (mobile),
// which can be switched off in the match settings.
import { useEffect, useState } from 'react';
import { POSSIBLE_TURN_SCORES } from '../scoring/possibleTurnScores';

export type ShortcutGroup = 'left' | 'right' | 'mobile';

const DEFAULT_SHORTCUTS: Record<ShortcutGroup, number[]> = {
  left: [41, 45, 60, 100],
  right: [26, 81, 85, 140],
  mobile: [45, 60, 100, 81, 85, 140],
};

const toDrafts = (values: readonly number[]) => values.map(String);

export function useMatchShortcuts() {
  const [canCustomizeSideShortcuts, setCanCustomizeSideShortcuts] = useState(
    () => window.innerWidth >= 768,
  );
  const [shortcuts, setShortcuts] = useState<Record<ShortcutGroup, number[]>>(DEFAULT_SHORTCUTS);
  const [drafts, setDrafts] = useState<Record<ShortcutGroup, string[]>>(() => ({
    left: toDrafts(DEFAULT_SHORTCUTS.left),
    right: toDrafts(DEFAULT_SHORTCUTS.right),
    mobile: toDrafts(DEFAULT_SHORTCUTS.mobile),
  }));
  const [mobileShortcutsEnabled, setMobileShortcutsEnabled] = useState(true);

  useEffect(() => {
    const syncLayoutMode = () => setCanCustomizeSideShortcuts(window.innerWidth >= 768);
    syncLayoutMode();
    window.addEventListener('resize', syncLayoutMode);
    return () => window.removeEventListener('resize', syncLayoutMode);
  }, []);

  const replaceAt = <T,>(values: readonly T[], index: number, value: T) =>
    values.map((entry, entryIndex) => (entryIndex === index ? value : entry));

  const handleShortcutDraftChange = (group: ShortcutGroup, index: number, value: string) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 3);
    setDrafts((prev) => ({ ...prev, [group]: replaceAt(prev[group], index, sanitizedValue) }));

    if (!sanitizedValue) return;

    const parsed = Number.parseInt(sanitizedValue, 10);
    if (Number.isNaN(parsed) || parsed > 180 || !POSSIBLE_TURN_SCORES.has(parsed)) return;

    setShortcuts((prev) => ({ ...prev, [group]: replaceAt(prev[group], index, parsed) }));
  };

  const resetShortcutDraft = (group: ShortcutGroup, index: number) => {
    setDrafts((prev) => ({ ...prev, [group]: replaceAt(prev[group], index, String(shortcuts[group][index])) }));
  };

  return {
    canCustomizeSideShortcuts,
    shortcutsLeft: shortcuts.left,
    shortcutsRight: shortcuts.right,
    shortcutsMobile: shortcuts.mobile,
    leftShortcutDrafts: drafts.left,
    rightShortcutDrafts: drafts.right,
    mobileShortcutDrafts: drafts.mobile,
    mobileShortcutsEnabled,
    toggleMobileShortcuts: () => setMobileShortcutsEnabled((enabled) => !enabled),
    handleShortcutDraftChange,
    resetShortcutDraft,
  };
}
