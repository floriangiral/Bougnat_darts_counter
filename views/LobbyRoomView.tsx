import React, { useEffect, useState } from 'react';
import { Copy, DoorOpen, Pencil, RefreshCw, Save, Users } from 'lucide-react';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { fetchActiveSharedMatchSessionByLobbyCode, fetchOpenLobbyRoomByCode, updateOpenLobby } from '../lib/supabase';
import { getCountryFlagUrl } from '../src/lib/userProfile';
import type { LobbyGameMode } from '../src/types/lobby';
import type { InOutRule, MatchMode } from '../types';

interface LobbyRoomViewProps {
  user: any;
  lobbyCode: string;
  onBack: () => void;
  onLaunchSharedMatch: (payload: {
    lobbyId: string;
    lobbyCode: string;
    mode: LobbyGameMode;
    title: string;
    stakes: string;
    participants: Array<{ id: string; username: string; role: 'host' | 'guest' }>;
    config: Partial<{
      startingScore: number;
      matchMode: MatchMode;
      legsToWin: number;
      setsToWin: number;
      isDoubles: boolean;
      checkIn: InOutRule;
      checkOut: InOutRule;
    }>;
  }) => Promise<void> | void;
  onEnterSharedMatch: (payload: { sessionId: string; matchState: any; gameType: string }) => void;
  onOpenArena: (payload: {
    mode: LobbyGameMode;
    title: string;
    stakes: string;
    players: string[];
    config: Partial<{
      startingScore: number;
      matchMode: MatchMode;
      legsToWin: number;
      setsToWin: number;
      isDoubles: boolean;
      checkIn: InOutRule;
      checkOut: InOutRule;
    }>;
  }) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

interface LobbyRoomData {
  id: string;
  lobbyCode: string;
  mode: LobbyGameMode;
  title: string;
  stakes: string;
  currentPlayers: number;
  maxPlayers: number;
  status: string;
  createdAt: string;
  gameConfig?: Record<string, unknown>;
  host: {
    id: string;
    username: string;
    avatarUrl: string;
    countryCode: string;
  };
  participants: Array<{
    id: string;
    username: string;
    avatarUrl: string;
    countryCode: string;
    role: 'host' | 'guest';
  }>;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const inferArenaConfigFromRoom = (room: LobbyRoomData) => {
  if (room.gameConfig && Object.keys(room.gameConfig).length > 0) {
    return room.gameConfig as Partial<{
      startingScore: number;
      matchMode: MatchMode;
      legsToWin: number;
      setsToWin: number;
      isDoubles: boolean;
      checkIn: InOutRule;
      checkOut: InOutRule;
    }>;
  }

  const source = `${room.title} ${room.stakes}`.toLowerCase();
  const config: Partial<{
    startingScore: number;
    matchMode: MatchMode;
    legsToWin: number;
    setsToWin: number;
    isDoubles: boolean;
    checkIn: InOutRule;
    checkOut: InOutRule;
  }> = {};

  if (room.mode === 'X01') {
    if (source.includes('170')) config.startingScore = 170;
    else if (source.includes('701')) config.startingScore = 701;
    else if (source.includes('301')) config.startingScore = 301;
    else if (source.includes('1001')) config.startingScore = 1001;
    else config.startingScore = 501;

    config.checkIn = source.includes('double in') ? 'Double' : 'Open';
    config.checkOut = source.includes('master out') ? 'Master' : source.includes('double out') ? 'Double' : 'Open';

    if (source.includes('best of 5') || source.includes('bo5') || source.includes('premier a 3')) {
      config.matchMode = 'LEGS';
      config.legsToWin = 3;
      config.setsToWin = 1;
    }

    config.isDoubles = room.participants.length === 4;
  }

  return config;
};

export const LobbyRoomView: React.FC<LobbyRoomViewProps> = ({
  user,
  lobbyCode,
  onBack,
  onLaunchSharedMatch,
  onEnterSharedMatch,
  onOpenArena,
  onOpenProfile,
  onLogout,
}) => {
  const [room, setRoom] = useState<LobbyRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftStakes, setDraftStakes] = useState('');
  const [draftMaxPlayers, setDraftMaxPlayers] = useState(2);
  const [draftStatus, setDraftStatus] = useState<'open' | 'locked' | 'in_progress' | 'closed'>('open');
  const [draftConfig, setDraftConfig] = useState<Partial<{
    startingScore: number;
    matchMode: MatchMode;
    legsToWin: number;
    setsToWin: number;
    isDoubles: boolean;
    checkIn: InOutRule;
    checkOut: InOutRule;
  }>>({});

  const loadRoom = async () => {
    setIsLoading(true);
    setFeedback(null);
    const { data, error } = await fetchOpenLobbyRoomByCode(lobbyCode);

    if (error || !data) {
      setRoom(null);
      setFeedback({ type: 'error', text: error?.message || 'Impossible de charger ce lobby.' });
      setIsLoading(false);
      return;
    }

    setRoom(data as LobbyRoomData);
    setDraftTitle(data.title);
    setDraftStakes(data.stakes);
    setDraftMaxPlayers(data.maxPlayers);
    setDraftStatus(data.status as 'open' | 'locked' | 'in_progress' | 'closed');
    setDraftConfig(inferArenaConfigFromRoom(data as LobbyRoomData));
    setIsLoading(false);
  };

  useEffect(() => {
    loadRoom();
    setHasAutoOpened(false);
  }, [lobbyCode]);

  useEffect(() => {
    if (!room || isEditing) return;

    const interval = window.setInterval(() => {
      loadRoom();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [room, isEditing]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(lobbyCode);
      setFeedback({ type: 'success', text: `Code ${lobbyCode} copie.` });
    } catch {
      setFeedback({ type: 'error', text: 'Impossible de copier le code automatiquement.' });
    }
  };

  const handleSaveLobby = async () => {
    if (!room) return;

    setIsSaving(true);
    setFeedback(null);
    const { error } = await updateOpenLobby(room.id, {
      title: draftTitle,
      stakes: draftStakes,
      maxPlayers: draftMaxPlayers,
      status: draftStatus,
      gameConfig: room.mode === 'X01' ? draftConfig : {},
    });

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Impossible de mettre a jour ce salon.' });
      setIsSaving(false);
      return;
    }

    setFeedback({ type: 'success', text: 'Salon mis a jour.' });
    setIsEditing(false);
    await loadRoom();
    setIsSaving(false);
  };

  const handleLaunchMatch = async () => {
    if (!room) return;

    setIsLaunching(true);
    setFeedback(null);
    const config = inferArenaConfigFromRoom(room);
    const { error } = await updateOpenLobby(room.id, {
      status: 'in_progress',
      gameConfig: room.mode === 'X01' ? config : room.gameConfig || {},
    });

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Impossible de lancer la partie.' });
      setIsLaunching(false);
      return;
    }

    setFeedback({ type: 'success', text: 'Le salon est maintenant en cours. Les joueurs peuvent entrer dans l’arena.' });
    await loadRoom();
    setIsLaunching(false);
    await onLaunchSharedMatch({
      lobbyId: room.id,
      lobbyCode: room.lobbyCode,
      mode: room.mode,
      title: room.title,
      stakes: room.stakes,
      participants: room.participants.map((participant) => ({
        id: participant.id,
        username: participant.username,
        role: participant.role,
      })),
      config,
    });
  };

  const isHost = room?.host.id === user?.id;

  useEffect(() => {
    if (!room || !user || isHost || hasAutoOpened) return;
    if (room.status !== 'in_progress') return;

    let cancelled = false;

    const enterSharedMatch = async () => {
      const { data } = await fetchActiveSharedMatchSessionByLobbyCode(room.lobbyCode);
      if (!data || cancelled) return;

      setHasAutoOpened(true);
      setFeedback({ type: 'success', text: 'La partie a ete lancee. Redirection vers le match partage...' });

      const timeout = window.setTimeout(() => {
        if (!cancelled) {
          onEnterSharedMatch({
            sessionId: data.id,
            matchState: data.match_state,
            gameType: data.game_type,
          });
        }
      }, 900);

      return () => window.clearTimeout(timeout);
    };

    enterSharedMatch();

    return () => {
      cancelled = true;
    };
  }, [room, user, isHost, hasAutoOpened, onEnterSharedMatch]);

  return (
    <AppPageBackground>
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Back
            </Button>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Room Ready
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Lobby Room
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Verifie les joueurs presents, partage le code et bascule dans l&apos;arena quand le salon est pret.
                </p>
              </div>
            </div>
          </div>
          <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
        </div>

        {feedback && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
          </div>
        ) : !room ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-black/20 px-5 py-14 text-center text-sm text-gray-400">
            Aucun salon charge pour le code {lobbyCode}.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Salon actif</p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">{room.title}</h2>
                    <p className="mt-2 text-sm text-gray-400">{room.stakes}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                      {room.lobbyCode}
                    </button>
                    {isHost && (
                      <button
                        onClick={() => setIsEditing((value) => !value)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                        {isEditing ? 'Fermer Edition' : 'Editer'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mode</div>
                    <div className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-white">{room.mode}</div>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Players</div>
                    <div className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-white">
                      {room.currentPlayers} / {room.maxPlayers}
                    </div>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</div>
                    <div className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-orange-300">{room.status}</div>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Created</div>
                    <div className="mt-2 text-sm font-bold text-white">{formatDate(room.createdAt)}</div>
                  </div>
                </div>
              </div>

              {isHost && isEditing && (
                <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Host Controls</p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Editer Le Salon</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Titre</div>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Stakes</div>
                      <input
                        type="text"
                        value={draftStakes}
                        onChange={(e) => setDraftStakes(e.target.value)}
                        className="w-full bg-transparent text-base font-bold text-white outline-none"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Max Players</div>
                        <div className="grid grid-cols-4 gap-2">
                          {[2, 3, 4, 6].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setDraftMaxPlayers(value)}
                              className={`rounded-xl border py-2 text-sm font-black ${
                                draftMaxPlayers === value
                                  ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                  : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['open', 'locked', 'in_progress', 'closed'] as const).map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setDraftStatus(value)}
                              className={`rounded-xl border py-2 text-xs font-black uppercase tracking-[0.16em] ${
                                draftStatus === value
                                  ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                  : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {room.mode === 'X01' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Starting Score</div>
                          <div className="grid grid-cols-3 gap-2">
                            {[170, 301, 501, 701, 1001].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setDraftConfig((prev) => ({ ...prev, startingScore: value }))}
                                className={`rounded-xl border py-2 text-sm font-black ${
                                  draftConfig.startingScore === value
                                    ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                    : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Check Out</div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['Open', 'Double', 'Master'] as const).map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setDraftConfig((prev) => ({ ...prev, checkOut: value }))}
                                className={`rounded-xl border py-2 text-xs font-black uppercase tracking-[0.16em] ${
                                  draftConfig.checkOut === value
                                    ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                    : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Format</div>
                          <div className="grid grid-cols-2 gap-2">
                            {(['LEGS', 'SETS'] as const).map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setDraftConfig((prev) => ({ ...prev, matchMode: value }))}
                                className={`rounded-xl border py-2 text-xs font-black uppercase tracking-[0.16em] ${
                                  draftConfig.matchMode === value
                                    ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                    : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Legs to Win</div>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 3, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setDraftConfig((prev) => ({ ...prev, legsToWin: value }))}
                                className={`rounded-xl border py-2 text-sm font-black ${
                                  draftConfig.legsToWin === value
                                    ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                    : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleSaveLobby} disabled={isSaving} className="h-14 rounded-2xl text-sm shadow-[0_18px_40px_rgba(234,88,12,0.28)]">
                      <span className="inline-flex items-center gap-3">
                        <Save className="h-4 w-4" />
                        <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder Le Salon'}</span>
                      </span>
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Participants</p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Qui est dans la room ?</h2>
                  </div>
                  <button
                    onClick={loadRoom}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/8 bg-black/20 text-gray-400 transition-all hover:border-orange-400/25 hover:bg-white/[0.04] hover:text-white"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {room.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-4 rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-4">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                        <img src={participant.avatarUrl} alt={participant.username} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={getCountryFlagUrl(participant.countryCode)}
                            alt={participant.countryCode}
                            className="h-4 w-6 rounded-[3px] object-cover shadow-sm"
                          />
                          <div className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">{participant.username}</div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {participant.id === user?.id ? 'Toi' : participant.role === 'host' ? 'Hote du salon' : 'Participant'}
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                        {participant.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
                <div className="mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Ready Check</p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Prochaines Etapes</h2>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4 text-sm text-gray-400">
                    Partage le code <span className="font-black text-white">{room.lobbyCode}</span> si tu attends encore un joueur.
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4 text-sm text-gray-400">
                    {isHost
                      ? 'Tu es l’hote: tu peux maintenant ouvrir l’arena et lancer la Configuration.'
                      : 'Tu as rejoint le salon: reste ici le temps que l’hote ouvre la partie, ou ouvre l’arena si vous vous coordonnez en direct.'}
                  </div>
                  {room.status === 'in_progress' && (
                    <div className="rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                      La partie a ete lancee. Tous les joueurs peuvent maintenant entrer dans l&apos;arena avec la configuration du salon.
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-3">
                  {isHost && room.status !== 'in_progress' && (
                    <Button
                      onClick={handleLaunchMatch}
                      disabled={isLaunching}
                      className="h-14 rounded-2xl text-sm shadow-[0_18px_40px_rgba(234,88,12,0.28)]"
                    >
                      <span className="inline-flex items-center gap-3">
                        <DoorOpen className="h-4 w-4" />
                        <span>{isLaunching ? 'Lancement...' : 'Lancer La Partie'}</span>
                      </span>
                    </Button>
                  )}
                  <Button
                    onClick={() =>
                      onOpenArena({
                        mode: room.mode,
                        title: room.title,
                        stakes: room.stakes,
                        players: room.participants.map((participant) => participant.username),
                        config: inferArenaConfigFromRoom(room),
                      })
                    }
                    className="h-14 rounded-2xl text-sm shadow-[0_18px_40px_rgba(234,88,12,0.28)]"
                  >
                    <span className="inline-flex items-center gap-3">
                      <DoorOpen className="h-4 w-4" />
                      <span>{room.status === 'in_progress' ? 'Entrer Dans L’Arena' : isHost ? 'Ouvrir L’Arena' : 'Aller Vers L’Arena'}</span>
                    </span>
                  </Button>
                  <Button variant="secondary" onClick={onBack} className="h-14 rounded-2xl text-sm">
                    <span className="inline-flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <span>Retour Au Code</span>
                    </span>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
    </AppPageBackground>
  );
};
