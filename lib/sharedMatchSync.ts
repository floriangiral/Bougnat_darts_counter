import type { RealtimeChannel } from '@supabase/supabase-js';

import type { MatchState } from '../types';
import { subscribeToSharedMatchSession, updateSharedMatchSessionState } from './supabase';

type SharedMatchSyncErrorCode = 'MISSING_MATCH_STATE' | 'INVALID_MATCH_STATE' | 'PERSIST_FAILED';

export type SharedMatchSyncError = {
  code: SharedMatchSyncErrorCode;
  message: string;
  cause?: unknown;
};

export type SharedMatchPersistResult =
  | { ok: true }
  | { ok: false; error: SharedMatchSyncError };

export type SharedMatchSubscriptionHandlers = {
  onError: (error: SharedMatchSyncError) => void;
  onRemoteMatch: (match: MatchState) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const looksLikeMatchState = (value: unknown): value is MatchState => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (!isRecord(value.config)) return false;
  if (!Array.isArray(value.players)) return false;
  if (!Array.isArray(value.completedLegs)) return false;
  if (!isRecord(value.currentLeg)) return false;
  if (!isRecord(value.legsWon)) return false;
  if (!isRecord(value.setsWon)) return false;
  if (typeof value.currentPlayerIndex !== 'number') return false;
  if (typeof value.duration !== 'number') return false;
  if (value.status !== 'active' && value.status !== 'finished') return false;
  return true;
};

export const persistSharedMatchStateSafely = async (
  sessionId: string,
  nextState: MatchState
): Promise<SharedMatchPersistResult> => {
  const { error } = await updateSharedMatchSessionState(sessionId, {
    matchState: nextState as unknown as Record<string, unknown>,
    status: nextState.status === 'finished' ? 'finished' : 'active',
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: 'PERSIST_FAILED',
        message: 'Impossible de synchroniser la partie partagee.',
        cause: error,
      },
    };
  }

  return { ok: true };
};

export const subscribeToSharedMatchSessionSafely = (
  sessionId: string,
  handlers: SharedMatchSubscriptionHandlers
): RealtimeChannel => {
  return subscribeToSharedMatchSession(sessionId, (row) => {
    if (!row || !('match_state' in row)) {
      handlers.onError({
        code: 'MISSING_MATCH_STATE',
        message: 'Mise a jour distante incomplete recue.',
      });
      return;
    }

    const candidate = row.match_state;

    if (!looksLikeMatchState(candidate)) {
      handlers.onError({
        code: 'INVALID_MATCH_STATE',
        message: 'Mise a jour distante invalide recue.',
        cause: candidate,
      });
      return;
    }

    handlers.onRemoteMatch(candidate);
  });
};
