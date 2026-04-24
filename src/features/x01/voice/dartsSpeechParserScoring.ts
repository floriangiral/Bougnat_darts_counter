import type { DartMultiplier, DartsSpeechParseResult, ParsedDart, VoiceConfidenceTier } from './dartsSpeechTypes';
import { tokenize, hasTooMuchUnknownNoise } from './dartsSpeechParserTokenization';
import { buildDart, buildResult, buildScoredDart, classifyCoverage, resolveResultTier, validateScoreAgainstContext, type NormalizedParseContext } from './dartsSpeechParserShared';
import { detectIntent, extractNumberTokens, parseSpokenNumber } from './dartsSpeechParserIntent';
import { HALF_BULL_WORDS, MISS_WORDS, MULTIPLIER_WORDS, BULL_WORDS } from './dartsSpeechParserLexicon';

function parseAsTurnScore(
  transcript: string,
  normalizedTranscript: string,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
): DartsSpeechParseResult | null {
  const numberTokens = extractNumberTokens(normalizedTranscript, 'turn_score');
  const score = parseSpokenNumber(numberTokens);

  if (score === null) {
    return null;
  }

  const validationError = validateScoreAgainstContext(score, context);
  return buildResult(transcript, normalizedTranscript, {
    status: validationError ? 'invalid' : confidenceTier === 'medium' ? 'ambiguous' : 'valid',
    mode: 'total',
    intent: 'turn_score',
    coverage: context.dartsAlreadyThrown > 0 ? 'partial_turn' : 'full_turn',
    score: validationError ? null : score,
    remainingScore:
      !validationError && context.startingScoreBeforeTurn > 0
        ? Math.max(0, context.startingScoreBeforeTurn - score)
        : null,
    consumedDarts: context.maxDartsPerTurn - context.dartsAlreadyThrown,
    requiresConfirmation: !validationError && confidenceTier !== 'high',
    reason: validationError ?? (confidenceTier === 'medium' ? 'Confiance moyenne, confirmation explicite requise.' : null),
    confidence: context.confidence,
    confidenceTier: resolveResultTier(confidenceTier),
  });
}

function parseAsRemainingScore(
  transcript: string,
  normalizedTranscript: string,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
): DartsSpeechParseResult {
  const numberTokens = extractNumberTokens(normalizedTranscript, 'remaining_score');
  const remainingScore = parseSpokenNumber(numberTokens);

  if (remainingScore === null) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'invalid',
      mode: 'remaining',
      intent: 'remaining_score',
      reason: 'Score restant non reconnu.',
      confidence: context.confidence,
      confidenceTier,
    });
  }

  const startingScore = context.startingScoreBeforeTurn || context.currentRemainingScore;
  if (startingScore <= 0) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'ambiguous',
      mode: 'remaining',
      intent: 'remaining_score',
      remainingScore,
      requiresConfirmation: true,
      reason: 'Contexte du score de depart manquant pour calculer le score marque.',
      confidence: context.confidence,
      confidenceTier: resolveResultTier(confidenceTier, { ambiguous: true }),
    });
  }

  if (remainingScore > startingScore) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'invalid',
      mode: 'remaining',
      intent: 'remaining_score',
      remainingScore,
      reason: 'Score restant annonce incoherent avec le score de depart.',
      confidence: context.confidence,
      confidenceTier,
    });
  }

  const score = startingScore - remainingScore;
  const validationError = validateScoreAgainstContext(score, {
    ...context,
    currentRemainingScore: startingScore,
  });

  return buildResult(transcript, normalizedTranscript, {
    status: validationError ? 'invalid' : confidenceTier === 'medium' ? 'ambiguous' : 'valid',
    mode: 'remaining',
    intent: 'remaining_score',
    coverage: 'full_turn',
    score: validationError ? null : score,
    remainingScore,
    consumedDarts: context.maxDartsPerTurn - context.dartsAlreadyThrown,
    requiresConfirmation: !validationError && confidenceTier !== 'high',
    reason: validationError ?? (confidenceTier === 'medium' ? 'Confiance moyenne, confirmation explicite requise.' : null),
    confidence: context.confidence,
    confidenceTier: resolveResultTier(confidenceTier),
  });
}

function parseAsDartsSequence(
  transcript: string,
  normalizedTranscript: string,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
  hadNormalizationAdjustment: boolean,
): DartsSpeechParseResult {
  const tokenization = tokenize(normalizedTranscript);
  const { tokens } = tokenization;

  if (!tokens.length) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'invalid',
      intent: 'darts_sequence',
      reason: 'Aucune annonce darts reconnue.',
      confidence: context.confidence,
      confidenceTier,
    });
  }

  if (hasTooMuchUnknownNoise(tokenization)) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'ambiguous',
      intent: 'darts_sequence',
      reason: 'Transcription trop bruitee pour etre interpretee avec certitude.',
      requiresConfirmation: true,
      confidence: context.confidence,
      confidenceTier: resolveResultTier(confidenceTier, { ambiguous: true, hadNormalizationAdjustment: true }),
    });
  }

  const isRawScoreChain = tokenization.rawTokens.every((token) => /^\d+$/.test(token) || MISS_WORDS.has(token));
  if (isRawScoreChain && tokens.every((token) => token.type === 'value' || token.type === 'miss')) {
    const availableDarts = Math.max(0, context.maxDartsPerTurn - context.dartsAlreadyThrown);
    if (tokens.length > availableDarts) {
      return buildResult(transcript, normalizedTranscript, {
        status: 'invalid',
        intent: 'darts_sequence',
        consumedDarts: tokens.length,
        reason: 'Plus de flechettes annoncees que possible dans le contexte du tour.',
        confidence: context.confidence,
        confidenceTier,
      });
    }

    const scoredDarts = tokens.map((token) => {
      if (token.type === 'miss') {
        return buildScoredDart(0);
      }

      return buildScoredDart(token.value);
    });

    const invalidScore = scoredDarts.find((dart) => dart.score < 0 || dart.score > 60);
    if (invalidScore) {
      return buildResult(transcript, normalizedTranscript, {
        status: 'invalid',
        intent: 'darts_sequence',
        consumedDarts: scoredDarts.length,
        reason: `Score de flechette invalide: ${invalidScore.score}.`,
        confidence: context.confidence,
        confidenceTier,
      });
    }

    const score = scoredDarts.reduce((sum, dart) => sum + dart.score, 0);
    const validationError = validateScoreAgainstContext(score, context);
    const coverage = classifyCoverage(scoredDarts.length, context);
    const explicitSingleMiss =
      scoredDarts.length === 1
      && availableDarts === 1
      && scoredDarts[0]?.score === 0
      && coverage === 'single_dart';

    return buildResult(transcript, normalizedTranscript, {
      status: validationError ? 'invalid' : explicitSingleMiss ? 'valid' : 'ambiguous',
      mode: 'darts',
      intent: 'darts_sequence',
      coverage,
      score: validationError ? null : score,
      remainingScore:
        !validationError && context.startingScoreBeforeTurn > 0
          ? Math.max(0, context.startingScoreBeforeTurn - score)
          : null,
      darts: scoredDarts,
      consumedDarts: scoredDarts.length,
      requiresConfirmation: !validationError && !explicitSingleMiss,
      reason: validationError ?? (explicitSingleMiss ? null : 'Scores de flechettes annonces a confirmer.'),
      confidence: context.confidence,
      confidenceTier: resolveResultTier(confidenceTier, { ambiguous: !explicitSingleMiss }),
    });
  }

  const darts: ParsedDart[] = [];
  let pendingMultiplier: DartMultiplier | null = null;
  let hasImplicitMultiplier = false;
  let hasOnlyExplicitMultipliers = true;

  for (const token of tokens) {
    if (token.type === 'multiplier') {
      if (pendingMultiplier) {
        return buildResult(transcript, normalizedTranscript, {
          status: 'ambiguous',
          intent: 'darts_sequence',
          reason: 'Multiplicateurs successifs non resolus.',
          requiresConfirmation: true,
          confidence: context.confidence,
          confidenceTier: resolveResultTier(confidenceTier, { ambiguous: true }),
        });
      }

      pendingMultiplier = token.value;
      continue;
    }

    if (token.type === 'miss') {
      if (pendingMultiplier) {
        return buildResult(transcript, normalizedTranscript, {
          status: 'invalid',
          intent: 'darts_sequence',
          reason: 'Miss apres multiplicateur incomplet.',
          confidence: context.confidence,
          confidenceTier,
        });
      }

      darts.push({ label: 'Miss', multiplier: 'single', value: 0, score: 0 });
      continue;
    }

    if (token.type !== 'value') {
      continue;
    }

    if (pendingMultiplier && (token.value === 25 || token.value === 50)) {
      return buildResult(transcript, normalizedTranscript, {
        status: 'invalid',
        intent: 'darts_sequence',
        reason: 'Bull et demi-bulle ne peuvent pas avoir de multiplicateur.',
        confidence: context.confidence,
        confidenceTier,
      });
    }

    const multiplier = pendingMultiplier ?? 'single';
    const dart = buildDart(multiplier, token.value);

    if (!dart) {
      return buildResult(transcript, normalizedTranscript, {
        status: 'invalid',
        intent: 'darts_sequence',
        reason: `Valeur darts invalide: ${token.value}.`,
        confidence: context.confidence,
        confidenceTier,
      });
    }

    if (!pendingMultiplier && token.value >= 1 && token.value <= 20) {
      hasImplicitMultiplier = true;
      hasOnlyExplicitMultipliers = false;
    }

    darts.push(dart);
    pendingMultiplier = null;
  }

  if (pendingMultiplier) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'ambiguous',
      intent: 'darts_sequence',
      reason: 'Annonce incomplete apres multiplicateur.',
      requiresConfirmation: true,
      confidence: context.confidence,
      confidenceTier: resolveResultTier(confidenceTier, { ambiguous: true }),
    });
  }

  const availableDarts = Math.max(0, context.maxDartsPerTurn - context.dartsAlreadyThrown);
  if (darts.length > availableDarts) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'invalid',
      intent: 'darts_sequence',
      darts,
      consumedDarts: darts.length,
      reason: 'Plus de flechettes annoncees que possible dans le contexte du tour.',
      confidence: context.confidence,
      confidenceTier,
    });
  }

  const score = darts.reduce((sum, dart) => sum + dart.score, 0);
  const validationError = validateScoreAgainstContext(score, context);
  const coverage = classifyCoverage(darts.length, context);
  const partialWithoutContext = context.dartsAlreadyThrown === 0 && darts.length < context.maxDartsPerTurn;
  const ambiguous = hasImplicitMultiplier || partialWithoutContext || confidenceTier === 'medium';
  const resolvedTier = resolveResultTier(confidenceTier, {
    ambiguous,
    hadNormalizationAdjustment,
    explicitOnly: hasOnlyExplicitMultipliers && !hasImplicitMultiplier,
  });

  return buildResult(transcript, normalizedTranscript, {
    status: validationError ? 'invalid' : ambiguous ? 'ambiguous' : 'valid',
    mode: 'darts',
    intent: 'darts_sequence',
    coverage,
    score: validationError ? null : score,
    remainingScore:
      !validationError && context.startingScoreBeforeTurn > 0
        ? Math.max(0, context.startingScoreBeforeTurn - score)
        : null,
    darts,
    consumedDarts: darts.length,
    requiresConfirmation: !validationError && ambiguous,
    reason: validationError
      ?? (hasImplicitMultiplier
        ? 'Multiplicateurs implicites a confirmer.'
        : partialWithoutContext
          ? 'Annonce partielle detectee sans contexte suffisant pour couvrir tout le tour.'
          : confidenceTier === 'medium'
            ? 'Confiance moyenne, confirmation explicite requise.'
            : null),
    confidence: context.confidence,
    confidenceTier: resolvedTier,
  });
}

export const parseDartsSpeechScoring = (
  transcript: string,
  normalizedTranscript: string,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
  hadNormalizationAdjustment: boolean,
): DartsSpeechParseResult => {
  const intent = detectIntent(normalizedTranscript);

  if (intent === 'remaining_score') {
    return parseAsRemainingScore(transcript, normalizedTranscript, context, confidenceTier);
  }

  if (intent === 'turn_score') {
    const totalResult = parseAsTurnScore(transcript, normalizedTranscript, context, confidenceTier);
    if (totalResult) {
      return totalResult;
    }
  }

  return parseAsDartsSequence(
    transcript,
    normalizedTranscript,
    context,
    confidenceTier,
    hadNormalizationAdjustment,
  );
};
