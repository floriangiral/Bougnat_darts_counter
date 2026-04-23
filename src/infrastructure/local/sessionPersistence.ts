import type { MatchState } from '../../../types';
import type { LocalGameHistoryEntry, PersistedAppSession } from '../../shared/session/persistedAppSession';
import { IndexedDBSessionRepository } from './IndexedDBSessionRepository';

const repository = new IndexedDBSessionRepository();

export const restorePersistedAppSessionAsync = async (): Promise<PersistedAppSession | null> => {
  return repository.loadAppSession();
};

export const persistAppSessionAsync = async (session: PersistedAppSession) => {
  await repository.saveAppSession(session);
  if (session.currentMatch) {
    await repository.saveCurrentMatch(session.currentMatch);
  }
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
