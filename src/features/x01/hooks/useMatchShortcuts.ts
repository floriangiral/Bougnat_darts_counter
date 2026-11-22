// Customizable quick-score shortcuts for the match keypad.
// Tablet/PC show two side columns (left/right); phones show one row above the keypad (mobile),
// which can be switched off in the match settings. Spec 129: values and the phone bar switch are
// device preferences shared with the Réglages screen (src/features/settings).
import { useEffect, useState } from 'react';
import { useCounterSettings } from '../../../app/useCounterSettings';
import { updateX01Settings } from '../../settings/counterSettings';
import { useShortcutDrafts } from '../../settings/useShortcutDrafts';

export type { ShortcutGroup } from '../../settings/counterSettings';

export function useMatchShortcuts() {
  const [canCustomizeSideShortcuts, setCanCustomizeSideShortcuts] = useState(
    () => window.innerWidth >= 768,
  );
  const [settings, updateSettings] = useCounterSettings();
  const { shortcuts, drafts, handleShortcutDraftChange, commitShortcutDraft } = useShortcutDrafts();

  useEffect(() => {
    const syncLayoutMode = () => setCanCustomizeSideShortcuts(window.innerWidth >= 768);
    syncLayoutMode();
    window.addEventListener('resize', syncLayoutMode);
    return () => window.removeEventListener('resize', syncLayoutMode);
  }, []);

  return {
    canCustomizeSideShortcuts,
    shortcutsLeft: shortcuts.left,
    shortcutsRight: shortcuts.right,
    shortcutsMobile: shortcuts.mobile,
    leftShortcutDrafts: drafts.left,
    rightShortcutDrafts: drafts.right,
    mobileShortcutDrafts: drafts.mobile,
    mobileShortcutsEnabled: settings.x01.mobileShortcutsBar,
    toggleMobileShortcuts: () => updateSettings((current) =>
      updateX01Settings(current, { mobileShortcutsBar: !current.x01.mobileShortcutsBar })),
    handleShortcutDraftChange,
    commitShortcutDraft,
  };
}
