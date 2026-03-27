import React from 'react';
import { ChevronRight, Crown, Crosshair, Gauge, Home, Target, Trophy } from 'lucide-react';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';

export type GameType = 'X01' | 'X01_501_BO5' | 'CRICKET' | 'CAPITAL' | 'TRIATHLON';

interface GameSelectionViewProps {
  onSelect: (type: GameType) => void;
  onBack: () => void;
  onLobbyShortcut: () => void;
  onAuthShortcut?: () => void;
  showAuthShortcut?: boolean;
  user?: any;
  onUserMenu?: () => void;
  onLogout?: () => void;
}

type GameCard = {
  id: GameType;
  title: string;
  accent: string;
  chip: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  showChip?: boolean;
};

export const GameSelectionView: React.FC<GameSelectionViewProps> = ({
  onSelect,
  onBack,
  onLobbyShortcut,
  onAuthShortcut,
  showAuthShortcut = false,
  user,
  onUserMenu,
  onLogout,
}) => {
  const games: GameCard[] = [
    {
      id: 'X01_501_BO5',
      title: '501 Double Out',
      accent: 'from-orange-500 via-red-500 to-rose-500',
      chip: 'Best of 5',
      icon: Target,
      active: true,
      showChip: true,
    },
    {
      id: 'TRIATHLON',
      title: 'Le Triathlon',
      accent: 'from-yellow-400 via-amber-500 to-orange-500',
      chip: 'Endgame',
      icon: Trophy,
      active: true,
    },
    {
      id: 'X01',
      title: 'Match X01',
      accent: 'from-orange-500 via-red-500 to-orange-600',
      chip: 'Most Played',
      icon: Target,
      active: true,
    },
    {
      id: 'CRICKET',
      title: 'Cricket',
      accent: 'from-emerald-500 via-green-500 to-lime-500',
      chip: 'Head-to-head',
      icon: Crosshair,
      active: true,
    },
    {
      id: 'CAPITAL',
      title: 'Capital',
      accent: 'from-red-500 via-orange-500 to-yellow-500',
      chip: 'Party Mode',
      icon: Crown,
      active: true,
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_30%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
              >
                <Home className="h-4 w-4" />
                Accueil
              </button>

              {user && onUserMenu && (
                <MenuUserBadge user={user} onClick={onUserMenu} onLogout={onLogout} variant="integrated" />
              )}
            </div>

          </div>

          {!user && showAuthShortcut && onAuthShortcut && (
            <button
              onClick={onAuthShortcut}
              className="inline-flex self-start items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left backdrop-blur-sm transition-all hover:border-orange-400/30 hover:bg-white/[0.07] lg:min-w-[210px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300">
                <span className="text-sm font-black uppercase">ID</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Compte</p>
                <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-white">Connexion / Inscription</p>
              </div>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => {
            const Icon = game.icon;

            return (
              <button
                key={game.id}
                onClick={() => game.active && onSelect(game.id)}
                className={`group relative overflow-hidden rounded-[1.75rem] border p-5 text-left transition-all duration-300 sm:p-6 ${
                  game.active
                    ? 'border-white/10 bg-white/[0.045] shadow-[0_18px_50px_rgba(0,0,0,0.28)] hover:-translate-y-1 hover:border-orange-400/35 hover:bg-white/[0.065]'
                    : 'cursor-not-allowed border-white/6 bg-white/[0.025] opacity-60'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-0 transition-opacity duration-300 ${game.active ? 'group-hover:opacity-[0.14]' : ''}`} />
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex max-w-[46%] flex-col items-end gap-2 sm:max-w-none">
                      {game.showChip && (
                        <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">
                          {game.chip}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accent} text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] sm:h-14 sm:w-14`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
                        {game.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-gray-500">
                      <Gauge className="h-4 w-4" />
                      {game.active ? 'Pret A Lancer' : 'Indisponible'}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white">
                      {game.active ? 'Jouer' : 'Bientot'}
                      <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
