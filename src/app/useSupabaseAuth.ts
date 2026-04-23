import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { getAuthCallbackType, supabase } from '../../lib/supabase';

import type { AppScreen } from './appShell';

export const useSupabaseAuth = (setScreen: (screen: AppScreen) => void, enabled = true) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUser(null);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (session?.user && window.location.pathname === '/auth/callback' && getAuthCallbackType() !== 'recovery') {
        window.history.replaceState({}, document.title, '/');
        setScreen('DASHBOARD');
      }

      if (event === 'SIGNED_OUT') {
        setScreen('HOME');
      }
    });

    return () => subscription.unsubscribe();
  }, [enabled, setScreen]);

  const logout = async () => {
    if (!enabled) {
      setUser(null);
      setScreen('HOME');
      return;
    }

    await supabase.auth.signOut();
  };

  return { user, setUser, logout };
};
