import { useEffect } from 'react';

const KEYBOARD_THRESHOLD = 120;

export const useVisualViewport = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const root = document.documentElement;
    const updateViewport = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const keyboardOpen = viewportHeight < window.innerHeight - KEYBOARD_THRESHOLD;
      root.style.setProperty('--app-viewport-height', `${viewportHeight}px`);
      root.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false';
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      root.style.removeProperty('--app-viewport-height');
      delete root.dataset.keyboardOpen;
    };
  }, []);
};
