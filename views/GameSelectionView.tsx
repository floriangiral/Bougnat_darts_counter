import React, { useId } from 'react';
import { Clock3, Crown, Crosshair, Home, RotateCcw, Skull, Target, Trophy, Users } from 'lucide-react';
import type { GameType } from '../utils/arenaFlow';
import { getSetupPlayerCountOptions } from '../src/features/game-setup/setupViewModel';
import { FitText } from '../components/ui/FitText';

interface GameSelectionViewProps {
  onSelect: (type: GameType) => void;
  onBack: () => void;
}

type GameIcon = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

type GameCardDefinition = {
  id: GameType;
  title: string;
  /** Phrase courte (une ligne sur téléphone), vérifiée contre les règles du jeu. */
  tagline: string;
  icon: GameIcon;
  /** Premier jeu : occupe toute la largeur de la grille à 2 ou 3 colonnes, même disposition que les autres. */
  featured?: boolean;
};

/** X01 en tête, puis l'ordre historique de la grille ; le 180 Around the Clock ferme la marche. */
const GAMES: readonly GameCardDefinition[] = [
  { id: 'X01', title: 'Match X01', tagline: '301, 501, 701 ou sur mesure', icon: Target, featured: true },
  { id: 'TRIATHLON', title: 'Triathlon', tagline: 'Capital, Cricket puis 501', icon: Trophy },
  { id: 'CRICKET', title: 'Cricket', tagline: 'Fermez du 15 au 20 et le Bull', icon: Crosshair },
  { id: 'CAPITAL', title: 'Capital', tagline: 'Un objectif imposé par tour', icon: Crown },
  { id: 'GOTCHA', title: 'Gotcha', tagline: 'Atteignez pile le score cible', icon: RotateCcw },
  { id: 'KILLER', title: 'Killer', tagline: 'Trois vies, un seul survivant', icon: Skull },
  { id: 'ATC180', title: '180 Around the Clock', tagline: 'Du 1 au 20, visez le 180', icon: Clock3 },
];

/** Fourchette affichée d'après les choix réellement proposés par la configuration du jeu. */
const formatPlayerRange = (counts: readonly number[]): string => {
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  if (min === max) return `${min} joueur${min > 1 ? 's' : ''}`;
  return max - min === 1 ? `${min} ou ${max} joueurs` : `${min} à ${max} joueurs`;
};

const GameCard: React.FC<{ game: GameCardDefinition; onSelect: (type: GameType) => void }> = ({ game, onSelect }) => {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const textId = `${baseId}-text`;
  const tagsId = `${baseId}-tags`;
  const Icon = game.icon;
  const slug = game.id.toLowerCase();

  return (
    <button
      type="button"
      data-game={slug}
      data-featured={game.featured ? 'true' : undefined}
      data-testid={`game-card-${slug}`}
      aria-labelledby={titleId}
      aria-describedby={`${textId} ${tagsId}`}
      onClick={() => onSelect(game.id)}
      className="game-card"
    >
      <Icon className="game-card-watermark" aria-hidden />
      <span className="game-card-medal">
        <Icon className="game-card-medal-glyph" aria-hidden />
      </span>
      <FitText as="h3" id={titleId} className="game-card-title">{game.title}</FitText>
      <span id={textId} className="game-card-text">{game.tagline}</span>
      <span id={tagsId} className="game-card-tags">
        <span className="game-card-tag" data-tag="players">
          <Users className="game-card-tag-glyph" aria-hidden />
          {formatPlayerRange(getSetupPlayerCountOptions(game.id))}
        </span>
      </span>
    </button>
  );
};

export const GameSelectionView: React.FC<GameSelectionViewProps> = ({
  onSelect,
  onBack,
}) => (
  <div className="selection-page bg-canvas text-fg">
    <div className="pointer-events-none absolute inset-0 bg-ambient" />
    <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(var(--bd-surface-tint)_1px,transparent_1px),linear-gradient(90deg,var(--bd-surface-tint)_1px,transparent_1px)] [background-size:30px_30px]" />

    <div className="selection-shell">
      <header className="selection-header">
        <button
          type="button"
          onClick={onBack}
          className="selection-back bd-touch-target inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-tint px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-fg-muted transition-all hover:border-brand-border hover:bg-surface-tint-strong hover:text-fg"
        >
          <Home className="selection-back-icon h-4 w-4" aria-hidden />
          Accueil
        </button>

        <div className="selection-logo relative flex flex-col items-center leading-none">
          <div className="absolute -left-4 top-1 h-12 w-12 rounded-full bg-brand-muted blur-2xl" />
          <h1 className="legacy-selection-logo-top selection-logo-top relative whitespace-nowrap text-[clamp(1.75rem,8vw,2.75rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-fg via-fg to-fg-muted drop-shadow-text transform -skew-x-6">
            BOUGNAT
          </h1>
          <h2 className="legacy-selection-logo-bottom selection-logo-bottom relative mt-0.5 whitespace-nowrap pb-1 text-[clamp(1.5rem,6.75vw,2.25rem)] leading-[0.95] font-black text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-2 to-brand-strong tracking-tight transform -skew-x-12 drop-shadow-glow-brand">
            DARTS
          </h2>
        </div>
      </header>

      <p className="selection-kicker">Choisissez votre jeu</p>

      <div className="selection-games">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} onSelect={onSelect} />
        ))}
      </div>
    </div>
  </div>
);
