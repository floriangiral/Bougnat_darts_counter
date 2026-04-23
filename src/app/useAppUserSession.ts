import { useSupabaseAuth } from './useSupabaseAuth';
import type { AppAccessMode, AppScreen } from './appShell';

export const useAppUserSession = (
  accessMode: AppAccessMode,
  setScreen: (screen: AppScreen) => void,
) => {
  const socialSession = useSupabaseAuth(setScreen, accessMode === 'social');

  if (accessMode !== 'social') {
    return {
      user: null,
      setUser: socialSession.setUser,
      logout: socialSession.logout,
    };
  }

  return socialSession;
};
