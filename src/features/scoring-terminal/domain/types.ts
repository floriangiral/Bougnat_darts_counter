export type IsoDateTime = string;

export type TerminalMode = 'dedicated_tablet' | 'personal_phone';

export type TerminalSessionStatus = 'active' | 'closing' | 'closed';

export type PendingOperationStatus =
  | 'pending'
  | 'processing'
  | 'retry_scheduled'
  | 'acked'
  | 'duplicate'
  | 'conflict'
  | 'rejected';

export type ConflictKind = 'technical' | 'business';

export type SyncConnectionState = 'online' | 'offline' | 'degraded';

export type ScoreDartInput = {
  dartIndex: number;
  segment: string;
  multiplier: number;
  points: number;
};

export type SubmitScoreVisitCommand = {
  commandId: string;
  idempotencyKey: string;
  clientMode: TerminalMode;
  terminalSessionId: string;
  deviceSessionId: string;
  matchId: string;
  expectedMatchVersion: number;
  expectedAssignmentVersion: number;
  clientSequence: number;
  clientTimestamp: IsoDateTime;
  visit: {
    clientVisitId: string;
    participantId: string;
    setNumber: number;
    legNumber: number;
    visitNumber: number;
    pointsScored: number;
    remainingPoints: number;
    checkoutAttempt: boolean;
    darts: ScoreDartInput[];
  };
};

export type TerminalSessionRecord = {
  id: string;
  tournamentId: string;
  deviceSessionId: string;
  mode: TerminalMode;
  status: TerminalSessionStatus;
  assignedMatchId: string | null;
  lastServerCursor: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type AssignedMatchSnapshotRecord = {
  id: string;
  terminalSessionId: string;
  matchId: string;
  assignmentVersion: number;
  matchVersion: number;
  scoringStatus: string;
  snapshot: Record<string, unknown>;
  serverCursor: string | null;
  updatedAt: IsoDateTime;
};

export type PendingScoringOperationRecord = {
  id: string;
  terminalSessionId: string;
  matchId: string;
  commandKind: 'submit_score_visit';
  commandId: string;
  idempotencyKey: string;
  payload: SubmitScoreVisitCommand;
  status: PendingOperationStatus;
  attempts: number;
  nextAttemptAt: IsoDateTime;
  lastAttemptAt: IsoDateTime | null;
  serverEventId: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type SyncStateRecord = {
  terminalSessionId: string;
  connectionState: SyncConnectionState;
  lastServerCursor: string | null;
  resyncRequired: boolean;
  lastSyncAttemptAt: IsoDateTime | null;
  lastSyncSuccessAt: IsoDateTime | null;
  updatedAt: IsoDateTime;
};

export type ConflictMarkerRecord = {
  id: string;
  terminalSessionId: string;
  operationId: string | null;
  matchId: string;
  conflictKind: ConflictKind;
  reasonCode: string;
  message: string;
  serverState: Record<string, unknown> | null;
  createdAt: IsoDateTime;
  resolvedAt: IsoDateTime | null;
};

export type SyncPullItem = {
  syncOperationID: string;
  targetType: string;
  targetID: string;
  operationType: string;
  status: string;
  payload: Record<string, unknown>;
  receivedAt: IsoDateTime;
};
