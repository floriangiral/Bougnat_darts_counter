import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrientationPort } from '../application/orientation/orientationPort';
import {
  ORIENTATION_HINT_DISMISS_KEY,
  resolveOrientationHint,
  shouldLockLandscape,
  type OrientationHint,
} from '../features/layout/orientationHint';
import type { ViewportClass } from '../features/layout/viewportClass';
import {
  createWebOrientationPort,
  isDocumentFullscreen,
  isMultitaskingWindow,
} from '../infrastructure/web/screenOrientation';

interface UseGameOrientationInput {
  viewport: ViewportClass;
  isGameScreen: boolean;
  /** Identifiant de la partie en cours : « Continuer » ne vaut que pour elle (RM-02). */
  gameId: string | null;
  port?: OrientationPort;
}

const readDismissedGameId = (): string | null => {
  try {
    return window.sessionStorage.getItem(ORIENTATION_HINT_DISMISS_KEY);
  } catch {
    return null;
  }
};

const writeDismissedGameId = (gameId: string) => {
  try {
    window.sessionStorage.setItem(ORIENTATION_HINT_DISMISS_KEY, gameId);
  } catch {
    // Stockage indisponible : l'invite reste masquée jusqu'au prochain rechargement.
  }
};

// Specs 073 et 028 : verrou paysage Android après le plein écran (tablette), libéré en sortie de
// partie ; ailleurs, invite non bloquante limitée aux écrans de jeu.
export const useGameOrientation = ({
  viewport,
  isGameScreen,
  gameId,
  port,
}: UseGameOrientationInput): { hint: OrientationHint; dismiss: () => void } => {
  const orientationPort = useMemo(() => port ?? createWebOrientationPort(), [port]);
  const lockedRef = useRef(false);
  const [dismissedGameId, setDismissedGameId] = useState<string | null>(readDismissedGameId);
  const wantsLock = shouldLockLandscape(viewport, isGameScreen);

  useEffect(() => {
    if (!wantsLock) return undefined;

    const tryLock = () => {
      if (!isDocumentFullscreen() || lockedRef.current) return;
      void orientationPort.lock('landscape').then((locked) => {
        lockedRef.current = locked;
      });
    };
    const handleFullscreenChange = () => {
      if (isDocumentFullscreen()) {
        tryLock();
      } else {
        // La plateforme libère le verrou en quittant le plein écran.
        lockedRef.current = false;
      }
    };

    tryLock();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [orientationPort, wantsLock]);

  useEffect(() => {
    if (isGameScreen || !lockedRef.current) return;
    orientationPort.unlock();
    lockedRef.current = false;
  }, [isGameScreen, orientationPort]);

  useEffect(() => () => {
    if (lockedRef.current) orientationPort.unlock();
  }, [orientationPort]);

  const dismiss = useCallback(() => {
    if (!gameId) return;
    writeDismissedGameId(gameId);
    setDismissedGameId(gameId);
  }, [gameId]);

  const hint = resolveOrientationHint({
    viewport,
    isGameScreen,
    isMultitasking: isMultitaskingWindow(),
    dismissed: gameId !== null && dismissedGameId === gameId,
  });

  return { hint, dismiss };
};
