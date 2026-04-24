import { normalizeDartsTranscript } from './dartsSpeechNormalizer';
import type { ParseDartsSpeechContext, DartsSpeechParseResult } from './dartsSpeechTypes';
import { normalizeContext, getConfidenceTier } from './dartsSpeechParserShared';
import { parseDartsSpeechScoring } from './dartsSpeechParserScoring';

export function parseDartsSpeechTranscript(
  transcript: string,
  contextOrConfidence?: ParseDartsSpeechContext | number | null,
): DartsSpeechParseResult {
  const context = normalizeContext(contextOrConfidence);
  const normalizedTranscript = normalizeDartsTranscript(transcript);
  const confidenceTier = getConfidenceTier(context.confidence);
  const hadNormalizationAdjustment = normalizedTranscript !== transcript.toLowerCase().trim();

  if (!normalizedTranscript) {
    return {
      transcript,
      normalizedTranscript,
      status: 'invalid',
      mode: null,
      intent: null,
      coverage: null,
      score: null,
      remainingScore: null,
      darts: [],
      consumedDarts: null,
      requiresConfirmation: true,
      reason: 'Transcription vide.',
      confidence: context.confidence,
      confidenceTier,
    };
  }

  if (confidenceTier === 'low') {
    return {
      transcript,
      normalizedTranscript,
      status: 'invalid',
      mode: null,
      intent: null,
      coverage: null,
      score: null,
      remainingScore: null,
      darts: [],
      consumedDarts: null,
      requiresConfirmation: true,
      reason: 'Confiance Deepgram trop faible.',
      confidence: context.confidence,
      confidenceTier,
    };
  }

  return parseDartsSpeechScoring(
    transcript,
    normalizedTranscript,
    context,
    confidenceTier,
    hadNormalizationAdjustment,
  );
}
