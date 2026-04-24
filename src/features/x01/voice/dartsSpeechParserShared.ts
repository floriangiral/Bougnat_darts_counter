import type { DartMultiplier, DartsSpeechCoverage, DartsSpeechParseResult, ParseDartsSpeechContext, ParsedDart, VoiceConfidenceTier } from './dartsSpeechTypes';
import type { DartsSpeechParserToken } from './dartsSpeechParserToken';

export type NormalizedParseContext = Required<Omit<ParseDartsSpeechContext, 'confidence'>> & {
  confidence: number | null;
};

export type TokenizationResult = {
  tokens: DartsSpeechParserToken[];
  unknownCount: number;
  originalCount: number;
  rawTokens: string[];
};

export const normalizeContext = (contextOrConfidence?: ParseDartsSpeechContext | number | null): NormalizedParseContext => {
  if (typeof contextOrConfidence === 'number' || contextOrConfidence === null || contextOrConfidence === undefined) {
    const confidence = typeof contextOrConfidence === 'number' ? contextOrConfidence : null;
    return {
      confidence,
      dartsAlreadyThrown: 0,
      currentRemainingScore: 0,
      startingScoreBeforeTurn: 0,
      maxDartsPerTurn: 3,
    };
  }

  return {
    confidence: contextOrConfidence.confidence ?? null,
    dartsAlreadyThrown: Math.max(0, contextOrConfidence.dartsAlreadyThrown ?? 0),
    currentRemainingScore: Math.max(0, contextOrConfidence.currentRemainingScore ?? 0),
    startingScoreBeforeTurn: Math.max(
      0,
      contextOrConfidence.startingScoreBeforeTurn ?? contextOrConfidence.currentRemainingScore ?? 0,
    ),
    maxDartsPerTurn: Math.max(1, contextOrConfidence.maxDartsPerTurn ?? 3),
  };
};

export const getConfidenceTier = (confidence: number | null): VoiceConfidenceTier | null => {
  if (confidence === null) return null;
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.65) return 'medium';
  return 'low';
};

export const buildResult = (
  transcript: string,
  normalizedTranscript: string,
  partial: Partial<DartsSpeechParseResult>,
): DartsSpeechParseResult => {
  const status = partial.status ?? 'invalid';

  return {
    transcript,
    normalizedTranscript,
    status,
    mode: partial.mode ?? null,
    intent: partial.intent ?? null,
    coverage: partial.coverage ?? null,
    score: partial.score ?? null,
    remainingScore: partial.remainingScore ?? null,
    darts: partial.darts ?? [],
    consumedDarts: partial.consumedDarts ?? null,
    requiresConfirmation: partial.requiresConfirmation ?? status !== 'valid',
    reason: partial.reason ?? null,
    confidence: partial.confidence ?? null,
    confidenceTier: partial.confidenceTier ?? null,
  };
};

export const buildDart = (multiplier: DartMultiplier, value: number): ParsedDart | null => {
  if (multiplier === 'single' && value === 25) {
    return { label: 'Outer Bull', multiplier, value, score: 25 };
  }

  if (multiplier === 'single' && value === 50) {
    return { label: 'Bull', multiplier, value, score: 50 };
  }

  if (value < 0 || value > 20) {
    return null;
  }

  const score = multiplier === 'single' ? value : multiplier === 'double' ? value * 2 : value * 3;
  return {
    label: multiplier === 'single' ? `S${value}` : multiplier === 'double' ? `D${value}` : `T${value}`,
    multiplier,
    value,
    score,
  };
};

export const buildScoredDart = (score: number): ParsedDart => {
  if (score === 0) {
    return { label: 'Miss', multiplier: 'single', value: 0, score: 0 };
  }

  return {
    label: `Score ${score}`,
    multiplier: 'single',
    value: score,
    score,
  };
};

export const resolveResultTier = (
  confidenceTier: VoiceConfidenceTier | null,
  options?: { ambiguous?: boolean; hadNormalizationAdjustment?: boolean; explicitOnly?: boolean },
): VoiceConfidenceTier | null => {
  if (confidenceTier === 'low') return 'low';
  if (options?.ambiguous) return 'medium';
  if (options?.explicitOnly) return 'high';
  if (options?.hadNormalizationAdjustment) return 'medium';
  return confidenceTier ?? 'medium';
};

export const validateScoreAgainstContext = (score: number, context: NormalizedParseContext): string | null => {
  if (score > 180) {
    return 'Score superieur a 180.';
  }

  if (context.currentRemainingScore > 0 && score > context.currentRemainingScore) {
    return 'Score annonce superieur au score restant.';
  }

  return null;
};

export const classifyCoverage = (dartsCount: number, context: NormalizedParseContext): DartsSpeechCoverage => {
  if (dartsCount <= 0) return null;
  if (dartsCount === 1) return 'single_dart';
  if (context.dartsAlreadyThrown === 0 && dartsCount === context.maxDartsPerTurn) return 'full_turn';
  return 'partial_turn';
};
