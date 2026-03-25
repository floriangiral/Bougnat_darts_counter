import React from 'react';
import type { FriendStatus, JoinableLobby, LobbyInvite } from '../../src/types/lobby';

interface SocialPanelProps {
  friends: FriendStatus[];
  invites: LobbyInvite[];
  joinableLobbies: JoinableLobby[];
}

export const SocialPanel: React.FC<SocialPanelProps> = ({ friends, invites, joinableLobbies }) => {
  return (
    <section className="space-y-4 rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Social</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Amis Et Multijoueur</h2>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Amis En Ligne</div>
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-gray-400">
              Les amis synchronises apparaitront ici une fois les tables sociales connectees.
            </div>
          ) : friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/8 bg-black/20">
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
                <div className="truncate text-sm font-black text-white">{friend.username}</div>
                <div className="truncate text-sm text-gray-400">{friend.activity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Invitations</div>
        <div className="space-y-3">
          {invites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-gray-400">
              Aucune invitation en attente pour le moment.
            </div>
          ) : invites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div>
                <div className="text-sm font-black text-white">{invite.username}</div>
                <div className="text-sm text-gray-400">{invite.mode} · {invite.createdAt}</div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">{invite.type === 'incoming' ? 'Recue' : 'Envoyee'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Lobbies Rejoignables</div>
        <div className="space-y-3">
          {joinableLobbies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-gray-400">
              Les lobbies multijoueur ouverts apparaitront ici quand cette fonctionnalite sera active.
            </div>
          ) : joinableLobbies.map((lobby) => (
            <div key={lobby.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-white">{lobby.host}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">{lobby.mode}</div>
              </div>
              <div className="mt-2 text-sm text-gray-400">{lobby.stakes}</div>
              <div className="mt-2 text-sm text-gray-500">{lobby.players}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
