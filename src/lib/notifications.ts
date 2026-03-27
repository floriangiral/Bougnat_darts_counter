export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

const buildStorageKey = (userId: string) => `bougnat_notifications_read_${userId}`;

export function getNotificationCenter(user: any) {
  const userId = String(user?.id || '').trim();
  const notifications = DEFAULT_NOTIFICATIONS;

  if (!userId || typeof window === 'undefined') {
    return {
      notifications,
      unreadCount: notifications.length,
      hasUnread: notifications.length > 0,
    };
  }

  const raw = window.localStorage.getItem(buildStorageKey(userId));
  const readIds = new Set<string>(raw ? JSON.parse(raw) : []);
  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length;

  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

export function markNotificationsRead(user: any, notifications: AppNotification[]) {
  const userId = String(user?.id || '').trim();

  if (!userId || typeof window === 'undefined') {
    return;
  }

  const ids = notifications.map((notification) => notification.id);
  window.localStorage.setItem(buildStorageKey(userId), JSON.stringify(ids));
}
