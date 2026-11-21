import { useEffect } from 'react';

const KEYBOARD_THRESHOLD = 120;
// Android resizes the page asynchronously after entering or leaving fullscreen: measure again a bit later.
const FULLSCREEN_SETTLE_MS = 300;

/**
 * Visible height of the page, published as `--app-viewport-height` on the root element.
 * While pinch-zoomed the visual viewport shrinks, so the window height is used instead: the layout must
 * not shrink while zoomed. In fullscreen, `.game-screen` uses this height instead of `100dvh`, which
 * Chrome Android can leave taller than the visible area (last keypad row cut until the page is scrolled).
 */
export const getVisibleViewportHeight = (): number => {
  const visual = window.visualViewport;
  if (!visual || Math.abs(visual.scale - 1) > 0.01) return window.innerHeight;
  return visual.height;
};

export const useVisualViewport = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const root = document.documentElement;
    let settleTimer: number | undefined;
    const updateViewport = () => {
      const viewportHeight = getVisibleViewportHeight();
      const keyboardOpen = viewportHeight < window.innerHeight - KEYBOARD_THRESHOLD;
      root.style.setProperty('--app-viewport-height', `${viewportHeight}px`);
      root.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false';
    };
    const updateAfterFullscreenChange = () => {
      updateViewport();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(updateViewport, FULLSCREEN_SETTLE_MS);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    document.addEventListener('fullscreenchange', updateAfterFullscreenChange);

    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      document.removeEventListener('fullscreenchange', updateAfterFullscreenChange);
      root.style.removeProperty('--app-viewport-height');
      delete root.dataset.keyboardOpen;
    };
  }, []);
};
