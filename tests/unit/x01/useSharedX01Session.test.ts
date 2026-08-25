import { describe, expect, it } from 'vitest';

import { useSharedX01Session } from '../../../src/features/x01/session/useSharedX01Session';
import type { MatchState } from '../../../types';

describe('useSharedX01Session', () => {
  it('keeps the disabled shared-session adapter neutral', async () => {
    const adapter = useSharedX01Session({
      sharedSessionId: 'shared-1',
      currentUserId: 'user-1',
      currentPlayerId: 'player-1',
      onRemoteMatch: (_match: MatchState) => undefined,
      onSyncError: () => undefined,
    });

    expect(adapter.ensureCurrentPlayerCanAct()).toBe(true);
    await expect(adapter.persistSharedState({} as MatchState)).resolves.toBeUndefined();
  });
});