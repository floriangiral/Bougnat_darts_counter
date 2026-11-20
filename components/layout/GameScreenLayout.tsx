import React from 'react';

// Spec 072 (V2-TAB-03) : structure à zones commune à tous les écrans de jeu. Le composant ne contient
// aucune règle de jeu (RM-01) : chaque vue remplit les zones, la CSS les place selon la recette
// (data-recipe, spec 070) — empilées en stack/stack-wide, joueurs | saisie en arena/phone-landscape.

export type GameScreenId = 'x01' | 'cricket' | 'capital' | 'killer' | 'gotcha' | 'triathlon';

type ZoneProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & Record<`data-${string}`, unknown>;

export interface GameScreenLayoutProps {
  game: GameScreenId;
  header: React.ReactNode;
  players: React.ReactNode;
  input: React.ReactNode;
  /** Bandeau optionnel sous l'en-tête (progression de phase du Triathlon…). */
  band?: React.ReactNode;
  /** Emplacement réservé à l'état de la voix (V2-VOICE-05), vide par défaut (FR-09). */
  voiceStatus?: React.ReactNode;
  /** Emplacement réservé au voyant de diffusion TV (V2-TV-04/06), vide par défaut (FR-09). */
  broadcastStatus?: React.ReactNode;
  /** Superpositions (modales, transitions) rendues dans l'écran. */
  children?: React.ReactNode;
  className?: string;
  headerProps?: ZoneProps;
  playersProps?: ZoneProps;
  inputProps?: ZoneProps;
}

export const GameScreenLayout: React.FC<GameScreenLayoutProps> = ({
  game,
  header,
  players,
  input,
  band,
  voiceStatus,
  broadcastStatus,
  children,
  className = '',
  headerProps,
  playersProps,
  inputProps,
}) => {
  const hasBand = Boolean(band || voiceStatus || broadcastStatus);
  return (
    <div className={`game-screen ${className}`} data-game={game} data-testid="game-screen">
      <div {...headerProps} data-zone="header">{header}</div>
      {hasBand && (
        <div data-zone="band" className="game-screen-band">
          {band}
          {voiceStatus && <div data-slot="voice-status">{voiceStatus}</div>}
          {broadcastStatus && <div data-slot="broadcast-status">{broadcastStatus}</div>}
        </div>
      )}
      <div {...playersProps} data-zone="players">{players}</div>
      <div {...inputProps} data-zone="input">{input}</div>
      {children}
    </div>
  );
};
