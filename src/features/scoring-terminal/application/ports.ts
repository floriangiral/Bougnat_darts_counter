import type {
  AssignedMatchSnapshotRecord,
  ConflictMarkerRecord,
  PendingOperationStatus,
  PendingScoringOperationRecord,
  SubmitScoreVisitCommand,
  SyncPullItem,
  SyncStateRecord,
  TerminalSessionRecord,
} from '../domain/types';

export type SubmitScoreVisitResult =
  | { kind: 'accepted'; eventId: string | null }
  | { kind: 'duplicate'; eventId: string | null }
  | {
      kind: 'conflict';
      reasonCode: string;
      message: string;
      serverState: Record<string, unknown> | null;
      conflictKind: 'technical' | 'business';
      resyncRequired: boolean;
    }
  | {
      kind: 'rejected';
      reasonCode: string;
      message: string;
      resyncRequired: boolean;
      matchClosed: boolean;
    }
  | {
      kind: 'retryable_error';
      reasonCode: string;
      message: string;
    }
  | {
      kind: 'fatal_error';
      reasonCode: string;
      message: string;
    };

export type PullSyncResult =
  | {
      kind: 'ok';
      cursor: string;
      items: SyncPullItem[];
    }
  | {
      kind: 'retryable_error';
      reasonCode: string;
      message: string;
    }
  | {
      kind: 'fatal_error';
      reasonCode: string;
      message: string;
    };

export interface ScoringTerminalSyncAdapter {
  submitScoreVisit(command: SubmitScoreVisitCommand): Promise<SubmitScoreVisitResult>;
  pullSync(deviceSessionID: string, cursor: string | null): Promise<PullSyncResult>;
}

export interface ScoringTerminalLocalRepository {
  getTerminalSession(id: string): Promise<TerminalSessionRecord | null>;
  upsertTerminalSession(record: TerminalSessionRecord): Promise<void>;

  getAssignedMatchSnapshot(terminalSessionID: string, matchID: string): Promise<AssignedMatchSnapshotRecord | null>;
  upsertAssignedMatchSnapshot(record: AssignedMatchSnapshotRecord): Promise<void>;

  getSyncState(terminalSessionID: string): Promise<SyncStateRecord | null>;
  upsertSyncState(record: SyncStateRecord): Promise<void>;

  findOperationByIdempotencyKey(
    terminalSessionID: string,
    idempotencyKey: string,
  ): Promise<PendingScoringOperationRecord | null>;
  insertOperation(record: PendingScoringOperationRecord): Promise<void>;
  listReadyOperations(
    terminalSessionID: string,
    nowISO: string,
    limit: number,
  ): Promise<PendingScoringOperationRecord[]>;
  requeueStaleProcessingOperations(
    terminalSessionID: string,
    staleBeforeISO: string,
    nextAttemptISO: string,
  ): Promise<number>;
  markOperationProcessing(operationID: string, attemptedAtISO: string): Promise<PendingScoringOperationRecord | null>;
  updateOperationResult(
    operationID: string,
    status: PendingOperationStatus,
    options: {
      updatedAtISO: string;
      nextAttemptAtISO?: string;
      serverEventID?: string | null;
      errorCode?: string | null;
      errorMessage?: string | null;
    },
  ): Promise<void>;
  listPendingOperations(terminalSessionID: string): Promise<PendingScoringOperationRecord[]>;

  insertConflictMarker(record: ConflictMarkerRecord): Promise<void>;
}
