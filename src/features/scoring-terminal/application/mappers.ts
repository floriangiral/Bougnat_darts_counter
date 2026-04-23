import type { SubmitScoreVisitCommand } from '../domain/types';

// Spec: spec:counter/scoring-access-modes
export type BackendSubmitScoreRequest = {
  match_id: string;
  participant_id: string;
  client_event_id: string;
  idempotency_key: string;
  client_mode: 'dedicated_tablet' | 'personal_phone';
  aggregate_version: number;
  set_number: number;
  leg_number: number;
  visit_number: number;
  points_scored: number;
  remaining_points: number;
  checkout_attempt: boolean;
  source_device_id?: string;
  darts: Array<{
    dart_index: number;
    segment: string;
    multiplier: number;
    points: number;
  }>;
};

export type BackendSyncPushOperation = {
  client_operation_id: string;
  idempotency_key: string;
  base_row_version: number;
  target_type: 'match';
  target_id: string;
  operation_type: 'score_submit';
  payload: Record<string, unknown>;
};

export const toBackendSubmitScoreRequest = (command: SubmitScoreVisitCommand): BackendSubmitScoreRequest => {
  // Invariant: backend receives aggregate_version as expected version + 1 for optimistic concurrency.
  const aggregateVersion = command.expectedMatchVersion + 1;

  const payload: BackendSubmitScoreRequest = {
    match_id: command.matchId,
    participant_id: command.visit.participantId,
    client_event_id: command.visit.clientVisitId,
    idempotency_key: command.idempotencyKey,
    client_mode: command.clientMode,
    aggregate_version: aggregateVersion,
    set_number: command.visit.setNumber,
    leg_number: command.visit.legNumber,
    visit_number: command.visit.visitNumber,
    points_scored: command.visit.pointsScored,
    remaining_points: command.visit.remainingPoints,
    checkout_attempt: command.visit.checkoutAttempt,
    darts: command.visit.darts.map((dart) => ({
      dart_index: dart.dartIndex,
      segment: dart.segment,
      multiplier: dart.multiplier,
      points: dart.points,
    })),
  };

  if (command.clientMode === 'dedicated_tablet') {
    // Invariant: source_device_id is sent only for dedicated tablet mode.
    payload.source_device_id = command.deviceSessionId;
  }

  return payload;
};

export const toBackendSyncPushOperation = (command: SubmitScoreVisitCommand): BackendSyncPushOperation => ({
  client_operation_id: command.commandId,
  idempotency_key: command.idempotencyKey,
  base_row_version: command.expectedMatchVersion,
  target_type: 'match',
  target_id: command.matchId,
  operation_type: 'score_submit',
  payload: {
    command_id: command.commandId,
    expected_assignment_version: command.expectedAssignmentVersion,
    client_sequence: command.clientSequence,
    client_timestamp: command.clientTimestamp,
    visit: command.visit,
  },
});
