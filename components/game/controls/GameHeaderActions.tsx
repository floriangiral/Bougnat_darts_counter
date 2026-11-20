import React from 'react';
import { GameActionButton } from './GameActionButton';

export interface GameHeaderActionsProps {
  /** Demande de sortie : ouvre ConfirmExitDialog (voir useExitConfirmation), jamais une sortie directe. */
  onExit: () => void;
  onStats?: () => void;
  onSettings?: () => void;
  /** Indicateurs propres au jeu (tour, fléchettes du tour…) placés avant les boutons. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Groupe d'actions d'en-tête commun à tous les jeux, toujours à droite de l'en-tête et dans cet ordre :
 * indicateurs du jeu, Statistiques, Réglages, puis Quitter isolé (séparé par un espace plus large).
 */
export const GameHeaderActions: React.FC<GameHeaderActionsProps> = ({ onExit, onStats, onSettings, children, className = '' }) => (
  <div role="group" aria-label="Actions de la partie" className={`bd-game-header-actions flex shrink-0 items-center ${className}`}>
    {children}
    {onStats && <GameActionButton action="stats" display="icon" onClick={onStats} />}
    {onSettings && <GameActionButton action="settings" display="icon" onClick={onSettings} />}
    <GameActionButton action="exit" display="icon" onClick={onExit} className="bd-game-header-exit" />
  </div>
);
