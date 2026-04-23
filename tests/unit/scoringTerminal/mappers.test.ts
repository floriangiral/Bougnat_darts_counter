import { describe, expect, it } from 'vitest';

import { toBackendSubmitScoreRequest } from '../../../src/features/scoring-terminal/application/mappers';
import type { SubmitScoreVisitCommand } from '../../../src/features/scoring-terminal/domain/types';

// Spec ref: spec:counter/scoring-access-modes
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

describe('toBackendSubmitScoreRequest', () => {
  it('includes source_device_id for dedicated tablet mode', () => {
    const payload = toBackendSubmitScoreRequest(baseCommand());

    expect(payload.client_mode).toBe('dedicated_tablet');
    expect(payload.source_device_id).toBe('00000000-0000-0000-0000-000000000777');
  });

  it('omits source_device_id for personal phone mode', () => {
    const payload = toBackendSubmitScoreRequest({
      ...baseCommand(),
      clientMode: 'personal_phone',
    });

    expect(payload.client_mode).toBe('personal_phone');
    expect(payload.source_device_id).toBeUndefined();
  });
});
