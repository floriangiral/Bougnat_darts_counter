import type {
  AssignedMatchSnapshotRecord,
  ConflictMarkerRecord,
  PendingOperationStatus,
  PendingScoringOperationRecord,
  SyncStateRecord,
  TerminalSessionRecord,
} from '../../domain/types';
import type { ScoringTerminalLocalRepository } from '../../application/ports';

export class InMemoryScoringTerminalRepository implements ScoringTerminalLocalRepository {
  private readonly terminalSessions = new Map<string, TerminalSessionRecord>();
  private readonly snapshots = new Map<string, AssignedMatchSnapshotRecord>();
  private readonly operations = new Map<string, PendingScoringOperationRecord>();
  private readonly syncStates = new Map<string, SyncStateRecord>();
  private readonly conflicts = new Map<string, ConflictMarkerRecord>();

  async getTerminalSession(id: string): Promise<TerminalSessionRecord | null> {
    return this.terminalSessions.get(id) ?? null;
  }

  async upsertTerminalSession(record: TerminalSessionRecord): Promise<void> {
    this.terminalSessions.set(record.id, record);
  }

  async getAssignedMatchSnapshot(terminalSessionID: string, matchID: string): Promise<AssignedMatchSnapshotRecord | null> {
    return this.snapshots.get(`${terminalSessionID}:${matchID}`) ?? null;
  }

  async upsertAssignedMatchSnapshot(record: AssignedMatchSnapshotRecord): Promise<void> {
    this.snapshots.set(record.id, record);
  }

  async getSyncState(terminalSessionID: string): Promise<SyncStateRecord | null> {
    return this.syncStates.get(terminalSessionID) ?? null;
  }

  async upsertSyncState(record: SyncStateRecord): Promise<void> {
    this.syncStates.set(record.terminalSessionId, record);
  }

  async findOperationByIdempotencyKey(
    terminalSessionID: string,
    idempotencyKey: string,
  ): Promise<PendingScoringOperationRecord | null> {
    for (const operation of this.operations.values()) {
      if (operation.terminalSessionId === terminalSessionID && operation.idempotencyKey === idempotencyKey) {
        return operation;
      }
    }
    return null;
  }

  async insertOperation(record: PendingScoringOperationRecord): Promise<void> {
    this.operations.set(record.id, record);
  }

  async listReadyOperations(
    terminalSessionID: string,
    nowISO: string,
    limit: number,
  ): Promise<PendingScoringOperationRecord[]> {
    return Array.from(this.operations.values())
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
    let count = 0;
    for (const operation of this.operations.values()) {
      if (operation.terminalSessionId !== terminalSessionID) continue;
      if (operation.status !== 'processing') continue;
      if (!operation.lastAttemptAt || operation.lastAttemptAt > staleBeforeISO) continue;

      this.operations.set(operation.id, {
        ...operation,
        status: 'retry_scheduled',
        nextAttemptAt: nextAttemptISO,
        updatedAt: nextAttemptISO,
      });
      count += 1;
    }
    return count;
  }

  async markOperationProcessing(operationID: string, attemptedAtISO: string): Promise<PendingScoringOperationRecord | null> {
    const current = this.operations.get(operationID);
    if (!current || (current.status !== 'pending' && current.status !== 'retry_scheduled')) {
      return null;
    }

    const next: PendingScoringOperationRecord = {
      ...current,
      status: 'processing',
      attempts: current.attempts + 1,
      lastAttemptAt: attemptedAtISO,
      updatedAt: attemptedAtISO,
    };
    this.operations.set(operationID, next);
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
    const current = this.operations.get(operationID);
    if (!current) return;

    this.operations.set(operationID, {
      ...current,
      status,
      nextAttemptAt: options.nextAttemptAtISO ?? current.nextAttemptAt,
      serverEventId: options.serverEventID ?? current.serverEventId,
      lastErrorCode: options.errorCode ?? null,
      lastErrorMessage: options.errorMessage ?? null,
      updatedAt: options.updatedAtISO,
    });
  }

  async listPendingOperations(terminalSessionID: string): Promise<PendingScoringOperationRecord[]> {
    return Array.from(this.operations.values())
      .filter((item) => item.terminalSessionId === terminalSessionID)
      .filter((item) => item.status === 'pending' || item.status === 'processing' || item.status === 'retry_scheduled')
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async insertConflictMarker(record: ConflictMarkerRecord): Promise<void> {
    this.conflicts.set(record.id, record);
  }

  async listConflictMarkers(terminalSessionID: string): Promise<ConflictMarkerRecord[]> {
    return Array.from(this.conflicts.values())
      .filter((item) => item.terminalSessionId === terminalSessionID)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
}
