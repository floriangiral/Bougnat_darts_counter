import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { getNotificationCenter, markNotificationsRead } from '../../src/lib/notifications';
import { getUserProfile } from '../../src/lib/userProfile';

interface MenuUserBadgeProps {
  user: any;
  onClick?: () => void;
  onLogout?: () => void;
  variant?: 'default' | 'integrated';
}

export const MenuUserBadge: React.FC<MenuUserBadgeProps> = ({ user, onClick, onLogout, variant = 'default' }) => {
  const { username, avatarUrl, countryFlagUrl, countryLabel } = getUserProfile(user);
  const isIntegrated = variant === 'integrated';
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 16 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const { notifications, hasUnread } = getNotificationCenter(user);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleToggleNotifications = () => {
    const nextOpen = !isNotificationsOpen;

    if (nextOpen && bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.bottom + 12,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }

    setIsNotificationsOpen(nextOpen);

    if (nextOpen && hasUnread) {
      markNotificationsRead(user, notifications);
    }
  };

  return (
    <div
      ref={containerRef}
      className={
        isIntegrated
          ? 'relative inline-flex items-center gap-3 rounded-none border-0 bg-transparent px-0 py-0 shadow-none backdrop-blur-0 transition-all'
          : 'relative inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-sm transition-all hover:border-orange-400/20 hover:bg-white/[0.06]'
      }
    >
      <button
        onClick={onClick}
        className={
          isIntegrated
            ? 'inline-flex min-w-0 items-center gap-2 px-0 py-0 text-left transition-all hover:opacity-90'
            : 'inline-flex min-w-0 items-center gap-3 rounded-[1.1rem] px-2.5 py-2 text-left transition-all hover:bg-white/[0.06]'
        }
      >
        <div className={isIntegrated ? 'h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-black/20 shadow-[0_6px_18px_rgba(0,0,0,0.2)]' : 'h-10 w-10 overflow-hidden rounded-xl border border-orange-500/25 bg-black/20'}>
          <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 text-left">
          {!isIntegrated && <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Player</div>}
          <div className="flex items-center">
            <img
              src={countryFlagUrl}
              alt={countryLabel}
              title={countryLabel}
              className={isIntegrated ? 'h-3.5 w-5 rounded-[3px] object-cover shadow-sm' : 'h-4 w-6 rounded-[3px] object-cover shadow-sm'}
            />
          </div>
        </div>
      </button>

      <button
        ref={bellButtonRef}
        type="button"
        onClick={handleToggleNotifications}
        className={
          isIntegrated
            ? 'relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-gray-300 transition-all hover:border-orange-400/30 hover:text-white'
            : 'relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-gray-300 transition-all hover:border-orange-400/30 hover:text-white'
        }
        aria-label="Notifications"
      >
        <Bell className={isIntegrated ? 'h-4 w-4' : 'h-5 w-5'} />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
        )}
      </button>

      {isNotificationsOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] w-[19rem] rounded-[1.5rem] border border-white/12 bg-[#070c13] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.62)] backdrop-blur-2xl"
          style={{ top: panelPosition.top, right: panelPosition.right }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Centre De Notifications</div>
              <div className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-white">Bougnat Darts</div>
            </div>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1119] px-3 py-4 text-sm text-gray-400">
                Aucune notification pour le moment.
              </div>
            ) : notifications.map((notification) => (
              <div key={notification.id} className="rounded-2xl border border-white/10 bg-[#0b1119] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-black text-white">{notification.title}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">{notification.createdAt}</div>
                </div>
                <div className="mt-2 text-sm text-gray-400">{notification.message}</div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
