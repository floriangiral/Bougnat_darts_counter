import React from 'react';
import { GameHeader } from '../game/controls';
import { formatDuration } from '../../src/application/scoring/matchLifecycle';

interface TriathlonGameHeaderProps {
  currentTime: string;
  elapsedSeconds: number;
  onShowStats: () => void;
  onShowExitConfirm: () => void;
}

/** En-tête des écrans de transition du Triathlon : bandeau commun à tous les jeux (GameHeader). */
export const TriathlonGameHeader: React.FC<TriathlonGameHeaderProps> = ({
  currentTime,
  elapsedSeconds,
  onShowStats,
  onShowExitConfirm,
}) => (
  <GameHeader
    game="triathlon"
    badge="Triathlon"
    clock={{ time: currentTime, elapsed: formatDuration(elapsedSeconds) }}
    onStats={onShowStats}
    onExit={onShowExitConfirm}
  />
);
