import { describe, expect, it } from 'vitest';

import {
  buildVoiceRuntimeIssueMessage,
  buildVoiceStateLabel,
  createNextVoiceAttempt,
  isVoiceAttemptCurrent,
  resolveVoiceStartFailureCause,
} from '../../../src/features/x01/voice/voiceSessionModel';

describe('voice session model', () => {
  it('increments attempts and invalidates stale sessions', () => {
    const firstAttempt = { id: 1, sessionKey: 'match:1' };
    const nextAttempt = createNextVoiceAttempt(firstAttempt, 'match:2');

    expect(nextAttempt).toEqual({ id: 2, sessionKey: 'match:2' });
    expect(isVoiceAttemptCurrent(nextAttempt, nextAttempt)).toBe(true);
    expect(isVoiceAttemptCurrent(nextAttempt, firstAttempt)).toBe(false);
  });

  it('classifies microphone, token and audio failures', () => {
    expect(resolveVoiceStartFailureCause(new DOMException('denied', 'NotAllowedError'))).toBe('microphone');
    expect(resolveVoiceStartFailureCause(new Error('Voice token request failed (503)'))).toBe('token');
    expect(resolveVoiceStartFailureCause(new Error('AudioWorklet non supporte'))).toBe('audio');
  });

  it('builds explicit issue messages and labels', () => {
    expect(buildVoiceRuntimeIssueMessage('timeout')).toBe('Aucune annonce detectee, repasse en saisie manuelle ou relance l ecoute.');
    expect(buildVoiceStateLabel('listening', null)).toBe('Ecoute en cours');
    expect(buildVoiceStateLabel('error', 'connection')).toBe('Connexion vocale indisponible.');
  });
});