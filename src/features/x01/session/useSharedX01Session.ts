import type { MatchState } from '../../../../types';

type UseSharedX01SessionOptions = {
  sharedSessionId?: string;
  currentUserId?: string;
  currentPlayerId?: string;
  onRemoteMatch: (match: MatchState) => void;
  onSyncError: () => void;
};

export const useSharedX01Session = (_options: UseSharedX01SessionOptions) => {
  const persistSharedState = (_nextState: MatchState): Promise<void> => Promise.resolve();

  // Remote shared-session sync is intentionally disabled for the v1.0.1
  // open-source release. The local scoring flow remains the supported path.
  const ensureCurrentPlayerCanAct = () => true;

  return {
    ensureCurrentPlayerCanAct,
    persistSharedState,
  };
};
