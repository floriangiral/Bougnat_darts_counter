// Customizable quick-score shortcuts for the match keypad.
// Manages shortcut values, draft strings, responsive layout mode, and edit handlers.
import { useEffect, useState } from 'react';
import { POSSIBLE_TURN_SCORES } from '../scoring/possibleTurnScores';

const DEFAULT_SHORTCUTS_LEFT: number[] = [41, 45, 60, 100];
const DEFAULT_SHORTCUTS_RIGHT: number[] = [26, 81, 85, 140];

export function useMatchShortcuts() {
  const [canCustomizeSideShortcuts, setCanCustomizeSideShortcuts] = useState(
    () => window.innerWidth >= 768,
  );
  const [shortcutsLeft, setShortcutsLeft] = useState<number[]>(DEFAULT_SHORTCUTS_LEFT);
  const [shortcutsRight, setShortcutsRight] = useState<number[]>(DEFAULT_SHORTCUTS_RIGHT);
  const [leftShortcutDrafts, setLeftShortcutDrafts] = useState<string[]>(
    DEFAULT_SHORTCUTS_LEFT.map(String),
  );
  const [rightShortcutDrafts, setRightShortcutDrafts] = useState<string[]>(
    DEFAULT_SHORTCUTS_RIGHT.map(String),
  );

  useEffect(() => {
    const syncLayoutMode = () => setCanCustomizeSideShortcuts(window.innerWidth >= 768);
    syncLayoutMode();
    window.addEventListener('resize', syncLayoutMode);
    return () => window.removeEventListener('resize', syncLayoutMode);
  }, []);

  useEffect(() => {
    setLeftShortcutDrafts(shortcutsLeft.map(String));
  }, [shortcutsLeft]);

  useEffect(() => {
    setRightShortcutDrafts(shortcutsRight.map(String));
  }, [shortcutsRight]);

  const handleShortcutDraftChange = (side: 'left' | 'right', index: number, value: string) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 3);
    const setDrafts = side === 'left' ? setLeftShortcutDrafts : setRightShortcutDrafts;

    setDrafts((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? sanitizedValue : entry)));

    if (!sanitizedValue) return;

    const parsed = parseInt(sanitizedValue, 10);
    if (Number.isNaN(parsed) || parsed > 180 || !POSSIBLE_TURN_SCORES.has(parsed)) return;

    const setShortcuts = side === 'left' ? setShortcutsLeft : setShortcutsRight;
    setShortcuts((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? parsed : entry)));
  };

  const resetShortcutDraft = (side: 'left' | 'right', index: number) => {
    const source = side === 'left' ? shortcutsLeft : shortcutsRight;
    const setDrafts = side === 'left' ? setLeftShortcutDrafts : setRightShortcutDrafts;
    setDrafts((prev) =>
      prev.map((entry, entryIndex) => (entryIndex === index ? String(source[index]) : entry)),
    );
  };

  return {
    canCustomizeSideShortcuts,
    shortcutsLeft,
    shortcutsRight,
    leftShortcutDrafts,
    rightShortcutDrafts,
    handleShortcutDraftChange,
    resetShortcutDraft,
  };
}
