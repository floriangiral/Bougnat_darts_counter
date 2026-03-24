import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, Send, Swords } from 'lucide-react';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { Button } from '../components/ui/Button';
import { createLobbyInvite, fetchLobbyFriends, fetchLobbyInvites } from '../lib/supabase';
import type { FriendStatus, LobbyGameMode, LobbyInvite } from '../src/types/lobby';

interface ChallengeFriendViewProps {
  user: any;
  onBack: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

const MODES: LobbyGameMode[] = ['X01', 'Cricket', 'Capital', 'Triathlon', 'Randomizer'];

export const ChallengeFriendView: React.FC<ChallengeFriendViewProps> = ({
  user,
  onBack,
  onOpenProfile,
  onLogout,
}) => {
  const [friends, setFriends] = useState<FriendStatus[]>([]);
  const [invites, setInvites] = useState<LobbyInvite[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [selectedMode, setSelectedMode] = useState<LobbyGameMode>('X01');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [nextFriends, nextInvites] = await Promise.all([
      fetchLobbyFriends(user?.id),
      fetchLobbyInvites(user?.id),
    ]);
    setFriends(nextFriends as FriendStatus[]);
    setInvites((nextInvites as LobbyInvite[]).map((invite) => ({
      ...invite,
      createdAt: formatRelativeDate(invite.createdAt),
    })));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredFriends = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return friends;
    return friends.filter((friend) => friend.username.toLowerCase().includes(query));
  }, [friends, search]);

  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) || null;

  const handleSendInvite = async () => {
    if (!selectedFriend) {
      setMessage({ type: 'error', text: 'Select a friend before sending a challenge.' });
      return;
    }

    setIsSending(true);
    setMessage(null);
    const { error } = await createLobbyInvite(user.id, selectedFriend.id, selectedMode);

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to send challenge.' });
      setIsSending(false);
      return;
    }

    setMessage({ type: 'success', text: `Challenge sent to ${selectedFriend.username}.` });
    setSelectedFriendId('');
    setSearch('');
    await loadData();
    setIsSending(false);
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
                Direct Challenge
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Defier Un Ami
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Pick a friend, lock a format and send a competitive invitation straight from the lobby.
                </p>
              </div>
            </div>
          </div>
          <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a friend"
                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-gray-600"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-gray-400">
                No friends available for a direct challenge yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFriends.map((friend) => {
                  const isSelected = friend.id === selectedFriendId;
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => setSelectedFriendId(friend.id)}
                      className={`flex w-full items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                        isSelected
                          ? 'border-orange-400/30 bg-orange-500/10'
                          : 'border-white/8 bg-black/20 hover:border-orange-400/20 hover:bg-white/[0.04]'
                      }`}
                    >
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
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">{friend.username}</div>
                        <div className="mt-1 truncate text-sm text-gray-400">{friend.activity}</div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                        {friend.status === 'in_match' ? 'Busy' : friend.status}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Challenge Setup</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Choose The Duel</h2>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                      selectedMode === mode
                        ? 'border-orange-400/30 bg-orange-500/10 text-white'
                        : 'border-white/8 bg-black/20 text-gray-400 hover:border-orange-400/20 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-black uppercase tracking-[0.14em]">{mode}</div>
                  </button>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Selected Opponent</div>
                <div className="mt-3 text-xl font-black text-white">
                  {selectedFriend ? selectedFriend.username : 'Choose a friend'}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {selectedFriend
                    ? `Current mode: ${selectedMode}`
                    : 'Select someone from your friends list to unlock the invite action.'}
                </div>
              </div>

              {message && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    message.type === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                onClick={handleSendInvite}
                disabled={!selectedFriend || isSending}
                className="mt-5 h-14 w-full rounded-2xl text-base shadow-[0_18px_40px_rgba(234,88,12,0.28)]"
              >
                <span className="inline-flex items-center gap-3">
                  <Send className="h-4 w-4" />
                  <span>{isSending ? 'Sending...' : 'Send Challenge'}</span>
                </span>
              </Button>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Pending Invites</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Current Activity</h2>
              </div>

              <div className="space-y-3">
                {invites.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-gray-400">
                    No pending direct challenges yet.
                  </div>
                ) : (
                  invites.map((invite) => (
                    <div key={invite.id} className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black uppercase tracking-[0.12em] text-white">{invite.username}</div>
                          <div className="mt-2 text-sm text-gray-400">
                            {invite.mode} · {invite.createdAt}
                          </div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                          {invite.type}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-4 text-sm text-gray-400">
                <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                  <Swords className="h-4 w-4 text-orange-300" />
                  Quick Tip
                </div>
                Start with a short X01 duel to validate the invite flow, then expand to Cricket or Triathlon once both players are ready.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
