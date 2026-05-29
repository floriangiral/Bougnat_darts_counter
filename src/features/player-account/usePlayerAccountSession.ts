import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import {
  PlayerAccountApiError,
  bootstrapPlayerAccountSession,
  getFriendlyPlayerAccountErrorMessage,
  isUnauthorizedPlayerAccountError,
  resolvePlayerEmail,
  resolvePlayerDisplayName,
  resolveProfileStatus,
} from './playerAccountApi';
import type {
  PlayerAccountAuthMe,
  PlayerAccountBootstrap,
  PlayerAccountSession,
} from './playerAccountTypes';

export type PlayerAccountSessionState = {
  status: 'anonymous' | 'loading' | 'submitting' | 'connected' | 'profile_incomplete' | 'error';
  auth: PlayerAccountAuthMe | null;
  bootstrap: PlayerAccountBootstrap | null;
  error: string | null;
};

type RefreshPlayerAccountSessionOptions = {
  skipTokenCache?: boolean;
  keepCurrentStatus?: boolean;
};

const toConnectedState = (session: PlayerAccountSession): PlayerAccountSessionState => ({
  status: session.profileStatus === 'ready' ? 'connected' : 'profile_incomplete',
  auth: session.auth,
  bootstrap: session.bootstrap,
  error: null,
});

const toErrorMessage = (error: unknown): string => {
  return getFriendlyPlayerAccountErrorMessage(error);
};

const logPlayerAccountError = (context: string, error: unknown) => {
  if (error instanceof PlayerAccountApiError) {
    console.warn(context, {
      status: error.status,
      code: error.code,
      message: error.message,
      payload: error.payload,
    });
    return;
  }

  console.warn(context, error);
};

export function usePlayerAccountSession(apiBaseUrl: string, jwtTemplateName: string) {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const clerkUserId = user?.id;
  const clerkEmail = user?.primaryEmailAddress?.emailAddress;
  const clerkFullName = user?.fullName;
  const clerkUsername = user?.username;
  const clerkImageUrl = user?.imageUrl;
  const [state, setState] = useState<PlayerAccountSessionState>({
    status: 'anonymous',
    auth: null,
    bootstrap: null,
    error: null,
  });

  const buildDegradedConnectedState = useCallback((error: unknown): PlayerAccountSessionState => {
    const fallbackEmail = clerkEmail ?? undefined;
    const fallbackName = clerkFullName || clerkUsername || fallbackEmail || 'Joueur';
    const auth: PlayerAccountAuthMe = {
      id: clerkUserId,
      email: fallbackEmail,
      name: fallbackName,
      provider: 'clerk',
    };

    return {
      status: 'profile_incomplete',
      auth,
      bootstrap: {
        player: {
          id: clerkUserId,
          email: fallbackEmail,
          name: fallbackName,
          display_name: fallbackName,
          username: clerkUsername ?? undefined,
          photo_url: clerkImageUrl || undefined,
        },
        stats: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          average: 0,
          bestAverage: 0,
          score180: 0,
          score140Plus: 0,
          score100Plus: 0,
          bestCheckout: 0,
          checkoutRate: 0,
          hasActivity: false,
        },
        recent_matches: [],
        raw_recent_matches: [],
        tournaments: [],
        raw_tournaments: [],
        scoring_profile: null,
      },
      error: toErrorMessage(error),
    };
  }, [clerkEmail, clerkFullName, clerkImageUrl, clerkUserId, clerkUsername]);

  const bootstrapFromClerkSession = useCallback(async (
    signal?: AbortSignal,
    options: Pick<RefreshPlayerAccountSessionOptions, 'skipTokenCache'> = {},
  ) => {
    const bearerToken = await getToken({ template: jwtTemplateName, skipCache: options.skipTokenCache });
    if (!bearerToken) {
      throw new Error('Session compte active, mais aucun token API disponible.');
    }

    return bootstrapPlayerAccountSession(apiBaseUrl, bearerToken, signal);
  }, [apiBaseUrl, getToken, jwtTemplateName]);

  useEffect(() => {
    if (!isLoaded) {
      setState((current) => ({
        ...current,
        status: current.status === 'connected' || current.status === 'profile_incomplete' ? current.status : 'loading',
      }));
      return;
    }

    if (!isSignedIn) {
      setState({
        status: 'anonymous',
        auth: null,
        bootstrap: null,
        error: null,
      });
      return;
    }

    const abortController = new AbortController();
    setState((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));

    bootstrapFromClerkSession(abortController.signal)
      .then((session) => {
        setState(toConnectedState(session));
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        if (isUnauthorizedPlayerAccountError(error)) {
          void signOut();
          setState({
            status: 'error',
            auth: null,
            bootstrap: null,
            error: 'Session expiree. Reconnecte-toi pour retrouver ton espace joueur.',
          });
          return;
        }

        logPlayerAccountError('Player account bootstrap degraded', error);
        setState(buildDegradedConnectedState(error));
      });

    return () => {
      abortController.abort();
    };
  }, [bootstrapFromClerkSession, buildDegradedConnectedState, isLoaded, isSignedIn, signOut]);

  const refresh = useCallback(async (options: RefreshPlayerAccountSessionOptions = {}) => {
    setState((current) => ({
      ...current,
      status: options.keepCurrentStatus ? current.status : 'submitting',
      error: null,
    }));

    try {
      const session = await bootstrapFromClerkSession(undefined, { skipTokenCache: options.skipTokenCache });
      setState(toConnectedState(session));
    } catch (error) {
      if (isUnauthorizedPlayerAccountError(error)) {
        void signOut();
        setState({
          status: 'error',
          auth: null,
          bootstrap: null,
          error: 'Session refusee par l API Bougnat Darts.',
        });
        return;
      }

      logPlayerAccountError('Player account refresh degraded', error);
      setState(buildDegradedConnectedState(error));
    }
  }, [bootstrapFromClerkSession, buildDegradedConnectedState, signOut]);

  const logout = useCallback(async () => {
    await signOut();
    setState({
      status: 'anonymous',
      auth: null,
      bootstrap: null,
      error: null,
    });
  }, [signOut]);

  return {
    ...state,
    displayName: resolvePlayerDisplayName(state.bootstrap, state.auth) || user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Joueur',
    email: resolvePlayerEmail(state.bootstrap, state.auth) || user?.primaryEmailAddress?.emailAddress || null,
    isConnected: state.status === 'connected' || state.status === 'profile_incomplete',
    profileStatus: state.bootstrap ? resolveProfileStatus(state.bootstrap) : null,
    isClerkLoaded: isLoaded,
    isClerkSignedIn: Boolean(isSignedIn),
    refresh,
    logout,
  };
}
