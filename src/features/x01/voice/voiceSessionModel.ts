import type { VoiceRuntimeIssue, VoiceScoringStatus } from './dartsSpeechTypes';

export type VoiceAttempt = {
  id: number;
  sessionKey: string;
};

export function createNextVoiceAttempt(currentAttempt: VoiceAttempt, sessionKey: string): VoiceAttempt {
  return {
    id: currentAttempt.id + 1,
    sessionKey,
  };
}

export function isVoiceAttemptCurrent(activeAttempt: VoiceAttempt, candidateAttempt: VoiceAttempt): boolean {
  return activeAttempt.id === candidateAttempt.id && activeAttempt.sessionKey === candidateAttempt.sessionKey;
}

export function resolveVoiceStartFailureCause(error: unknown): VoiceRuntimeIssue {
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') {
      return 'connection';
    }

    if (['NotAllowedError', 'NotFoundError', 'NotReadableError', 'SecurityError'].includes(error.name)) {
      return 'microphone';
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('token')) {
      return 'token';
    }

    if (message.includes('audio') || message.includes('worklet')) {
      return 'audio';
    }

    if (message.includes('micro')) {
      return 'microphone';
    }
  }

  return 'connection';
}

export function buildVoiceRuntimeIssueMessage(issue: VoiceRuntimeIssue): string {
  switch (issue) {
    case 'audio':
      return 'Capture audio indisponible.';
    case 'connection':
      return 'Connexion vocale indisponible.';
    case 'microphone':
      return 'Micro indisponible ou refusé.';
    case 'timeout':
      return 'Aucune annonce détectée. Relance l’écoute.';
    case 'token':
      return 'Jeton vocal indisponible.';
    case 'transcript':
      return 'Transcription vocale trop ambiguë.';
  }
}

export function buildVoiceStateLabel(state: VoiceScoringStatus, issue: VoiceRuntimeIssue | null): string {
  if (state === 'processing') {
    return issue ? `Traitement vocal - ${buildVoiceRuntimeIssueMessage(issue)}` : 'Traitement vocal';
  }

  if (state === 'listening') {
    return 'Écoute en cours';
  }

  if (state === 'error' && issue) {
    return buildVoiceRuntimeIssueMessage(issue);
  }

  return 'Scoring vocal';
}
