import React, { useMemo, useState } from 'react';
import { DoorOpen, Search, Ticket, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { fetchJoinableLobbies, findOpenLobbyByCode, joinOpenLobbyByCode } from '../lib/supabase';
import { getCountryFlagUrl } from '../src/lib/userProfile';
import type { JoinableLobby, LobbyGameMode } from '../src/types/lobby';

interface JoinWithCodeViewProps {
  user: any;
  onBack: () => void;
  onOpenRoom: (lobbyCode: string) => void;
  onOpenArena: (payload?: { mode: LobbyGameMode; title: string; stakes: string; config?: Record<string, unknown> }) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

interface LobbyLookupResult {
  id: string;
  lobbyCode: string;
  mode: LobbyGameMode;
  title: string;
  stakes: string;
  currentPlayers: number;
  maxPlayers: number;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string;
  hostCountryCode: string;
  createdAt: string;
  gameConfig?: Record<string, unknown>;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const JoinWithCodeView: React.FC<JoinWithCodeViewProps> = ({
  user,
  onBack,
  onOpenRoom,
  onOpenArena,
  onOpenProfile,
  onLogout,
}) => {
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<LobbyLookupResult | null>(null);
  const [publicLobbies, setPublicLobbies] = useState<JoinableLobby[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    fetchJoinableLobbies().then((rows) => setPublicLobbies(rows as JoinableLobby[]));
  }, []);

  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code]);
  const isOwnLobby = lookup?.hostUserId === user?.id;

  const handleLookup = async (nextCode?: string) => {
    const value = (nextCode ?? normalizedCode).trim().toUpperCase();
    if (!value) {
      setFeedback({ type: 'error', text: 'Entre un code de lobby avant de lancer la recherche.' });
      return;
    }

    setIsChecking(true);
    setFeedback(null);
    setLookup(null);
    setCode(value);

    const { data, error } = await findOpenLobbyByCode(value);

    if (error || !data) {
      setFeedback({ type: 'error', text: error?.message || 'Aucun lobby ouvert ne correspond a ce code.' });
      setIsChecking(false);
      return;
    }

    setLookup(data as LobbyLookupResult);
    setIsChecking(false);
  };

  const handleJoin = async () => {
    if (!normalizedCode) return;

    setIsJoining(true);
    setFeedback(null);
    const { error } = await joinOpenLobbyByCode(normalizedCode);

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Impossible de rejoindre ce lobby.' });
      setIsJoining(false);
      return;
    }

    const { data: refreshed } = await findOpenLobbyByCode(normalizedCode);
    if (refreshed) {
      setLookup(refreshed as LobbyLookupResult);
    }

    setFeedback({
      type: 'success',
      text: isOwnLobby
        ? 'Tu es deja l’hote de ce lobby. Ouvre directement l’arena.'
        : `Place reservee dans ${normalizedCode}. Tu peux maintenant ouvrir l’arena.`,
    });
    setIsJoining(false);
    window.setTimeout(() => onOpenRoom(normalizedCode), 250);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Back
            </Button>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Join Lobby
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Rejoindre Avec Un Code
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Entre un code d&apos;arena, verifie le lobby trouve et reserve ta place avant d&apos;entrer sur le pas de tir.
                </p>
              </div>
            </div>
          </div>
          <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Code d&apos;entree</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Valider Un Lobby</h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                  <Ticket className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    placeholder="EX: CRK501"
                    className="w-full bg-transparent text-base font-black uppercase tracking-[0.22em] text-white outline-none placeholder:text-gray-600"
                  />
                </div>
                <Button onClick={() => handleLookup()} disabled={isChecking || !normalizedCode} className="h-12 rounded-2xl px-5 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>{isChecking ? 'Recherche...' : 'Verifier'}</span>
                  </span>
                </Button>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-4 text-sm text-gray-400">
                Utilise le code partage par un ami ou par un hote de lobby. Les codes sont en majuscules et sans espace.
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Lobbies visibles</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Codes Publics Recents</h2>
              </div>

              {publicLobbies.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
                  Aucun lobby public disponible pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {publicLobbies.map((lobby) => (
                    <button
                      key={lobby.id}
                      onClick={() => handleLookup(lobby.lobbyCode || '')}
                      className="flex w-full flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-4 text-left transition-all hover:border-orange-400/20 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="text-sm font-black uppercase tracking-[0.14em] text-white">
                          {lobby.mode} · {lobby.host}
                        </div>
                        <div className="mt-2 text-sm text-gray-400">{lobby.stakes}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
                          {lobby.players}
                        </div>
                        {lobby.lobbyCode && (
                          <div className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                            {lobby.lobbyCode}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Verification</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Lobby Trouve</h2>
              </div>

              {!lookup ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-10 text-sm text-gray-400">
                  Verifie un code pour afficher le detail du lobby, son hote, le mode et le nombre de places restantes.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                        <img src={lookup.hostAvatarUrl} alt={lookup.hostName} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <img
                            src={getCountryFlagUrl(lookup.hostCountryCode)}
                            alt={lookup.hostCountryCode}
                            className="h-4 w-6 rounded-[3px] object-cover shadow-sm"
                          />
                          <div className="truncate text-sm font-black uppercase tracking-[0.14em] text-white">{lookup.hostName}</div>
                          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                            Host
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-400">{lookup.title}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mode</div>
                      <div className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-white">{lookup.mode}</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Players</div>
                      <div className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-white">
                        {lookup.currentPlayers} / {lookup.maxPlayers}
                      </div>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Code</div>
                      <div className="mt-2 text-lg font-black uppercase tracking-[0.14em] text-orange-300">{lookup.lobbyCode}</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Created</div>
                      <div className="mt-2 text-sm font-bold text-white">{formatDate(lookup.createdAt)}</div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-4 text-sm text-gray-400">
                    {lookup.stakes}
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleJoin}
                  disabled={!lookup || isJoining}
                  className="h-14 rounded-2xl text-sm shadow-[0_18px_40px_rgba(234,88,12,0.28)]"
                >
                  <span className="inline-flex items-center gap-3">
                    <Users className="h-4 w-4" />
                    <span>{isJoining ? 'Connexion...' : isOwnLobby ? 'Reprendre Mon Lobby' : 'Rejoindre Le Lobby'}</span>
                  </span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    onOpenArena(lookup ? { mode: lookup.mode, title: lookup.title, stakes: lookup.stakes, config: lookup.gameConfig } : undefined)
                  }
                  className="h-14 rounded-2xl text-sm"
                >
                  <span className="inline-flex items-center gap-3">
                    <DoorOpen className="h-4 w-4" />
                    <span>Ouvrir L&apos;Arena</span>
                  </span>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
