import { useCallback, useState } from 'react';
import {
  ORIENTATION_HINT_DISMISS_KEY,
  resolveOrientationHint,
  type OrientationHint,
} from '../features/layout/orientationHint';
import type { ViewportClass } from '../features/layout/viewportClass';

interface UseGameOrientationInput {
  viewport: ViewportClass;
  isGameScreen: boolean;
  /** Identifiant de la partie en cours : « Continuer en paysage » ne vaut que pour elle. */
  gameId: string | null;
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

// Spec 028 : invite non bloquante sur téléphone en paysage, écrans de jeu seulement ; aucun verrou.
export const useGameOrientation = ({
  viewport,
  isGameScreen,
  gameId,
}: UseGameOrientationInput): { hint: OrientationHint; dismiss: () => void } => {
  const [dismissedGameId, setDismissedGameId] = useState<string | null>(readDismissedGameId);

  const dismiss = useCallback(() => {
    if (!gameId) return;
    writeDismissedGameId(gameId);
    setDismissedGameId(gameId);
  }, [gameId]);

  const hint = resolveOrientationHint({
    viewport,
    isGameScreen,
    dismissed: gameId !== null && dismissedGameId === gameId,
  });

  return { hint, dismiss };
};
