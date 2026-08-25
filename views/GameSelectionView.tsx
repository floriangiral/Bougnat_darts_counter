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
      accent: 'from-orange-500 via-red-500 to-orange-600',
      arrow: 'border-orange-300/50 bg-orange-500/20 text-orange-300 group-hover:bg-orange-500/30',
      chip: 'Most Played',
      icon: Target,
      active: true,
    },
    {
      id: 'TRIATHLON',
      title: 'Triathlon',
      accent: 'from-yellow-400 via-amber-500 to-orange-500',
      arrow: 'border-yellow-300/50 bg-yellow-500/20 text-yellow-300 group-hover:bg-yellow-500/30',
      chip: 'Endgame',
      icon: Trophy,
      active: true,
    },
    {
      id: 'CRICKET',
      title: 'Cricket',
      accent: 'from-emerald-500 via-green-500 to-lime-500',
      arrow: 'border-emerald-300/50 bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30',
      chip: 'Head-to-head',
      icon: Crosshair,
      active: true,
    },
    {
      id: 'CAPITAL',
      title: 'Capital',
      accent: 'from-violet-500 via-purple-500 to-fuchsia-500',
      arrow: 'border-violet-300/50 bg-violet-500/20 text-violet-300 group-hover:bg-violet-500/30',
      chip: 'Party Mode',
      icon: Crown,
      active: true,
    },
    {
      id: 'GOTCHA',
      title: 'Gotcha',
      accent: 'from-cyan-500 via-sky-500 to-blue-500',
      arrow: 'border-cyan-300/50 bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/30',
      chip: 'Score exact',
      icon: RotateCcw,
      active: true,
    },
    {
      id: 'KILLER',
      title: 'Killer',
      accent: 'from-rose-600 via-red-600 to-pink-600',
      arrow: 'border-rose-300/50 bg-rose-500/20 text-rose-300 group-hover:bg-rose-500/30',
      chip: 'Survie',
      icon: Skull,
      active: true,
    },
  ];

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#06080d] text-white sm:min-h-screen sm:h-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_30%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-4 py-4 sm:min-h-screen sm:h-auto sm:px-6 sm:py-10">
        <div className="mb-4 flex shrink-0 flex-col gap-4 sm:mb-8 sm:gap-6 lg:mb-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
              >
                <Home className="h-4 w-4" />
                Accueil
              </button>
            </div>

          </div>

        </div>

        <div className="mb-4 flex shrink-0 justify-center sm:mb-8">
          <div className="relative flex flex-col items-center">
            <div className="absolute -left-4 top-1 h-12 w-12 rounded-full bg-orange-500/20 blur-2xl" />
            <div className="relative flex flex-col items-center leading-none">
              <h1 className="legacy-selection-logo-top whitespace-nowrap text-[clamp(1.9rem,9vw,3rem)] font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.75)] transform -skew-x-6">
                BOUGNAT
              </h1>
              <h2 className="legacy-selection-logo-bottom mt-0.5 whitespace-nowrap pb-1 text-[clamp(1.6rem,7.5vw,2.5rem)] leading-[0.95] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 tracking-tight transform -skew-x-12 drop-shadow-[0_0_18px_rgba(234,88,12,0.5)]">
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
                  key={game.id}
                  data-testid={`game-card-${game.id.toLowerCase()}`}
                  onClick={() => game.active && onSelect(game.id)}
                  className={`group relative h-full min-h-0 overflow-hidden rounded-[1.75rem] border p-4 text-left transition-all duration-300 sm:h-auto sm:p-6 ${
                    game.active
                      ? 'border-white/10 bg-white/[0.045] shadow-[0_18px_50px_rgba(0,0,0,0.28)] hover:-translate-y-1 hover:border-orange-400/35 hover:bg-white/[0.065]'
                      : 'cursor-not-allowed border-white/6 bg-white/[0.025] opacity-60'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-0 transition-opacity duration-300 ${game.active ? 'group-hover:opacity-[0.14]' : ''}`} />
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

                  <div className="relative z-10 flex h-full items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center justify-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accent} text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] sm:h-14 sm:w-14`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="truncate text-2xl font-black uppercase tracking-[-0.02em] text-white sm:text-3xl">
                        {game.title}
                      </h3>
                    </div>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 sm:h-10 sm:w-10 ${
                      game.active
                        ? `${game.arrow} group-hover:translate-x-1`
                        : 'border-white/10 bg-white/5 text-gray-600'
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
