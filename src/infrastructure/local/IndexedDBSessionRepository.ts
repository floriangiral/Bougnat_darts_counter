// Spec: spec:counter/offline-scoring-terminal-foundation
// Spec: spec:counter/inp-phase1-quick-wins
import type { MatchState } from '../../../types';
import { APP_SESSION_STORAGE_KEY, removeLocalStorageItem } from '../../../utils/appPersistence';
import type { SessionRepository } from '../../application/scoring/ports';
import type { LocalGameHistoryEntry, PersistedAppSession } from '../../shared/session/persistedAppSession';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const DB_NAME = 'bougnat-counter-local';
const DB_VERSION = 1;
const STORE_APP_SESSIONS = 'app_sessions';
const STORE_CURRENT_MATCHES = 'current_matches';
const STORE_MATCH_HISTORY = 'match_history';
const APP_SESSION_RECORD_ID = 'current';
const CURRENT_MATCH_FALLBACK_KEY = 'bougnat-current-match-v1';
const MATCH_HISTORY_FALLBACK_KEY = 'bougnat-match-history-v1';

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexeddb request failed'));
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('indexeddb transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('indexeddb transaction aborted'));
  });

const hasIndexedDb = () => typeof indexedDB !== 'undefined';

export class IndexedDBSessionRepository implements SessionRepository {
  private readonly storage: StorageLike | null;
  private readonly dbPromise: Promise<IDBDatabase> | null;

  constructor(options: { storage?: StorageLike | null } = {}) {
    this.storage = options.storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    this.dbPromise = hasIndexedDb() ? this.openDatabase() : null;
  }

  async loadAppSession(): Promise<PersistedAppSession | null> {
    const fromDb = await this.tryLoadAppSessionFromIndexedDb();
    if (fromDb) {
      return fromDb;
    }

    return this.readFallbackJson<PersistedAppSession>(APP_SESSION_STORAGE_KEY);
  }

  async saveAppSession(session: PersistedAppSession): Promise<void> {
    // writeFallbackJson keeps window.localStorage in sync for the synchronous
    // boot-time restore (getRestoredAppSession) without blocking the interaction thread
    // with a duplicate setItem call.
    this.writeFallbackJson(APP_SESSION_STORAGE_KEY, session);

    if (!this.dbPromise) return;

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_APP_SESSIONS, 'readwrite');
      tx.objectStore(STORE_APP_SESSIONS).put({
        id: APP_SESSION_RECORD_ID,
        session,
      });
      await transactionDone(tx);
    } catch {
      // Keep localStorage as resilient fallback when IndexedDB fails.
    }
  }

  async clearAppSession(): Promise<void> {
    removeLocalStorageItem(APP_SESSION_STORAGE_KEY);
    if (this.storage) {
      try {
        this.storage.removeItem(APP_SESSION_STORAGE_KEY);
      } catch {
        // Ignore fallback cleanup failures.
      }
    }

    if (!this.dbPromise) return;

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_APP_SESSIONS, 'readwrite');
      tx.objectStore(STORE_APP_SESSIONS).delete(APP_SESSION_RECORD_ID);
      await transactionDone(tx);
    } catch {
      // Best effort cleanup only.
    }
  }

  async getCurrentMatch(matchId: string): Promise<MatchState | null> {
    const fromDb = await this.tryLoadCurrentMatchFromIndexedDb(matchId);
    if (fromDb) {
      return fromDb;
    }

    const fallback = this.readFallbackJson<Record<string, MatchState>>(CURRENT_MATCH_FALLBACK_KEY);
    return fallback?.[matchId] ?? null;
  }

  async saveCurrentMatch(match: MatchState): Promise<void> {
    const fallbackMatches = this.readFallbackJson<Record<string, MatchState>>(CURRENT_MATCH_FALLBACK_KEY) ?? {};
    fallbackMatches[match.id] = match;
    this.writeFallbackJson(CURRENT_MATCH_FALLBACK_KEY, fallbackMatches);

    if (!this.dbPromise) return;

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_CURRENT_MATCHES, 'readwrite');
      tx.objectStore(STORE_CURRENT_MATCHES).put({
        id: match.id,
        match,
        updatedAt: new Date().toISOString(),
      });
      await transactionDone(tx);
    } catch {
      // localStorage fallback remains the source of resilience if IndexedDB is unavailable.
    }
  }

  async saveMatchHistory(match: MatchState): Promise<void> {
    const historyEntry: LocalGameHistoryEntry = {
      id: match.id,
      gameType: 'X01',
      completedAt: new Date().toISOString(),
      winnerId: match.matchWinnerId,
      payload: { match },
    };

    await this.saveLocalGameHistory(historyEntry);
  }

  async saveLocalGameHistory(entry: LocalGameHistoryEntry): Promise<void> {
    const fallbackHistory = this.readFallbackJson<LocalGameHistoryEntry[]>(MATCH_HISTORY_FALLBACK_KEY) ?? [];
    const nextHistory = [entry, ...fallbackHistory.filter((item) => item.id !== entry.id)].slice(0, 50);
    this.writeFallbackJson(MATCH_HISTORY_FALLBACK_KEY, nextHistory);

    if (!this.dbPromise) return;

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_MATCH_HISTORY, 'readwrite');
      tx.objectStore(STORE_MATCH_HISTORY).put(entry);
      await transactionDone(tx);
    } catch {
      // localStorage fallback remains available.
    }
  }

  async listLocalGameHistory(): Promise<LocalGameHistoryEntry[]> {
    const fromDb = await this.tryListHistoryFromIndexedDb();
    if (fromDb.length > 0) {
      return fromDb;
    }

    return this.readFallbackJson<LocalGameHistoryEntry[]>(MATCH_HISTORY_FALLBACK_KEY) ?? [];
  }

  private async tryLoadAppSessionFromIndexedDb(): Promise<PersistedAppSession | null> {
    if (!this.dbPromise) return null;

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_APP_SESSIONS, 'readonly');
      const value = await requestToPromise(tx.objectStore(STORE_APP_SESSIONS).get(APP_SESSION_RECORD_ID));
      await transactionDone(tx);
      return ((value as { id: string; session: PersistedAppSession } | undefined)?.session) ?? null;
    } catch {
      return null;
    }
  }

  private async tryLoadCurrentMatchFromIndexedDb(matchId: string): Promise<MatchState | null> {
    if (!this.dbPromise) return null;

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_CURRENT_MATCHES, 'readonly');
      const value = await requestToPromise(tx.objectStore(STORE_CURRENT_MATCHES).get(matchId));
      await transactionDone(tx);
      return ((value as { id: string; match: MatchState } | undefined)?.match) ?? null;
    } catch {
      return null;
    }
  }

  private async tryListHistoryFromIndexedDb(): Promise<LocalGameHistoryEntry[]> {
    if (!this.dbPromise) return [];

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_MATCH_HISTORY, 'readonly');
      const value = await requestToPromise(tx.objectStore(STORE_MATCH_HISTORY).getAll());
      await transactionDone(tx);
      return ((value as LocalGameHistoryEntry[]) ?? []).sort((left, right) => right.completedAt.localeCompare(left.completedAt));
    } catch {
      return [];
    }
  }

  private readFallbackJson<T>(key: string): T | null {
    if (!this.storage) return null;

    try {
      const rawValue = this.storage.getItem(key);
      if (!rawValue) {
        return null;
      }
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  private writeFallbackJson(key: string, value: unknown) {
    if (!this.storage) return;

    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore fallback storage failures.
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORE_APP_SESSIONS)) {
          db.createObjectStore(STORE_APP_SESSIONS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_CURRENT_MATCHES)) {
          db.createObjectStore(STORE_CURRENT_MATCHES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_MATCH_HISTORY)) {
          db.createObjectStore(STORE_MATCH_HISTORY, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('failed to open session database'));
    });
  }
}
