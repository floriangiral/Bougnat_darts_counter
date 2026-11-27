import { useEffect, useRef } from 'react';

import type { GameType } from '../../utils/arenaFlow';
import { enterFullScreen, exitFullScreen } from '../../utils/uiUtils';

import { appScreenPath } from './appScreenPath';
import { AppScreen, isAppScreen, isFullscreenScreen } from './appShell';

const historyStateWithScreen = (screen: AppScreen): Record<string, unknown> => {
  const current: unknown = window.history.state;
  return { ...(typeof current === 'object' && current !== null ? current : {}), appScreen: screen };
};

// Spec 135: the query string (spec 030 link, ?mode=, ?source=pwa) and the fragment are kept.
const urlForPath = (path: string) => `${path}${window.location.search}${window.location.hash}`;

export const useAppScreenHistory = (
  screen: AppScreen,
  setScreen: (screen: AppScreen) => void,
  selectedGameType: GameType,
) => {
  const screenRef = useRef<AppScreen>(screen);
  const lastPushedScreenRef = useRef<AppScreen>(screen);
  const skipNextHistoryPushRef = useRef(false);
  // Spec 135: each history entry carries the path of its screen, which the analytics beacon reads.
  const path = appScreenPath(screen, selectedGameType);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    window.history.replaceState(historyStateWithScreen(screen), document.title, urlForPath(path));

    const handlePopState = (event: PopStateEvent) => {
      const state: unknown = event.state;
      const nextScreen = typeof state === 'object' && state !== null && 'appScreen' in state
        ? state.appScreen
        : undefined;

      if (!isAppScreen(nextScreen) || nextScreen === screenRef.current) {
        return;
      }

      if (isFullscreenScreen(screenRef.current) && !isFullscreenScreen(nextScreen)) {
        exitFullScreen();
      }

      if (!isFullscreenScreen(screenRef.current) && isFullscreenScreen(nextScreen)) {
        enterFullScreen();
      }

      skipNextHistoryPushRef.current = true;
      lastPushedScreenRef.current = nextScreen;
      setScreen(nextScreen);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screen, path, setScreen]);

  useEffect(() => {
    if (skipNextHistoryPushRef.current) {
      skipNextHistoryPushRef.current = false;
      return;
    }

    if (lastPushedScreenRef.current === screen) {
      window.history.replaceState(historyStateWithScreen(screen), document.title, urlForPath(path));
      return;
    }

    window.history.pushState(historyStateWithScreen(screen), document.title, urlForPath(path));
    lastPushedScreenRef.current = screen;
  }, [screen, path]);
};
