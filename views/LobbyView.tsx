import React, { useEffect, useState } from 'react';
import { ClipboardList, Flag, History, Home, Play, Swords, Trophy, UserRound, Users } from 'lucide-react';
import { LobbyHeader } from '../components/lobby/LobbyHeader';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { fetchLobbyData } from '../src/lib/lobbyData';
import type { LobbyData } from '../src/types/lobby';

interface LobbyViewProps {
  user: any;
  onBackHome: () => void;
  onCreateLobby: () => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onNewGame: () => void;
  onResumeGame: () => void;
  onJoinWithCode: () => void;
  onChallengeFriend: () => void;
  onOpenHistory: () => void;
  onOpenStats: () => void;
  onLogout: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  user,
  onBackHome,
  onCreateLobby,
  onOpenFriends,
  onOpenProfile,
  onNewGame,
  onResumeGame,
  onJoinWithCode,
  onChallengeFriend,
  onOpenHistory,
  onOpenStats,
  onLogout,
}) => {
  const [data, setData] = useState<LobbyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const featureBlocks = [
    { label: 'Nouvelle Partie', active: true, onClick: onNewGame, icon: Play },
    { label: 'Reprendre une partie', active: false, icon: ClipboardList },
    { label: 'Defier un ami', active: false, icon: Swords },
    { label: 'Creer un tournois', active: false, icon: Trophy },
    { label: 'Rejoindre un tournois', active: false, icon: Flag },
    { label: 'Mes statistiques', active: false, icon: ClipboardList },
    { label: 'Mes ami(e)s', active: false, icon: Users },
    { label: 'Mon Historique', active: false, icon: History },
  ];

  useEffect(() => {
    let cancelled = false;

    const loadLobby = async () => {
      setIsLoading(true);
      const nextData = await fetchLobbyData(user);
      if (!cancelled) {
        setData(nextData);
        setIsLoading(false);
      }
    };

    loadLobby();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <AppPageBackground>
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              <Home className="h-4 w-4" />
              Accueil
            </button>

            <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} variant="integrated" />
          </div>
        </div>

        {isLoading || !data ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="w-full rounded-[2rem] border border-white/10 bg-[#0b1119]/92 p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-all hover:border-orange-400/25 hover:bg-[#0d1520] md:col-span-2 xl:col-span-1"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="text-xl font-black uppercase tracking-[-0.03em] text-white">
                Ma Carte De Joueur
              </div>
            </div>
          </button>

          {featureBlocks.map((block) => (
            block.active ? (
              <button
                key={block.label}
                type="button"
                onClick={block.onClick}
                className="rounded-[2rem] border border-white/10 bg-[#0b1119]/92 p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all hover:border-orange-400/25 hover:bg-[#0d1520]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                    <block.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xl font-black uppercase tracking-[-0.03em] text-white">
                    {block.label}
                  </div>
                </div>
              </button>
            ) : (
              <div
                key={block.label}
                className="rounded-[2rem] border border-white/8 bg-[#0a1018] p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.22)] opacity-80"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-gray-400 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                    <block.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xl font-black uppercase tracking-[-0.03em] text-white">
                    {block.label}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
        )}

        {data && isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl">
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  Fermer
                </button>
              </div>
              <LobbyHeader profile={data.profile} stats={data.stats} />
            </div>
          </div>
        )}
    </AppPageBackground>
  );
};
