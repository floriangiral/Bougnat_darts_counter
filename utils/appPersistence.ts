export const APP_SESSION_STORAGE_KEY = 'bougnat-app-session-v1';
export const LIVE_UPDATE_BLOCK_STORAGE_KEY = 'bougnat-live-update-blocked';
export const LIVE_UPDATE_PENDING_STORAGE_KEY = 'bougnat-live-update-pending';

export const readLocalStorageJson = <T>(key: string): T | null => {
  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

export const writeLocalStorageJson = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failures to avoid breaking the app when storage is unavailable.
  }
};

export const removeLocalStorageItem = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore remove failures to avoid breaking the app when storage is unavailable.
  }
};

export const isLiveUpdateBlocked = () => {
  try {
    return window.localStorage.getItem(LIVE_UPDATE_BLOCK_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setLiveUpdateBlocked = (blocked: boolean) => {
  try {
    if (blocked) {
      window.localStorage.setItem(LIVE_UPDATE_BLOCK_STORAGE_KEY, 'true');
      return;
    }

    window.localStorage.removeItem(LIVE_UPDATE_BLOCK_STORAGE_KEY);
  } catch {
    // Ignore write failures to avoid breaking the app when storage is unavailable.
  }
};

export const isLiveUpdatePending = () => {
  try {
    return window.localStorage.getItem(LIVE_UPDATE_PENDING_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setLiveUpdatePending = (pending: boolean) => {
  try {
    if (pending) {
      window.localStorage.setItem(LIVE_UPDATE_PENDING_STORAGE_KEY, 'true');
      return;
    }

    window.localStorage.removeItem(LIVE_UPDATE_PENDING_STORAGE_KEY);
  } catch {
    // Ignore write failures to avoid breaking the app when storage is unavailable.
  }
};
