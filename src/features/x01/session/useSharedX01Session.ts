import { useEffect } from 'react';

import type { MatchState } from '../../../../types';

type UseSharedX01SessionOptions = {
  sharedSessionId?: string;
  currentUserId?: string;
  currentPlayerId?: string;
  onRemoteMatch: (match: MatchState) => void;
  onSyncError: () => void;
};

export const useSharedX01Session = ({
  currentPlayerId,
  currentUserId,
  onRemoteMatch,
  onSyncError,
  sharedSessionId,
}: UseSharedX01SessionOptions) => {
  useEffect(() => {
    void currentPlayerId;
    void currentUserId;
    void onRemoteMatch;
    void onSyncError;
    void sharedSessionId;
  }, [onRemoteMatch, onSyncError, sharedSessionId]);

  const persistSharedState = async (nextState: MatchState) => {
    void nextState;
  };

  // Remote shared-session sync is intentionally disabled for the v1.0.1
  // open-source release. The local scoring flow remains the supported path.
  const ensureCurrentPlayerCanAct = () => true;

  return {
    ensureCurrentPlayerCanAct,
    persistSharedState,
  };
};
