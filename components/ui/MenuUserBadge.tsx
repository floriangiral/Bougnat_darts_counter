import React from 'react';
import { LogOut } from 'lucide-react';
import { getUserProfile } from '../../src/lib/userProfile';

interface MenuUserBadgeProps {
  user: any;
  onClick?: () => void;
  onLogout?: () => void;
}

export const MenuUserBadge: React.FC<MenuUserBadgeProps> = ({ user, onClick, onLogout }) => {
  const { username, avatarUrl, countryFlagUrl, countryLabel } = getUserProfile(user);

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-sm transition-all hover:border-orange-400/20 hover:bg-white/[0.06]">
      <button
        onClick={onClick}
        className="inline-flex min-w-0 items-center gap-3 rounded-[1.1rem] px-2.5 py-2 text-left transition-all hover:bg-white/[0.06]"
      >
        <div className="h-10 w-10 overflow-hidden rounded-xl border border-orange-500/25 bg-black/20">
          <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Player</div>
          <div className="flex items-center gap-2">
            <img src={countryFlagUrl} alt={countryLabel} title={countryLabel} className="h-4 w-6 rounded-[3px] object-cover shadow-sm" />
            <div className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">{username}</div>
          </div>
        </div>
      </button>

      {onLogout && (
        <button
          onClick={onLogout}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/8 bg-black/20 text-gray-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-white"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
