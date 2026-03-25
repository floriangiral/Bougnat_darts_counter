import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Search, UserPlus, UserRoundMinus, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import {
  createEmailFriendInvite,
  createFriendRequest,
  fetchEmailFriendInvites,
  fetchFriendRequests,
  fetchLobbyFriends,
  removeFriendship,
  respondToFriendRequest,
  searchPlayerProfiles,
} from '../lib/supabase';
import { getCountryFlagUrl } from '../src/lib/userProfile';
import type { FriendStatus } from '../src/types/lobby';

interface FriendsManagementViewProps {
  user: any;
  onBack: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

interface PlayerSearchResult {
  user_id: string;
  username: string;
  country_code: string;
  avatar_seed: string;
}

interface FriendRequestItem {
  id: string;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
  player: {
    id: string;
    username: string;
    avatarUrl: string;
    countryCode: string;
  };
}

interface EmailInviteItem {
  id: string;
  recipient_email: string;
  status: string;
  created_at: string;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export const FriendsManagementView: React.FC<FriendsManagementViewProps> = ({
  user,
  onBack,
  onOpenProfile,
  onLogout,
}) => {
  const [friends, setFriends] = useState<FriendStatus[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [emailInvites, setEmailInvites] = useState<EmailInviteItem[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [nextFriends, nextRequests, nextEmailInvites] = await Promise.all([
      fetchLobbyFriends(user?.id),
      fetchFriendRequests(user?.id),
      fetchEmailFriendInvites(user?.id),
    ]);
    setFriends(nextFriends as FriendStatus[]);
    setRequests(nextRequests as FriendRequestItem[]);
    setEmailInvites(nextEmailInvites as EmailInviteItem[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const nextResults = await searchPlayerProfiles(trimmed, user?.id, 8);

      if (active) {
        setResults((nextResults as PlayerSearchResult[]).filter((player) => player.user_id !== user?.id));
        setIsSearching(false);
      }
    };

    const timeout = window.setTimeout(runSearch, 180);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query, user]);

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends]);
  const pendingIds = useMemo(() => new Set(requests.map((request) => request.player.id)), [requests]);

  const handleAddFriend = async (player: PlayerSearchResult) => {
    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await createFriendRequest(user.id, player.user_id);

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Impossible d\'envoyer la demande d\'ami.' });
      setIsSubmitting(false);
      return;
    }

    setFeedback({ type: 'success', text: `${player.username} a bien recu ta demande d'ami.` });
    await loadData();
    setIsSubmitting(false);
  };

  const handleInviteByEmail = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await createEmailFriendInvite(user.id, inviteEmail);

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Impossible de creer l\'invitation email.' });
      setIsSubmitting(false);
      return;
    }

    setFeedback({ type: 'success', text: `Invitation preparee pour ${inviteEmail.trim().toLowerCase()}.` });
    setInviteEmail('');
    await loadData();
    setIsSubmitting(false);
  };

  const handleRemoveFriend = async (friendId: string, username: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await removeFriendship(user.id, friendId);

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Impossible de retirer cet ami.' });
      setIsSubmitting(false);
      return;
    }

    setFeedback({ type: 'success', text: `${username} a ete retire de ta liste d'amis.` });
    await loadData();
    setIsSubmitting(false);
  };

  const handleRequestResponse = async (requestId: string, decision: 'accepted' | 'declined') => {
    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await respondToFriendRequest(requestId, decision);

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Impossible de mettre a jour la demande.' });
      setIsSubmitting(false);
      return;
    }

    setFeedback({
      type: 'success',
      text: decision === 'accepted' ? 'Demande d\'ami acceptee.' : 'Demande d\'ami refusee.',
    });
    await loadData();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Retour
            </Button>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Gestion Des Amis
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Ami(e)s
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Ajoute des joueurs existants, invite par email et garde une liste propre avant d&apos;entrer dans l&apos;arena.
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

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Ajouter un joueur</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Trouver un ami existant</h2>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un pseudo"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-gray-600"
                />
              </div>

              {query.trim().length < 2 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
                  Commence par saisir au moins 2 caracteres pour rechercher un joueur existant.
                </div>
              ) : isSearching ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
                  Recherche en cours...
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
                  Aucun joueur correspondant pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((player) => {
                    const isFriend = friendIds.has(player.user_id);
                    const isPending = pendingIds.has(player.user_id);
                    return (
                      <div
                        key={player.user_id}
                        className="flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                            <img
                              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(player.avatar_seed)}&backgroundColor=b6e3f4`}
                              alt={player.username}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <img
                                src={getCountryFlagUrl(player.country_code)}
                                alt={player.country_code}
                                className="h-4 w-6 rounded-[3px] object-cover shadow-sm"
                              />
                              <div className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">
                                {player.username}
                              </div>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">Joueur deja disponible dans Bougnat Darts</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddFriend(player)}
                          disabled={isSubmitting || isFriend || isPending}
                          className="h-12 rounded-2xl px-5 text-sm"
                        >
                          <span className="inline-flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            <span>{isFriend ? 'Deja ami' : isPending ? 'En attente' : 'Ajouter'}</span>
                          </span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Invitation externe</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Inviter par email</h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="ami@exemple.com"
                    className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-gray-600"
                  />
                </div>
                <Button
                  onClick={handleInviteByEmail}
                  disabled={isSubmitting || !inviteEmail.trim()}
                  className="h-12 rounded-2xl px-5 text-sm"
                >
                  Envoyer
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {emailInvites.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-gray-400">
                    Aucune invitation email envoyee pour le moment.
                  </div>
                ) : (
                  emailInvites.map((invite) => (
                    <div key={invite.id} className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-white">{invite.recipient_email}</div>
                          <div className="mt-1 text-sm text-gray-500">{formatDate(invite.created_at)}</div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                          {invite.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Liste active</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Mes Ami(e)s</h2>
              </div>

              {isLoading ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
                  Chargement des relations...
                </div>
              ) : friends.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
                  Aucun ami accepte pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                          <img src={friend.avatarUrl} alt={friend.username} className="h-full w-full object-cover" />
                          <span
                            className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ${
                              friend.status === 'online'
                                ? 'bg-green-400'
                                : friend.status === 'in_match'
                                  ? 'bg-orange-400'
                                  : 'bg-gray-500'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">{friend.username}</div>
                          <div className="mt-1 truncate text-sm text-gray-400">{friend.activity}</div>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => handleRemoveFriend(friend.id, friend.username)}
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl px-5 text-sm text-red-200 hover:border-red-500/40 hover:bg-red-500/10"
                      >
                        <span className="inline-flex items-center gap-2">
                          <UserRoundMinus className="h-4 w-4" />
                          <span>Supprimer</span>
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Demandes</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">En attente</h2>
              </div>

              {requests.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
                  Aucune demande d&apos;ami en attente.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                          <img src={request.player.avatarUrl} alt={request.player.username} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <img
                              src={getCountryFlagUrl(request.player.countryCode)}
                              alt={request.player.countryCode}
                              className="h-4 w-6 rounded-[3px] object-cover shadow-sm"
                            />
                            <div className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">
                              {request.player.username}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-400">
                            {request.direction === 'incoming' ? 'Vous a ajoute' : 'Invitation envoyee'} · {formatDate(request.createdAt)}
                          </div>
                        </div>
                      </div>

                      {request.direction === 'incoming' ? (
                        <div className="mt-4 flex gap-3">
                          <Button
                            onClick={() => handleRequestResponse(request.id, 'accepted')}
                            disabled={isSubmitting}
                            className="h-11 flex-1 rounded-2xl text-sm"
                          >
                            Accepter
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleRequestResponse(request.id, 'declined')}
                            disabled={isSubmitting}
                            className="h-11 flex-1 rounded-2xl text-sm"
                          >
                            Refuser
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                          <Users className="h-3.5 w-3.5" />
                          En attente de reponse
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
