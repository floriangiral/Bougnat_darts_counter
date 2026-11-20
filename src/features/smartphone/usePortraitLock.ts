import { useEffect } from 'react';

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'portrait') => Promise<void>;
};

/**
 * Best-effort portrait lock for phones. Browsers only honor it for an installed app
 * (standalone PWA) or in fullscreen, mostly on Android; iOS ignores it. Elsewhere the
 * rotate overlay (RotateToPortraitOverlay) is what keeps the app usable.
 */
export const usePortraitLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled || typeof screen === 'undefined') return;
    const orientation = screen.orientation as LockableOrientation | undefined;
    orientation?.lock?.('portrait').catch(() => {
      // Not allowed in this context (regular browser tab, iOS…): the overlay takes over.
    });
  }, [enabled]);
};
