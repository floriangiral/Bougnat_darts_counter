import type {
  AssignedMatchSnapshotRecord,
  ConflictMarkerRecord,
  PendingOperationStatus,
  PendingScoringOperationRecord,
  SyncStateRecord,
  TerminalSessionRecord,
} from '../../domain/types';
import type { ScoringTerminalLocalRepository } from '../../application/ports';

const DB_NAME = 'bougnat-scoring-terminal';
const DB_VERSION = 1;

const STORE_TERMINAL_SESSIONS = 'terminal_sessions';
const STORE_ASSIGNED_MATCH_SNAPSHOTS = 'assigned_match_snapshots';
const STORE_PENDING_OPERATIONS = 'pending_operations';
const STORE_SYNC_STATES = 'sync_states';
const STORE_CONFLICT_MARKERS = 'conflict_markers';

const OP_STATUS_INDEX = 'by_terminal_status';
const OP_NEXT_ATTEMPT_INDEX = 'by_terminal_next_attempt';
const OP_IDEMPOTENCY_INDEX = 'by_terminal_idempotency';

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

const ensureIndexedDB = () => {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment');
  }
};

export class IndexedDbScoringTerminalRepository implements ScoringTerminalLocalRepository {
  private readonly dbPromise: Promise<IDBDatabase>;

  constructor() {
    ensureIndexedDB();
    this.dbPromise = this.openDatabase();
  }

  async getTerminalSession(id: string): Promise<TerminalSessionRecord | null> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_TERMINAL_SESSIONS, 'readonly');
    const store = tx.objectStore(STORE_TERMINAL_SESSIONS);
    const value = await requestToPromise(store.get(id));
    await transactionDone(tx);
    return (value as TerminalSessionRecord | undefined) ?? null;
  }

  async upsertTerminalSession(record: TerminalSessionRecord): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_TERMINAL_SESSIONS, 'readwrite');
    tx.objectStore(STORE_TERMINAL_SESSIONS).put(record);
    await transactionDone(tx);
  }

  async getAssignedMatchSnapshot(terminalSessionID: string, matchID: string): Promise<AssignedMatchSnapshotRecord | null> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_ASSIGNED_MATCH_SNAPSHOTS, 'readonly');
    const key = `${terminalSessionID}:${matchID}`;
    const value = await requestToPromise(tx.objectStore(STORE_ASSIGNED_MATCH_SNAPSHOTS).get(key));
    await transactionDone(tx);
    return (value as AssignedMatchSnapshotRecord | undefined) ?? null;
  }

  async upsertAssignedMatchSnapshot(record: AssignedMatchSnapshotRecord): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_ASSIGNED_MATCH_SNAPSHOTS, 'readwrite');
    tx.objectStore(STORE_ASSIGNED_MATCH_SNAPSHOTS).put(record);
    await transactionDone(tx);
  }

  async getSyncState(terminalSessionID: string): Promise<SyncStateRecord | null> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_SYNC_STATES, 'readonly');
    const value = await requestToPromise(tx.objectStore(STORE_SYNC_STATES).get(terminalSessionID));
    await transactionDone(tx);
    return (value as SyncStateRecord | undefined) ?? null;
  }

  async upsertSyncState(record: SyncStateRecord): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_SYNC_STATES, 'readwrite');
    tx.objectStore(STORE_SYNC_STATES).put(record);
    await transactionDone(tx);
  }

  async findOperationByIdempotencyKey(
    terminalSessionID: string,
    idempotencyKey: string,
  ): Promise<PendingScoringOperationRecord | null> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_PENDING_OPERATIONS, 'readonly');
    const index = tx.objectStore(STORE_PENDING_OPERATIONS).index(OP_IDEMPOTENCY_INDEX);
    const value = await requestToPromise(index.get([terminalSessionID, idempotencyKey]));
    await transactionDone(tx);
    return (value as PendingScoringOperationRecord | undefined) ?? null;
  }

  async insertOperation(record: PendingScoringOperationRecord): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_PENDING_OPERATIONS, 'readwrite');
    tx.objectStore(STORE_PENDING_OPERATIONS).add(record);
    await transactionDone(tx);
  }

  async listReadyOperations(
    terminalSessionID: string,
    nowISO: string,
    limit: number,
  ): Promise<PendingScoringOperationRecord[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_PENDING_OPERATIONS, 'readonly');
    const store = tx.objectStore(STORE_PENDING_OPERATIONS);
    const all = (await requestToPromise(store.getAll())) as PendingScoringOperationRecord[];
    await transactionDone(tx);

    return all
      .filter((item) => item.terminalSessionId === terminalSessionID)
      .filter((item) => item.status === 'pending' || item.status === 'retry_scheduled')
      .filter((item) => item.nextAttemptAt <= nowISO)
      .sort((left, right) => left.nextAttemptAt.localeCompare(right.nextAttemptAt))
      .slice(0, limit);
  }

  async requeueStaleProcessingOperations(
    terminalSessionID: string,
    staleBeforeISO: string,
    nextAttemptISO: string,
  ): Promise<number> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_PENDING_OPERATIONS, 'readwrite');
    const store = tx.objectStore(STORE_PENDING_OPERATIONS);
    const all = (await requestToPromise(store.getAll())) as PendingScoringOperationRecord[];

    let updated = 0;
    for (const item of all) {
      if (item.terminalSessionId !== terminalSessionID) continue;
      if (item.status !== 'processing') continue;
      if (!item.lastAttemptAt || item.lastAttemptAt > staleBeforeISO) continue;

      store.put({
        ...item,
        status: 'retry_scheduled',
        nextAttemptAt: nextAttemptISO,
        updatedAt: nextAttemptISO,
      });
      updated += 1;
    }

    await transactionDone(tx);
    return updated;
  }

  async markOperationProcessing(operationID: string, attemptedAtISO: string): Promise<PendingScoringOperationRecord | null> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_PENDING_OPERATIONS, 'readwrite');
    const store = tx.objectStore(STORE_PENDING_OPERATIONS);
    const current = (await requestToPromise(store.get(operationID))) as PendingScoringOperationRecord | undefined;

    if (!current || (current.status !== 'pending' && current.status !== 'retry_scheduled')) {
      await transactionDone(tx);
      return null;
    }

    const next: PendingScoringOperationRecord = {
      ...current,
      status: 'processing',
      attempts: current.attempts + 1,
      lastAttemptAt: attemptedAtISO,
      updatedAt: attemptedAtISO,
    };
    store.put(next);
    await transactionDone(tx);
    return next;
  }

  async updateOperationResult(
    operationID: string,
    status: PendingOperationStatus,
    options: {
      updatedAtISO: string;
      nextAttemptAtISO?: string;
      serverEventID?: string | null;
      errorCode?: string | null;
      errorMessage?: string | null;
    },
  ): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_PENDING_OPERATIONS, 'readwrite');
    const store = tx.objectStore(STORE_PENDING_OPERATIONS);
    const current = (await requestToPromise(store.get(operationID))) as PendingScoringOperationRecord | undefined;

    if (!current) {
      await transactionDone(tx);
      return;
    }

    const updated: PendingScoringOperationRecord = {
      ...current,
      status,
      nextAttemptAt: options.nextAttemptAtISO ?? current.nextAttemptAt,
      serverEventId: options.serverEventID ?? current.serverEventId,
      lastErrorCode: options.errorCode ?? null,
      lastErrorMessage: options.errorMessage ?? null,
      updatedAt: options.updatedAtISO,
    };

    store.put(updated);
    await transactionDone(tx);
  }

  async listPendingOperations(terminalSessionID: string): Promise<PendingScoringOperationRecord[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_PENDING_OPERATIONS, 'readonly');
    const index = tx.objectStore(STORE_PENDING_OPERATIONS).index(OP_STATUS_INDEX);

    const statuses: PendingOperationStatus[] = ['pending', 'processing', 'retry_scheduled'];
    const rows: PendingScoringOperationRecord[] = [];
    for (const status of statuses) {
      const matches = (await requestToPromise(index.getAll([terminalSessionID, status]))) as PendingScoringOperationRecord[];
      rows.push(...matches);
    }

    await transactionDone(tx);
    return rows.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async insertConflictMarker(record: ConflictMarkerRecord): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_CONFLICT_MARKERS, 'readwrite');
    tx.objectStore(STORE_CONFLICT_MARKERS).put(record);
    await transactionDone(tx);
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error ?? new Error('failed to open indexeddb'));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORE_TERMINAL_SESSIONS)) {
          db.createObjectStore(STORE_TERMINAL_SESSIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_ASSIGNED_MATCH_SNAPSHOTS)) {
          db.createObjectStore(STORE_ASSIGNED_MATCH_SNAPSHOTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PENDING_OPERATIONS)) {
          const store = db.createObjectStore(STORE_PENDING_OPERATIONS, { keyPath: 'id' });
          store.createIndex(OP_STATUS_INDEX, ['terminalSessionId', 'status'], { unique: false });
          store.createIndex(OP_NEXT_ATTEMPT_INDEX, ['terminalSessionId', 'nextAttemptAt'], { unique: false });
          store.createIndex(OP_IDEMPOTENCY_INDEX, ['terminalSessionId', 'idempotencyKey'], { unique: true });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_STATES)) {
          db.createObjectStore(STORE_SYNC_STATES, { keyPath: 'terminalSessionId' });
        }
        if (!db.objectStoreNames.contains(STORE_CONFLICT_MARKERS)) {
          db.createObjectStore(STORE_CONFLICT_MARKERS, { keyPath: 'id' });
        }
      };
    });
  }
}
