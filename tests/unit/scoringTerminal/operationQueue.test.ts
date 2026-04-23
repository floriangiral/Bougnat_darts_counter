import { describe, expect, it } from 'vitest';

import type { PullSyncResult, ScoringTerminalSyncAdapter, SubmitScoreVisitResult } from '../../../src/features/scoring-terminal/application/ports';
import { ScoringTerminalOperationQueue } from '../../../src/features/scoring-terminal/application/operationQueue';
import type { SubmitScoreVisitCommand, TerminalSessionRecord } from '../../../src/features/scoring-terminal/domain/types';
import { InMemoryScoringTerminalRepository } from '../../../src/features/scoring-terminal/infra/local/inMemoryRepository';

// Spec ref: spec:counter/offline-scoring-terminal-foundation
class MutableClock {
  private current: Date;

  constructor(startISO: string) {
    this.current = new Date(startISO);
  }

  now() {
    return new Date(this.current.toISOString());
  }

  advanceMs(ms: number) {
    this.current = new Date(this.current.getTime() + ms);
  }
}

class FakeAdapter implements ScoringTerminalSyncAdapter {
  private readonly submitResults: SubmitScoreVisitResult[];
  private readonly pullResults: PullSyncResult[];

  constructor(options?: {
    submitResults?: SubmitScoreVisitResult[];
    pullResults?: PullSyncResult[];
  }) {
    this.submitResults = options?.submitResults ?? [{ kind: 'accepted', eventId: 'evt-1' }];
    this.pullResults = options?.pullResults ?? [{ kind: 'ok', cursor: 'cursor-1', items: [] }];
  }

  async submitScoreVisit(): Promise<SubmitScoreVisitResult> {
    return this.submitResults.shift() ?? { kind: 'accepted', eventId: 'evt-fallback' };
  }

  async pullSync(): Promise<PullSyncResult> {
    return this.pullResults.shift() ?? { kind: 'ok', cursor: 'cursor-fallback', items: [] };
  }
}

const baseSession = (): TerminalSessionRecord => ({
  id: 'terminal-session-1',
  tournamentId: 'tournament-1',
  deviceSessionId: '00000000-0000-0000-0000-000000000777',
  mode: 'dedicated_tablet',
  status: 'active',
  assignedMatchId: 'match-1',
  lastServerCursor: null,
  createdAt: '2026-04-17T10:00:00.000Z',
  updatedAt: '2026-04-17T10:00:00.000Z',
});

const baseCommand = (): SubmitScoreVisitCommand => ({
  commandId: 'cmd-1',
  idempotencyKey: '00000000-0000-0000-0000-000000000123',
  clientMode: 'dedicated_tablet',
  terminalSessionId: 'terminal-session-1',
  deviceSessionId: '00000000-0000-0000-0000-000000000777',
  matchId: '00000000-0000-0000-0000-000000000101',
  expectedMatchVersion: 18,
  expectedAssignmentVersion: 3,
  clientSequence: 12,
  clientTimestamp: '2026-04-17T10:00:01.000Z',
  visit: {
    clientVisitId: '00000000-0000-0000-0000-000000000201',
    participantId: '00000000-0000-0000-0000-000000000301',
    setNumber: 1,
    legNumber: 3,
    visitNumber: 9,
    pointsScored: 60,
    remainingPoints: 61,
    checkoutAttempt: false,
    darts: [
      { dartIndex: 1, segment: '20', multiplier: 1, points: 20 },
      { dartIndex: 2, segment: '20', multiplier: 1, points: 20 },
      { dartIndex: 3, segment: '20', multiplier: 1, points: 20 },
    ],
  },
});

describe('ScoringTerminalOperationQueue', () => {
  it('deduplicates by idempotency key while keeping the first operation', async () => {
    const repository = new InMemoryScoringTerminalRepository();
    const queue = new ScoringTerminalOperationQueue({
      repository,
      adapter: new FakeAdapter(),
      clock: new MutableClock('2026-04-17T10:00:00.000Z'),
    });

    await queue.initializeSession(baseSession());
    const first = await queue.enqueueScoreVisit(baseCommand());
    const second = await queue.enqueueScoreVisit(baseCommand());

    expect(first.queued).toBe(true);
    expect(second.queued).toBe(false);
    expect(second.operationID).toBe(first.operationID);
  });

  it('schedules retry on transient failure then accepts on next attempt', async () => {
    const repository = new InMemoryScoringTerminalRepository();
    const clock = new MutableClock('2026-04-17T10:00:00.000Z');
    const queue = new ScoringTerminalOperationQueue({
      repository,
      adapter: new FakeAdapter({
        submitResults: [
          { kind: 'retryable_error', reasonCode: 'network_error', message: 'offline' },
          { kind: 'accepted', eventId: 'evt-9' },
        ],
      }),
      clock,
      retryBaseMs: 1000,
    });

    await queue.initializeSession(baseSession());
    await queue.enqueueScoreVisit(baseCommand());

    const firstRun = await queue.processPending('terminal-session-1');
    expect(firstRun.retryScheduled).toBe(1);

    clock.advanceMs(1000);
    const secondRun = await queue.processPending('terminal-session-1');
    expect(secondRun.accepted).toBe(1);
  });

  it('marks duplicate when server reports operation already applied', async () => {
    const repository = new InMemoryScoringTerminalRepository();
    const queue = new ScoringTerminalOperationQueue({
      repository,
      adapter: new FakeAdapter({
        submitResults: [{ kind: 'duplicate', eventId: 'evt-existing' }],
      }),
      clock: new MutableClock('2026-04-17T10:00:00.000Z'),
    });

    await queue.initializeSession(baseSession());
    await queue.enqueueScoreVisit(baseCommand());
    const run = await queue.processPending('terminal-session-1');
    expect(run.duplicates).toBe(1);
  });

  it('records conflict and marks resync required', async () => {
    const repository = new InMemoryScoringTerminalRepository();
    const queue = new ScoringTerminalOperationQueue({
      repository,
      adapter: new FakeAdapter({
        submitResults: [
          {
            kind: 'conflict',
            reasonCode: 'stale_match_version',
            message: 'stale version',
            conflictKind: 'technical',
            resyncRequired: true,
            serverState: { row_version: 21 },
          },
        ],
      }),
      clock: new MutableClock('2026-04-17T10:00:00.000Z'),
    });

    await queue.initializeSession(baseSession());
    await queue.enqueueScoreVisit(baseCommand());
    const run = await queue.processPending('terminal-session-1');
    expect(run.conflicts).toBe(1);

    const syncState = await repository.getSyncState('terminal-session-1');
    expect(syncState?.resyncRequired).toBe(true);
  });

  it('flags match-closed rejection as resync required', async () => {
    const repository = new InMemoryScoringTerminalRepository();
    const queue = new ScoringTerminalOperationQueue({
      repository,
      adapter: new FakeAdapter({
        submitResults: [
          {
            kind: 'rejected',
            reasonCode: 'match_not_scorable',
            message: 'match status does not allow scoring',
            resyncRequired: true,
            matchClosed: true,
          },
        ],
      }),
      clock: new MutableClock('2026-04-17T10:00:00.000Z'),
    });

    await queue.initializeSession(baseSession());
    await queue.enqueueScoreVisit(baseCommand());
    const run = await queue.processPending('terminal-session-1');
    expect(run.rejected).toBe(1);

    const syncState = await repository.getSyncState('terminal-session-1');
    expect(syncState?.resyncRequired).toBe(true);
  });

  it('requeues stale processing operations after crash-like interruption', async () => {
    const repository = new InMemoryScoringTerminalRepository();
    const clock = new MutableClock('2026-04-17T10:00:00.000Z');
    const queue = new ScoringTerminalOperationQueue({
      repository,
      adapter: new FakeAdapter(),
      clock,
      staleProcessingMs: 1000,
    });

    await queue.initializeSession(baseSession());
    await queue.enqueueScoreVisit(baseCommand());

    await repository.markOperationProcessing('cmd-1', '2026-04-17T10:00:00.000Z');
    clock.advanceMs(1500);
    const run = await queue.processPending('terminal-session-1');
    expect(run.accepted).toBe(1);
  });

  it('updates sync cursor on reconnect resync', async () => {
    const repository = new InMemoryScoringTerminalRepository();
    const queue = new ScoringTerminalOperationQueue({
      repository,
      adapter: new FakeAdapter({
        pullResults: [
          {
            kind: 'ok',
            cursor: 'match:0001:22',
            items: [],
          },
        ],
      }),
      clock: new MutableClock('2026-04-17T10:00:00.000Z'),
    });

    await queue.initializeSession(baseSession());
    const result = await queue.resync('terminal-session-1');

    expect(result.status).toBe('ok');
    expect(result.cursor).toBe('match:0001:22');
    const syncState = await repository.getSyncState('terminal-session-1');
    expect(syncState?.lastServerCursor).toBe('match:0001:22');
    expect(syncState?.resyncRequired).toBe(false);
  });
});
