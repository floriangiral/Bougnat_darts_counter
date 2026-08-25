import { parseDartsSpeechTranscript } from './dartsSpeechParser';
import type {
  DeepgramUtterance,
  DartsSpeechParseResult,
  ParseDartsSpeechContext,
  VoiceScoreProposalState,
} from './dartsSpeechTypes';

type BuildVoiceScoreProposalInput = DeepgramUtterance & {
  context: ParseDartsSpeechContext;
};

export function buildVoiceScoreProposal({
  confidence: _confidence,
  context,
  transcript,
  trigger,
}: BuildVoiceScoreProposalInput): VoiceScoreProposalState {
  const parsedResult = parseDartsSpeechTranscript(transcript, context);
  const guidance = buildVoiceProposalGuidance(parsedResult, context);
  const result = guidance && guidance !== parsedResult.reason
    ? { ...parsedResult, reason: guidance }
    : parsedResult;

  return {
    guidance,
    prefillScore: shouldPrefillVoiceProposalScore(result) ? String(result.score) : null,
    result,
    transcript,
    trigger,
  };
}

export function shouldPrefillVoiceProposalScore(result: DartsSpeechParseResult): boolean {
  if (result.status === 'invalid' || result.score === null) {
    return false;
  }

  if (result.intent === 'turn_score' || result.intent === 'remaining_score') {
    return true;
  }

  return result.mode === 'darts' && result.status === 'valid' && result.coverage === 'full_turn';
}

export function buildVoiceProposalGuidance(
  result: DartsSpeechParseResult,
  context: ParseDartsSpeechContext,
): string | null {
  if (result.status === 'invalid') {
    return result.reason;
  }

  if (result.mode === 'darts' && result.coverage === 'partial_turn') {
    return 'Annonce partielle reconnue, confirmation explicite requise.';
  }

  if (result.mode === 'darts' && result.requiresConfirmation) {
    return 'Sequence de flechettes reconnue, confirmation explicite requise.';
  }

  if (
    result.intent === 'remaining_score'
    && result.remainingScore !== null
    && (context.startingScoreBeforeTurn ?? context.currentRemainingScore ?? 0) <= 170
  ) {
    return result.reason ?? 'Annonce de checkout reconnue, verification explicite recommandee.';
  }

  return result.reason;
}