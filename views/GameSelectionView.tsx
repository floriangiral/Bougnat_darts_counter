import React from 'react';
import { ArrowRight, Crown, Crosshair, Home, RotateCcw, Skull, Target, Trophy } from 'lucide-react';
import type { GameType } from '../utils/arenaFlow';

interface GameSelectionViewProps {
  onSelect: (type: GameType) => void;
  onBack: () => void;
}

type GameCard = {
  id: GameType;
  title: string;
  accent: string;
  arrow: string;
  chip: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  showChip?: boolean;
};

const GAME_DISPLAY_ORDER: Record<GameType, number> = {
  X01: 0,
  TRIATHLON: 1,
  CRICKET: 2,
  CAPITAL: 3,
  GOTCHA: 4,
  KILLER: 5,
};

export const GameSelectionView: React.FC<GameSelectionViewProps> = ({
  onSelect,
  onBack,
}) => {
  const games: GameCard[] = [
    {
      id: 'X01',
      title: 'Match X01',
      accent: 'from-game-x01-a via-game-x01-b to-game-x01-c',
      arrow: 'border-game-x01-fg/50 bg-game-x01-a/20 text-game-x01-fg group-hover:bg-game-x01-a/30',
      chip: 'Most Played',
      icon: Target,
      active: true,
    },
    {
      id: 'TRIATHLON',
      title: 'Triathlon',
      accent: 'from-game-triathlon-a via-game-triathlon-b to-game-triathlon-c',
      arrow: 'border-game-triathlon-fg/50 bg-game-triathlon-a/20 text-game-triathlon-fg group-hover:bg-game-triathlon-a/30',
      chip: 'Endgame',
      icon: Trophy,
      active: true,
    },
    {
      id: 'CRICKET',
      title: 'Cricket',
      accent: 'from-game-cricket-a via-game-cricket-b to-game-cricket-c',
      arrow: 'border-game-cricket-fg/50 bg-game-cricket-a/20 text-game-cricket-fg group-hover:bg-game-cricket-a/30',
      chip: 'Head-to-head',
      icon: Crosshair,
      active: true,
    },
    {
      id: 'CAPITAL',
      title: 'Capital',
      accent: 'from-game-capital-a via-game-capital-b to-game-capital-c',
      arrow: 'border-game-capital-fg/50 bg-game-capital-a/20 text-game-capital-fg group-hover:bg-game-capital-a/30',
      chip: 'Party Mode',
      icon: Crown,
      active: true,
    },
    {
      id: 'GOTCHA',
      title: 'Gotcha',
      accent: 'from-game-gotcha-a via-game-gotcha-b to-game-gotcha-c',
      arrow: 'border-game-gotcha-fg/50 bg-game-gotcha-a/20 text-game-gotcha-fg group-hover:bg-game-gotcha-a/30',
      chip: 'Score exact',
      icon: RotateCcw,
      active: true,
    },
    {
      id: 'KILLER',
      title: 'Killer',
      accent: 'from-game-killer-a via-game-killer-b to-game-killer-c',
      arrow: 'border-game-killer-fg/50 bg-game-killer-a/20 text-game-killer-fg group-hover:bg-game-killer-a/30',
      chip: 'Survie',
      icon: Skull,
      active: true,
    },
  ];

  return (
    <div className="h-[100dvh] overflow-hidden bg-canvas text-fg sm:min-h-screen sm:h-auto">
      <div className="pointer-events-none absolute inset-0 bg-ambient" />
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(var(--bd-surface-tint)_1px,transparent_1px),linear-gradient(90deg,var(--bd-surface-tint)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-4 py-4 sm:min-h-screen sm:h-auto sm:px-6 sm:py-10">
        <div className="mb-4 flex shrink-0 flex-col gap-4 sm:mb-8 sm:gap-6 lg:mb-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="bd-touch-target inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-tint px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-fg-muted transition-all hover:border-brand-border hover:bg-surface-tint-strong hover:text-fg"
              >
                <Home className="h-4 w-4" />
                Accueil
              </button>
            </div>

          </div>

        </div>

        <div className="mb-4 flex shrink-0 justify-center sm:mb-8">
          <div className="relative flex flex-col items-center">
            <div className="absolute -left-4 top-1 h-12 w-12 rounded-full bg-brand-muted blur-2xl" />
            <div className="relative flex flex-col items-center leading-none">
              <h1 className="legacy-selection-logo-top whitespace-nowrap text-[clamp(1.9rem,9vw,3rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-fg via-fg to-fg-muted drop-shadow-text transform -skew-x-6">
                BOUGNAT
              </h1>
              <h2 className="legacy-selection-logo-bottom mt-0.5 whitespace-nowrap pb-1 text-[clamp(1.6rem,7.5vw,2.5rem)] leading-[0.95] font-black text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-2 to-brand-strong tracking-tight transform -skew-x-12 drop-shadow-glow-brand">
                DARTS
              </h2>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 sm:flex-none">
          <div className="grid h-full auto-rows-fr grid-cols-1 gap-3 sm:h-auto sm:auto-rows-auto sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...games].sort((a, b) => GAME_DISPLAY_ORDER[a.id] - GAME_DISPLAY_ORDER[b.id]).map((game) => {
              const Icon = game.icon;

              return (
                <button
                  type="button"
                  key={game.id}
                  data-game={game.id.toLowerCase()}
                  data-testid={`game-card-${game.id.toLowerCase()}`}
                  onClick={() => game.active && onSelect(game.id)}
                  className={`group relative h-full min-h-0 overflow-hidden rounded-[1.75rem] border p-4 text-left transition-all duration-300 sm:h-auto sm:p-6 ${
                    game.active
                      ? 'border-border-subtle bg-surface-tint shadow-panel hover:-translate-y-1 hover:border-brand-border hover:bg-surface-tint-strong'
                      : 'cursor-not-allowed border-border-subtle bg-surface-tint opacity-60'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-0 transition-opacity duration-300 ${game.active ? 'group-hover:opacity-[0.14]' : ''}`} />
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-surface-tint blur-3xl" />

                  <div className="relative z-10 flex h-full items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center justify-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accent} text-on-game shadow-raised sm:h-14 sm:w-14`}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="truncate text-2xl font-black uppercase tracking-[-0.02em] text-fg sm:text-3xl">
                        {game.title}
                      </h3>
                    </div>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 sm:h-10 sm:w-10 ${
                      game.active
                        ? `${game.arrow} group-hover:translate-x-1`
                        : 'border-border-subtle bg-surface-tint text-fg-disabled'
                    }`}>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
