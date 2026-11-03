import type { DartMultiplier, DartsSpeechParseResult, ParsedDart, VoiceConfidenceTier } from './dartsSpeechTypes';
import { tokenize, hasTooMuchUnknownNoise } from './dartsSpeechParserTokenization';
import { buildDart, buildResult, buildScoredDart, classifyCoverage, resolveResultTier, validateScoreAgainstContext, type NormalizedParseContext } from './dartsSpeechParserShared';
import { detectIntent, extractNumberTokens, parseSpokenNumber } from './dartsSpeechParserIntent';
import { MISS_WORDS } from './dartsSpeechParserLexicon';

const getScoreResultStatus = (
  validationError: string | null,
  confidenceTier: VoiceConfidenceTier | null,
): DartsSpeechParseResult['status'] => {
  if (validationError) return 'invalid';
  return confidenceTier === 'medium' ? 'ambiguous' : 'valid';
};

const getConfidenceReason = (confidenceTier: VoiceConfidenceTier | null): string | null => (
  confidenceTier === 'medium' ? 'Confiance moyenne, confirmation explicite requise.' : null
);

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
    status: getScoreResultStatus(validationError, confidenceTier),
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
    reason: validationError ?? getConfidenceReason(confidenceTier),
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
    status: getScoreResultStatus(validationError, confidenceTier),
    mode: 'remaining',
    intent: 'remaining_score',
    coverage: 'full_turn',
    score: validationError ? null : score,
    remainingScore,
    consumedDarts: context.maxDartsPerTurn - context.dartsAlreadyThrown,
    requiresConfirmation: !validationError && confidenceTier !== 'high',
    reason: validationError ?? getConfidenceReason(confidenceTier),
    confidence: context.confidence,
    confidenceTier: resolveResultTier(confidenceTier),
  });
}

type ParsedDartsSequence = {
  darts: ParsedDart[];
  hasImplicitMultiplier: boolean;
  hasOnlyExplicitMultipliers: boolean;
};

type DartsSequenceTokenState = ParsedDartsSequence & {
  pendingMultiplier: DartMultiplier | null;
};

const parseRawScoreChain = (
  transcript: string,
  normalizedTranscript: string,
  rawTokens: string[],
  tokens: ReturnType<typeof tokenize>['tokens'],
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
): DartsSpeechParseResult | null => {
  const isRawScoreChain = rawTokens.every((token) => /^\d+$/.test(token) || MISS_WORDS.has(token));
  const hasOnlyValuesAndMisses = tokens.every((token) => token.type === 'value' || token.type === 'miss');
  if (!isRawScoreChain || !hasOnlyValuesAndMisses) return null;

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

  const scoredDarts = tokens.map((token) => buildScoredDart(token.type === 'miss' ? 0 : token.value));
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
  const explicitSingleMiss = scoredDarts.length === 1
    && availableDarts === 1
    && scoredDarts[0]?.score === 0
    && coverage === 'single_dart';
  let status: DartsSpeechParseResult['status'] = 'ambiguous';
  if (validationError) status = 'invalid';
  else if (explicitSingleMiss) status = 'valid';

  return buildResult(transcript, normalizedTranscript, {
    status,
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
};

const buildSequenceFailure = (
  transcript: string,
  normalizedTranscript: string,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
  status: 'invalid' | 'ambiguous',
  reason: string,
  requiresConfirmation = false,
): DartsSpeechParseResult => buildResult(transcript, normalizedTranscript, {
    status,
    intent: 'darts_sequence',
    reason,
    requiresConfirmation,
    confidence: context.confidence,
    confidenceTier: status === 'ambiguous'
      ? resolveResultTier(confidenceTier, { ambiguous: true })
      : confidenceTier,
  });

const parseMultiplierToken = (
  transcript: string,
  normalizedTranscript: string,
  state: DartsSequenceTokenState,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
  value: DartMultiplier,
): DartsSpeechParseResult | null => {
  if (state.pendingMultiplier) {
    return buildSequenceFailure(
      transcript,
      normalizedTranscript,
      context,
      confidenceTier,
      'ambiguous',
      'Multiplicateurs successifs non resolus.',
      true,
    );
  }
  state.pendingMultiplier = value;
  return null;
};

const parseMissToken = (
  transcript: string,
  normalizedTranscript: string,
  state: DartsSequenceTokenState,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
): DartsSpeechParseResult | null => {
  if (state.pendingMultiplier) {
    return buildSequenceFailure(
      transcript,
      normalizedTranscript,
      context,
      confidenceTier,
      'invalid',
      'Miss apres multiplicateur incomplet.',
    );
  }
  state.darts.push({ label: 'Miss', multiplier: 'single', value: 0, score: 0 });
  return null;
};

const parseValueToken = (
  transcript: string,
  normalizedTranscript: string,
  value: number,
  state: DartsSequenceTokenState,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
): DartsSpeechParseResult | null => {
  if (state.pendingMultiplier && (value === 25 || value === 50)) {
    return buildSequenceFailure(
      transcript,
      normalizedTranscript,
      context,
      confidenceTier,
      'invalid',
      'Bull et demi-bulle ne peuvent pas avoir de multiplicateur.',
    );
  }

  const multiplier = state.pendingMultiplier ?? 'single';
  const dart = buildDart(multiplier, value);
  if (!dart) {
    return buildSequenceFailure(
      transcript,
      normalizedTranscript,
      context,
      confidenceTier,
      'invalid',
      `Valeur darts invalide: ${value}.`,
    );
  }

  if (!state.pendingMultiplier && value >= 1 && value <= 20) {
    state.hasImplicitMultiplier = true;
    state.hasOnlyExplicitMultipliers = false;
  }

  state.darts.push(dart);
  state.pendingMultiplier = null;
  return null;
};

const parseSequenceToken = (
  transcript: string,
  normalizedTranscript: string,
  token: ReturnType<typeof tokenize>['tokens'][number],
  state: DartsSequenceTokenState,
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
): DartsSpeechParseResult | null => {
  if (token.type === 'multiplier') {
    return parseMultiplierToken(
      transcript,
      normalizedTranscript,
      state,
      context,
      confidenceTier,
      token.value,
    );
  }
  if (token.type === 'miss') {
    return parseMissToken(transcript, normalizedTranscript, state, context, confidenceTier);
  }
  if (token.type === 'value') {
    return parseValueToken(
      transcript,
      normalizedTranscript,
      token.value,
      state,
      context,
      confidenceTier,
    );
  }
  return null;
};

const parseSequenceTokens = (
  transcript: string,
  normalizedTranscript: string,
  tokens: ReturnType<typeof tokenize>['tokens'],
  context: NormalizedParseContext,
  confidenceTier: VoiceConfidenceTier | null,
): ParsedDartsSequence | DartsSpeechParseResult => {
  const state: DartsSequenceTokenState = {
    darts: [],
    pendingMultiplier: null,
    hasImplicitMultiplier: false,
    hasOnlyExplicitMultipliers: true,
  };

  for (const token of tokens) {
    const failure = parseSequenceToken(
      transcript,
      normalizedTranscript,
      token,
      state,
      context,
      confidenceTier,
    );
    if (failure) return failure;
  }

  if (state.pendingMultiplier) {
    return buildSequenceFailure(
      transcript,
      normalizedTranscript,
      context,
      confidenceTier,
      'ambiguous',
      'Annonce incomplete apres multiplicateur.',
      true,
    );
  }

  return state;
};

const getDartsSequenceReason = (
  validationError: string | null,
  hasImplicitMultiplier: boolean,
  partialWithoutContext: boolean,
  confidenceTier: VoiceConfidenceTier | null,
): string | null => {
  if (validationError) return validationError;
  if (hasImplicitMultiplier) return 'Multiplicateurs implicites a confirmer.';
  if (partialWithoutContext) return 'Annonce partielle detectee sans contexte suffisant pour couvrir tout le tour.';
  return getConfidenceReason(confidenceTier);
};

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

  const rawScoreResult = parseRawScoreChain(
    transcript,
    normalizedTranscript,
    tokenization.rawTokens,
    tokens,
    context,
    confidenceTier,
  );
  if (rawScoreResult) return rawScoreResult;

  const parsedSequence = parseSequenceTokens(
    transcript,
    normalizedTranscript,
    tokens,
    context,
    confidenceTier,
  );
  if ('status' in parsedSequence) return parsedSequence;

  const { darts, hasImplicitMultiplier, hasOnlyExplicitMultipliers } = parsedSequence;
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

  return buildResult(transcript, normalizedTranscript, {
    status: getScoreResultStatus(validationError, ambiguous ? 'medium' : 'high'),
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
    reason: getDartsSequenceReason(
      validationError,
      hasImplicitMultiplier,
      partialWithoutContext,
      confidenceTier,
    ),
    confidence: context.confidence,
    confidenceTier: resolveResultTier(confidenceTier, {
      ambiguous,
      hadNormalizationAdjustment,
      explicitOnly: hasOnlyExplicitMultipliers && !hasImplicitMultiplier,
    }),
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
