import type { MatchState } from '../../../types';
import type { LocalGameHistoryEntry, PersistedAppSession } from '../../shared/session/persistedAppSession';
import { IndexedDBSessionRepository } from './IndexedDBSessionRepository';

const repository = new IndexedDBSessionRepository();

export const restorePersistedAppSessionAsync = async (): Promise<PersistedAppSession | null> => {
  return repository.loadAppSession();
};

/**
 * Saves the session; resolves to false when it could be written nowhere (spec 010, V2-FR-08).
 * `current_matches` only keeps the X01 match in progress (V2-FR-07, V2-FR-10).
 */
export const persistAppSessionAsync = async (session: PersistedAppSession): Promise<boolean> => {
  const saved = await repository.saveAppSession(session);
  if (session.currentMatch && session.selectedGameType === 'X01') {
    await repository.saveCurrentMatch(session.currentMatch);
  } else {
    await repository.clearCurrentMatches();
  }
  return saved;
};

export const clearPersistedAppSessionAsync = async () => {
  await repository.clearAppSession();
};

export const saveFinishedMatchLocally = async (match: MatchState) => {
  await repository.saveMatchHistory(match);
};

export const saveLocalGameHistoryEntry = async (entry: LocalGameHistoryEntry) => {
  await repository.saveLocalGameHistory(entry);
};

export const listLocalGameHistory = async () => {
  return repository.listLocalGameHistory();
};
