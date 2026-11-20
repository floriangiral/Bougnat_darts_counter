import React from 'react';
import { GameHeaderActions } from './GameHeaderActions';

export interface GameHeaderClock {
  /** Heure courante (« 21:04 »), affichée au-dessus du chronomètre quand le jeu la fournit. */
  time?: string;
  /** Durée de la partie (« 12:34 »). */
  elapsed: string;
}

export interface GameHeaderProps {
  /** Repère du jeu (data-game), pour les ajustements propres à un jeu dans games/<jeu>.css. */
  game: string;
  /** Pastille sous la marque : nom du jeu, format, cible, tour… (texte complet dès 640 px). */
  badge?: React.ReactNode;
  /** Variante courte de la pastille pour les téléphones étroits (sinon la pastille complète). */
  compactBadge?: React.ReactNode;
  clock?: GameHeaderClock;
  /** Indicateurs propres au jeu placés avant les boutons (tour, fléchettes du tour…). */
  indicators?: React.ReactNode;
  onExit: () => void;
  onStats?: () => void;
  onSettings?: () => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Bandeau d'en-tête unique des écrans de jeu (référence visuelle : en-tête X01) : marque et pastille à
 * gauche, heure et chronomètre au centre, actions à droite (Statistiques, Réglages, Quitter isolé).
 * Même hauteur, mêmes marges, même typographie dans tous les jeux ; tailles par recette dans game-controls.css.
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  badge,
  compactBadge,
  clock,
  indicators,
  onExit,
  onStats,
  onSettings,
  className = '',
  'data-testid': testId,
}) => (
  <div
    data-game={game}
    data-testid={testId}
    className={`bd-game-header laptop-compact-topbar relative z-20 flex shrink-0 items-center justify-between border-b border-border bg-surface ${className}`}
  >
    <div className="bd-game-header-brand flex min-w-0 flex-col gap-1">
      <div className="bd-game-header-title whitespace-nowrap font-black italic">
        <span className="text-fg">BOUGNAT</span> <span className="text-brand-fg">DARTS</span>
      </div>
      {badge && (
        <div className="bd-game-header-badge inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full border border-border-strong/80 bg-surface-glass font-black uppercase text-fg-muted shadow-raised backdrop-blur-md">
          {compactBadge ? (
            <>
              <span className="truncate sm:hidden">{compactBadge}</span>
              <span className="hidden truncate sm:inline">{badge}</span>
            </>
          ) : (
            <span className="truncate">{badge}</span>
          )}
        </div>
      )}
    </div>

    {clock && (
      <div className="bd-game-header-clock laptop-compact-timer flex flex-col items-center justify-center font-mono leading-none">
        {clock.time && <div className="bd-game-header-time text-fg-faint">{clock.time}</div>}
        <div role="timer" aria-label="Durée de la partie" className="bd-game-header-elapsed font-bold text-brand-fg">
          {clock.elapsed}
        </div>
      </div>
    )}

    <GameHeaderActions onExit={onExit} onStats={onStats} onSettings={onSettings}>
      {indicators}
    </GameHeaderActions>
  </div>
);
