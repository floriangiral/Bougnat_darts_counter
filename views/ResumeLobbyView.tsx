import React, { useEffect, useState } from 'react';
import { ArrowRight, CircleDot, Home, RefreshCw, Swords } from 'lucide-react';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { fetchResumableLobbyEntries } from '../lib/supabase';
import { getCountryFlagUrl } from '../src/lib/userProfile';
import type { MatchState } from '../types';

interface ResumableLobbyEntry {
  id: string;
  lobbyCode: string;
  mode: string;
  title: string;
  stakes: string;
  status: 'open' | 'locked' | 'in_progress' | 'closed';
  currentPlayers: number;
  maxPlayers: number;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string;
  hostCountryCode: string;
  updatedAt: string;
  gameConfig: Record<string, unknown>;
  sharedSession: null | {
    id: string;
    gameType: string;
    matchState: MatchState;
    updatedAt: string;
  };
}

interface ResumeLobbyViewProps {
  user: any;
  onBack: () => void;
  onOpenHome: () => void;
  onOpenRoom: (lobbyCode: string) => void;
  onEnterSharedMatch: (payload: { sessionId: string; matchState: MatchState; gameType: string }) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

const formatRelative = (value: string) => {
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
};

export const ResumeLobbyView: React.FC<ResumeLobbyViewProps> = ({
  user,
  onBack,
  onOpenHome,
  onOpenRoom,
  onEnterSharedMatch,
  onOpenProfile,
  onLogout,
}) => {
  const [entries, setEntries] = useState<ResumableLobbyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadEntries = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setFeedback(null);
    const nextEntries = await fetchResumableLobbyEntries(user.id);
    setEntries(nextEntries as unknown as ResumableLobbyEntry[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, [user?.id]);

  const activeMatches = entries.filter((entry) => entry.sharedSession);
  const pendingRooms = entries.filter((entry) => !entry.sharedSession);

  return (
    <AppPageBackground>
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={onBack} size="sm">
                ← Back
              </Button>
              <button
                onClick={onOpenHome}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
              >
                <Home className="h-4 w-4" />
                Accueil
              </button>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Session Resume
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Reprendre Une Session
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Retrouve tes salons actifs, reviens dans un match partage ou reprends une room prete a relancer l&apos;arena.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadEntries}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/8 bg-black/20 text-gray-400 transition-all hover:border-orange-400/25 hover:bg-white/[0.04] hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
          </div>
        </div>

        {feedback && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {feedback}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-black/20 px-5 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-orange-300">
              <RefreshCw className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">Aucune session a reprendre</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400">
              Tu n&apos;as pas de salon ouvert ni de match partage actif pour le moment. Retourne dans le lobby pour creer ou rejoindre une nouvelle room.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Matchs actifs</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Reprendre Le Match</h2>
              </div>

              {activeMatches.length === 0 ? (
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-5 py-6 text-sm text-gray-400">
                  Aucun match partage actif pour l&apos;instant.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {activeMatches.map((entry) => (
                    <div key={entry.id} className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">{entry.mode}</div>
                          <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-white">{entry.title}</h3>
                          <p className="mt-2 text-sm text-gray-400">{entry.stakes}</p>
                        </div>
                        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                          In Progress
                        </div>
                      </div>

                      <div className="mb-5 flex items-center gap-3">
                        <img src={entry.hostAvatarUrl} alt={entry.hostName} className="h-12 w-12 rounded-2xl border border-white/8 bg-black/20" />
                        <div>
                          <div className="flex items-center gap-2">
                            <img src={getCountryFlagUrl(entry.hostCountryCode)} alt={entry.hostCountryCode} className="h-4 w-6 rounded-[3px] object-cover shadow-sm" />
                            <span className="text-sm font-black uppercase tracking-[0.16em] text-white">{entry.hostName}</span>
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                            Code {entry.lobbyCode} · {entry.currentPlayers}/{entry.maxPlayers} joueurs · {formatRelative(entry.sharedSession!.updatedAt)}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          onEnterSharedMatch({
                            sessionId: entry.sharedSession!.id,
                            matchState: entry.sharedSession!.matchState,
                            gameType: entry.sharedSession!.gameType,
                          })
                        }
                        className="h-14 w-full rounded-2xl text-sm shadow-[0_18px_40px_rgba(234,88,12,0.28)]"
                      >
                        <span className="inline-flex items-center gap-3">
                          <Swords className="h-4 w-4" />
                          <span>Retourner Dans Le Match</span>
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Salons prets</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Reprendre Une Room</h2>
              </div>

              {pendingRooms.length === 0 ? (
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-5 py-6 text-sm text-gray-400">
                  Aucun salon ouvert ou verrouille a reprendre.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {pendingRooms.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => onOpenRoom(entry.lobbyCode)}
                      className="group rounded-[1.5rem] border border-white/8 bg-black/20 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-white/[0.05]"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">{entry.mode}</div>
                          <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-white">{entry.title}</h3>
                          <p className="mt-2 text-sm text-gray-400">{entry.stakes}</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
                          {entry.status}
                        </div>
                      </div>

                      <div className="mb-5 flex items-center gap-3">
                        <img src={entry.hostAvatarUrl} alt={entry.hostName} className="h-12 w-12 rounded-2xl border border-white/8 bg-black/20" />
                        <div>
                          <div className="flex items-center gap-2">
                            <img src={getCountryFlagUrl(entry.hostCountryCode)} alt={entry.hostCountryCode} className="h-4 w-6 rounded-[3px] object-cover shadow-sm" />
                            <span className="text-sm font-black uppercase tracking-[0.16em] text-white">{entry.hostName}</span>
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                            Code {entry.lobbyCode} · {entry.currentPlayers}/{entry.maxPlayers} joueurs · {formatRelative(entry.updatedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                        Ouvrir la room
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div className="rounded-[1.6rem] border border-white/8 bg-black/20 px-5 py-4 text-center text-sm text-gray-400">
              <CircleDot className="mr-2 inline h-4 w-4 text-orange-300" />
              Si une partie est deja lancee, la reprise priorise toujours le <span className="font-black text-white">match partage</span> plutot que la room.
            </div>
          </div>
        )}
    </AppPageBackground>
  );
};
