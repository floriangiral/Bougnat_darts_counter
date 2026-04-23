import type { MatchState } from '../../../types';

export interface SessionRepository {
  getCurrentMatch(matchId: string): Promise<MatchState | null>;
  saveCurrentMatch(match: MatchState): Promise<void>;
  saveMatchHistory(match: MatchState): Promise<void>;
}

// Placeholder contract for future connected-mode sync.
export type SyncRepository = Record<string, never>;
