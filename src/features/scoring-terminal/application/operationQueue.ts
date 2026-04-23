import type {
  ConflictMarkerRecord,
  PendingScoringOperationRecord,
  SubmitScoreVisitCommand,
  SyncStateRecord,
  TerminalSessionRecord,
} from '../domain/types';
import type { ScoringTerminalLocalRepository, ScoringTerminalSyncAdapter } from './ports';

// Spec: spec:counter/offline-scoring-terminal-foundation
const DEFAULT_RETRY_BASE_MS = 1500;
const DEFAULT_RETRY_MAX_MS = 45000;
const DEFAULT_STALE_PROCESSING_MS = 15000;

export type QueueClock = {
  now(): Date;
};

const systemClock: QueueClock = {
  now: () => new Date(),
};

const toISO = (date: Date) => date.toISOString();

const addMillis = (date: Date, millis: number) => new Date(date.getTime() + millis);

const computeRetryDelayMs = (attempts: number, retryBaseMs: number, retryMaxMs: number) => {
  const exponential = retryBaseMs * (2 ** Math.max(0, attempts - 1));
  return Math.min(retryMaxMs, exponential);
};

const ensureSyncState = async (
  repository: ScoringTerminalLocalRepository,
  terminalSessionID: string,
  nowISO: string,
): Promise<SyncStateRecord> => {
  const existing = await repository.getSyncState(terminalSessionID);
  if (existing) {
    return existing;
  }

  const created: SyncStateRecord = {
    terminalSessionId: terminalSessionID,
    connectionState: 'offline',
    lastServerCursor: null,
    resyncRequired: false,
    lastSyncAttemptAt: null,
    lastSyncSuccessAt: null,
    updatedAt: nowISO,
  };
  await repository.upsertSyncState(created);
  return created;
};

export class ScoringTerminalOperationQueue {
  private readonly repository: ScoringTerminalLocalRepository;
  private readonly adapter: ScoringTerminalSyncAdapter;
  private readonly clock: QueueClock;
  private readonly retryBaseMs: number;
  private readonly retryMaxMs: number;
  private readonly staleProcessingMs: number;

  constructor(options: {
    repository: ScoringTerminalLocalRepository;
    adapter: ScoringTerminalSyncAdapter;
    clock?: QueueClock;
    retryBaseMs?: number;
    retryMaxMs?: number;
    staleProcessingMs?: number;
  }) {
    this.repository = options.repository;
    this.adapter = options.adapter;
    this.clock = options.clock ?? systemClock;
    this.retryBaseMs = options.retryBaseMs ?? DEFAULT_RETRY_BASE_MS;
    this.retryMaxMs = options.retryMaxMs ?? DEFAULT_RETRY_MAX_MS;
    this.staleProcessingMs = options.staleProcessingMs ?? DEFAULT_STALE_PROCESSING_MS;
  }

  async initializeSession(session: TerminalSessionRecord): Promise<void> {
    const nowISO = toISO(this.clock.now());
    await this.repository.upsertTerminalSession(session);
    await ensureSyncState(this.repository, session.id, nowISO);
  }

  async enqueueScoreVisit(command: SubmitScoreVisitCommand): Promise<{
    queued: boolean;
    operationID: string;
    status: PendingScoringOperationRecord['status'];
  }> {
    const now = this.clock.now();
    const nowISO = toISO(now);
    await ensureSyncState(this.repository, command.terminalSessionId, nowISO);

    // Invariant: idempotency key deduplicates local operations before any remote call.
    const existing = await this.repository.findOperationByIdempotencyKey(command.terminalSessionId, command.idempotencyKey);
    if (existing) {
      return {
        queued: false,
        operationID: existing.id,
        status: existing.status,
      };
    }

    const operation: PendingScoringOperationRecord = {
      id: command.commandId,
      terminalSessionId: command.terminalSessionId,
      matchId: command.matchId,
      commandKind: 'submit_score_visit',
      commandId: command.commandId,
      idempotencyKey: command.idempotencyKey,
      payload: command,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: nowISO,
      lastAttemptAt: null,
      serverEventId: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    await this.repository.insertOperation(operation);
    return {
      queued: true,
      operationID: operation.id,
      status: operation.status,
    };
  }

  async processPending(terminalSessionID: string, limit = 20): Promise<{
    processed: number;
    accepted: number;
    duplicates: number;
    conflicts: number;
    rejected: number;
    retryScheduled: number;
  }> {
    const now = this.clock.now();
    const nowISO = toISO(now);

    await ensureSyncState(this.repository, terminalSessionID, nowISO);
    await this.repository.requeueStaleProcessingOperations(
      terminalSessionID,
      toISO(addMillis(now, -this.staleProcessingMs)),
      nowISO,
    );

    const ready = await this.repository.listReadyOperations(terminalSessionID, nowISO, limit);
    const counters = {
      processed: 0,
      accepted: 0,
      duplicates: 0,
      conflicts: 0,
      rejected: 0,
      retryScheduled: 0,
    };

    for (const operation of ready) {
      const attemptedAt = this.clock.now();
      const attemptedAtISO = toISO(attemptedAt);
      const processing = await this.repository.markOperationProcessing(operation.id, attemptedAtISO);
      if (!processing) {
        continue;
      }

      counters.processed += 1;
      const result = await this.adapter.submitScoreVisit(processing.payload);
      const updatedAtISO = toISO(this.clock.now());

      if (result.kind === 'accepted') {
        counters.accepted += 1;
        await this.repository.updateOperationResult(processing.id, 'acked', {
          updatedAtISO,
          serverEventID: result.eventId,
          errorCode: null,
          errorMessage: null,
        });
        continue;
      }

      if (result.kind === 'duplicate') {
        counters.duplicates += 1;
        await this.repository.updateOperationResult(processing.id, 'duplicate', {
          updatedAtISO,
          serverEventID: result.eventId,
          errorCode: null,
          errorMessage: null,
        });
        continue;
      }

      if (result.kind === 'conflict') {
        counters.conflicts += 1;
        await this.repository.updateOperationResult(processing.id, 'conflict', {
          updatedAtISO,
          errorCode: result.reasonCode,
          errorMessage: result.message,
        });
        await this.repository.insertConflictMarker(this.buildConflictMarker(processing, result, updatedAtISO));
        await this.markResyncRequired(terminalSessionID, updatedAtISO, result.serverState?.server_cursor);
        continue;
      }

      if (result.kind === 'rejected') {
        counters.rejected += 1;
        await this.repository.updateOperationResult(processing.id, 'rejected', {
          updatedAtISO,
          errorCode: result.reasonCode,
          errorMessage: result.message,
        });
        if (result.resyncRequired || result.matchClosed) {
          await this.markResyncRequired(terminalSessionID, updatedAtISO);
        }
        continue;
      }

      if (result.kind === 'retryable_error') {
        counters.retryScheduled += 1;
        const nextDelayMs = computeRetryDelayMs(processing.attempts, this.retryBaseMs, this.retryMaxMs);
        const nextAttemptAtISO = toISO(addMillis(this.clock.now(), nextDelayMs));
        await this.repository.updateOperationResult(processing.id, 'retry_scheduled', {
          updatedAtISO,
          nextAttemptAtISO,
          errorCode: result.reasonCode,
          errorMessage: result.message,
        });
        continue;
      }

      counters.rejected += 1;
      await this.repository.updateOperationResult(processing.id, 'rejected', {
        updatedAtISO,
        errorCode: result.reasonCode,
        errorMessage: result.message,
      });
    }

    return counters;
  }

  async resync(terminalSessionID: string): Promise<{
    status: 'ok' | 'retryable_error' | 'fatal_error';
    pulledItems: number;
    cursor: string | null;
  }> {
    const nowISO = toISO(this.clock.now());
    const session = await this.repository.getTerminalSession(terminalSessionID);
    if (!session) {
      return { status: 'fatal_error', pulledItems: 0, cursor: null };
    }

    const syncState = await ensureSyncState(this.repository, terminalSessionID, nowISO);
    await this.repository.upsertSyncState({
      ...syncState,
      connectionState: 'online',
      lastSyncAttemptAt: nowISO,
      updatedAt: nowISO,
    });

    const pullResult = await this.adapter.pullSync(session.deviceSessionId, syncState.lastServerCursor);
    if (pullResult.kind === 'retryable_error') {
      await this.repository.upsertSyncState({
        ...syncState,
        connectionState: 'degraded',
        lastSyncAttemptAt: nowISO,
        updatedAt: nowISO,
      });
      return { status: 'retryable_error', pulledItems: 0, cursor: syncState.lastServerCursor };
    }
    if (pullResult.kind === 'fatal_error') {
      await this.repository.upsertSyncState({
        ...syncState,
        connectionState: 'degraded',
        lastSyncAttemptAt: nowISO,
        updatedAt: nowISO,
      });
      return { status: 'fatal_error', pulledItems: 0, cursor: syncState.lastServerCursor };
    }

    const updatedAtISO = toISO(this.clock.now());
    const nextCursor = pullResult.cursor || syncState.lastServerCursor;
    await this.repository.upsertSyncState({
      ...syncState,
      connectionState: 'online',
      lastServerCursor: nextCursor,
      resyncRequired: false,
      lastSyncAttemptAt: updatedAtISO,
      lastSyncSuccessAt: updatedAtISO,
      updatedAt: updatedAtISO,
    });

    await this.repository.upsertTerminalSession({
      ...session,
      lastServerCursor: nextCursor,
      updatedAt: updatedAtISO,
    });

    for (const item of pullResult.items) {
      if (item.status === 'conflict') {
        const conflict: ConflictMarkerRecord = {
          id: `${terminalSessionID}:${item.syncOperationID}`,
          terminalSessionId: terminalSessionID,
          operationId: null,
          matchId: item.targetID,
          conflictKind: 'technical',
          reasonCode: 'sync_pull_conflict',
          message: 'server reported a conflict during pull',
          serverState: item.payload,
          createdAt: item.receivedAt,
          resolvedAt: null,
        };
        await this.repository.insertConflictMarker(conflict);
      }
    }

    return {
      status: 'ok',
      pulledItems: pullResult.items.length,
      cursor: nextCursor,
    };
  }

  async syncNow(terminalSessionID: string): Promise<{
    pullStatus: 'ok' | 'retryable_error' | 'fatal_error';
    queuedProcessing: {
      processed: number;
      accepted: number;
      duplicates: number;
      conflicts: number;
      rejected: number;
      retryScheduled: number;
    };
  }> {
    const pull = await this.resync(terminalSessionID);
    const processing = await this.processPending(terminalSessionID);
    return {
      pullStatus: pull.status,
      queuedProcessing: processing,
    };
  }

  private buildConflictMarker(
    operation: PendingScoringOperationRecord,
    result: Extract<
      Awaited<ReturnType<ScoringTerminalSyncAdapter['submitScoreVisit']>>,
      { kind: 'conflict' }
    >,
    createdAtISO: string,
  ): ConflictMarkerRecord {
    return {
      id: `${operation.id}:${createdAtISO}`,
      terminalSessionId: operation.terminalSessionId,
      operationId: operation.id,
      matchId: operation.matchId,
      conflictKind: result.conflictKind,
      reasonCode: result.reasonCode,
      message: result.message,
      serverState: result.serverState,
      createdAt: createdAtISO,
      resolvedAt: null,
    };
  }

  private async markResyncRequired(
    terminalSessionID: string,
    nowISO: string,
    cursorOverride?: unknown,
  ): Promise<void> {
    const existing = await ensureSyncState(this.repository, terminalSessionID, nowISO);
    const nextCursor =
      typeof cursorOverride === 'string' && cursorOverride.trim() !== ''
        ? cursorOverride
        : existing.lastServerCursor;

    await this.repository.upsertSyncState({
      ...existing,
      connectionState: 'degraded',
      resyncRequired: true,
      lastServerCursor: nextCursor,
      updatedAt: nowISO,
    });
  }
}
