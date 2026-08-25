import { useEffect, useRef } from 'react';

import { enterFullScreen, exitFullScreen } from '../../utils/uiUtils';

import { AppScreen, isAppScreen, isFullscreenScreen } from './appShell';

export const useAppScreenHistory = (
  screen: AppScreen,
  setScreen: (screen: AppScreen) => void,
) => {
  const screenRef = useRef<AppScreen>(screen);
  const lastPushedScreenRef = useRef<AppScreen>(screen);
  const skipNextHistoryPushRef = useRef(false);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    window.history.replaceState(
      {
        ...window.history.state,
        appScreen: screen,
      },
      document.title,
    );

    const handlePopState = (event: PopStateEvent) => {
      const nextScreen = event.state?.appScreen;

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
  }, [screen, setScreen]);

  useEffect(() => {
    if (skipNextHistoryPushRef.current) {
      skipNextHistoryPushRef.current = false;
      return;
    }

    if (lastPushedScreenRef.current === screen) {
      window.history.replaceState(
        {
          ...window.history.state,
          appScreen: screen,
        },
        document.title,
      );
      return;
    }

    window.history.pushState(
      {
        ...window.history.state,
        appScreen: screen,
      },
      document.title,
    );
    lastPushedScreenRef.current = screen;
  }, [screen]);
};
