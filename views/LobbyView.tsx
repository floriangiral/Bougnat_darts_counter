import React, { useEffect, useState } from 'react';
import { Home, Swords, Users } from 'lucide-react';
import { LobbyHeader } from '../components/lobby/LobbyHeader';
import { QuickActions } from '../components/lobby/QuickActions';
import { StatsOverview } from '../components/lobby/StatsOverview';
import { RecentMatches } from '../components/lobby/RecentMatches';
import { ProgressPanel } from '../components/lobby/ProgressPanel';
import { SocialPanel } from '../components/lobby/SocialPanel';
import { ChallengesPanel } from '../components/lobby/ChallengesPanel';
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
    <div className="min-h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              <Home className="h-4 w-4" />
              Accueil
            </button>

            <button
              onClick={onNewGame}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              <Swords className="h-4 w-4" />
              Arena
            </button>

            <button
              onClick={onCreateLobby}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              <Swords className="h-4 w-4" />
              Creer Salon
            </button>

            <button
              onClick={onOpenFriends}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              <Users className="h-4 w-4" />
              Ami(e)s
            </button>

            <button
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              Historique
            </button>

            <button
              onClick={onOpenStats}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              Mes Stats
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
          </div>
        </div>

        {isLoading || !data ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
          </div>
        ) : (
        <div className="space-y-5">
          <LobbyHeader profile={data.profile} stats={data.stats} />

          <QuickActions
            onNewGame={onNewGame}
            onResume={onResumeGame}
            onJoinWithCode={onJoinWithCode}
            onChallengeFriend={onChallengeFriend}
          />

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <StatsOverview stats={data.stats} />
              <RecentMatches matches={data.recentMatches} />
              <ChallengesPanel challenges={data.challenges} />
            </div>

            <div className="space-y-5">
              <ProgressPanel
                profile={data.profile}
                achievements={data.achievements}
                quickReplay={data.quickReplay}
                onReplayQuickMode={onResumeGame}
              />
              <SocialPanel
                friends={data.friends}
                invites={data.invites}
                joinableLobbies={data.joinableLobbies}
              />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-black/20 px-5 py-4 text-center text-sm text-gray-400">
            <span className="font-black text-orange-300">Suggestion:</span>{' '}
            Le chemin le plus rapide pour revenir a la competition est de relancer un{' '}
            <button onClick={onResumeGame} className="font-black text-white underline decoration-orange-400/40 underline-offset-4">
              set de 501
            </button>{' '}
            ou d'ouvrir l'arena pour defier un ami en Cricket.
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
