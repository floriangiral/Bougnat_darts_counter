import type {
  AssignedMatchSnapshotRecord,
  SubmitScoreVisitCommand,
  TerminalSessionRecord,
} from '../domain/types';
import type { ScoringTerminalLocalRepository } from './ports';
import { ScoringTerminalOperationQueue } from './operationQueue';

const nowISO = () => new Date().toISOString();

const snapshotRecordID = (terminalSessionID: string, matchID: string) => `${terminalSessionID}:${matchID}`;

export class ScoringTerminalClient {
  private readonly repository: ScoringTerminalLocalRepository;
  private readonly queue: ScoringTerminalOperationQueue;

  constructor(options: { repository: ScoringTerminalLocalRepository; queue: ScoringTerminalOperationQueue }) {
    this.repository = options.repository;
    this.queue = options.queue;
  }

  async startTerminalSession(session: Omit<TerminalSessionRecord, 'createdAt' | 'updatedAt'>): Promise<TerminalSessionRecord> {
    const now = nowISO();
    const record: TerminalSessionRecord = {
      ...session,
      createdAt: now,
      updatedAt: now,
    };

    await this.queue.initializeSession(record);
    return record;
  }

  async assignMatchSnapshot(input: {
    terminalSessionID: string;
    matchID: string;
    assignmentVersion: number;
    matchVersion: number;
    scoringStatus: string;
    snapshot: Record<string, unknown>;
    serverCursor: string | null;
  }): Promise<AssignedMatchSnapshotRecord> {
    const now = nowISO();
    const session = await this.repository.getTerminalSession(input.terminalSessionID);
    if (!session) {
      throw new Error(`terminal session not found: ${input.terminalSessionID}`);
    }

    const snapshot: AssignedMatchSnapshotRecord = {
      id: snapshotRecordID(input.terminalSessionID, input.matchID),
      terminalSessionId: input.terminalSessionID,
      matchId: input.matchID,
      assignmentVersion: input.assignmentVersion,
      matchVersion: input.matchVersion,
      scoringStatus: input.scoringStatus,
      snapshot: input.snapshot,
      serverCursor: input.serverCursor,
      updatedAt: now,
    };

    await this.repository.upsertAssignedMatchSnapshot(snapshot);
    await this.repository.upsertTerminalSession({
      ...session,
      assignedMatchId: input.matchID,
      lastServerCursor: input.serverCursor,
      updatedAt: now,
    });
    return snapshot;
  }

  async queueScoreVisit(command: SubmitScoreVisitCommand) {
    return this.queue.enqueueScoreVisit(command);
  }

  async syncNow(terminalSessionID: string) {
    return this.queue.syncNow(terminalSessionID);
  }

  async listPendingOperations(terminalSessionID: string) {
    return this.repository.listPendingOperations(terminalSessionID);
  }
}
