import { normalizeDartsTranscript } from './dartsSpeechNormalizer';
import type {
  DartMultiplier,
  DartsSpeechIntent,
  DartsSpeechParseResult,
  DartsSpeechCoverage,
  ParseDartsSpeechContext,
  ParsedDart,
  VoiceConfidenceTier,
} from './dartsSpeechTypes';

type Token =
  | { type: 'multiplier'; value: DartMultiplier }
  | { type: 'value'; value: number }
  | { type: 'miss' }
  | { type: 'noise' };

type TokenizationResult = {
  tokens: Token[];
  unknownCount: number;
  originalCount: number;
  rawTokens: string[];
};

type NormalizedParseContext = Required<Omit<ParseDartsSpeechContext, 'confidence'>> & {
  confidence: number | null;
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  un: 1,
  une: 1,
  one: 1,
  deux: 2,
  two: 2,
  trois: 3,
  three: 3,
  quatre: 4,
  four: 4,
  cinq: 5,
  five: 5,
  six: 6,
  sept: 7,
  seven: 7,
  huit: 8,
  eight: 8,
  neuf: 9,
  nine: 9,
  dix: 10,
  ten: 10,
  onze: 11,
  eleven: 11,
  douze: 12,
  twelve: 12,
  treize: 13,
  thirteen: 13,
  quatorze: 14,
  fourteen: 14,
  quinze: 15,
  fifteen: 15,
  seize: 16,
  sixteen: 16,
  dixsept: 17,
  seventeen: 17,
  dixhuit: 18,
  eighteen: 18,
  dixneuf: 19,
  nineteen: 19,
  vingt: 20,
  twenty: 20,
  trente: 30,
  thirty: 30,
  quarante: 40,
  forty: 40,
  cinquante: 50,
  fifty: 50,
  soixante: 60,
  sixty: 60,
  soixantedix: 70,
  seventy: 70,
  quatrevingt: 80,
  quatrevingts: 80,
  eighty: 80,
  quatrevingtdix: 90,
  ninety: 90,
  cent: 100,
  hundred: 100,
};

const MULTIPLIER_WORDS: Record<string, DartMultiplier> = {
  single: 'single',
  simple: 'single',
  double: 'double',
  triple: 'triple',
};

const SCORE_HINT_WORDS = new Set([
  'score',
  'je',
  'fais',
  'marque',
  'mis',
  'fait',
  'ca',
  'donne',
  'points',
  'point',
]);

const REMAINING_HINT_WORDS = new Set([
  'reste',
  'laisse',
  'suis',
  'a',
  'ajouer',
  'jouer',
]);

const IGNORE_WORDS = new Set([
  'and',
  'et',
  'avec',
  'mon',
  'mes',
  'ma',
  'de',
  'des',
  'du',
  'le',
  'la',
  'les',
  'my',
  'is',
  'ce',
  'qui',
  ...SCORE_HINT_WORDS,
  ...REMAINING_HINT_WORDS,
]);

const MISS_WORDS = new Set([
  'x',
  'iks',
  'miss',
  'missed',
  'rate',
  'raté',
  'ratée',
  'manque',
  'manqué',
  'manquee',
  'manquée',
  'acote',
  'blanc',
  'dehors',
]);

const HALF_BULL_WORDS = new Set(['outerbull', 'outer', 'demibulle', 'demie', 'demi']);
const BULL_WORDS = new Set(['bull', 'bullseye', 'centre', 'pleincentre', 'interieur']);

function normalizeContext(contextOrConfidence?: ParseDartsSpeechContext | number | null): NormalizedParseContext {
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
}

function getConfidenceTier(confidence: number | null): VoiceConfidenceTier | null {
  if (confidence === null) return null;
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.65) return 'medium';
  return 'low';
}

function buildResult(
  transcript: string,
  normalizedTranscript: string,
  partial: Partial<DartsSpeechParseResult>,
): DartsSpeechParseResult {
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
}

function buildDart(multiplier: DartMultiplier, value: number): ParsedDart | null {
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
}

function toToken(rawToken: string): Token {
  if (!rawToken || IGNORE_WORDS.has(rawToken)) return { type: 'noise' };
  if (rawToken in MULTIPLIER_WORDS) return { type: 'multiplier', value: MULTIPLIER_WORDS[rawToken] };
  if (MISS_WORDS.has(rawToken)) return { type: 'miss' };
  if (HALF_BULL_WORDS.has(rawToken) || rawToken === 'outer bull') return { type: 'value', value: 25 };
  if (BULL_WORDS.has(rawToken)) return { type: 'value', value: 50 };
  if (/^\d+$/.test(rawToken)) return { type: 'value', value: Number(rawToken) };
  if (rawToken in NUMBER_WORDS) return { type: 'value', value: NUMBER_WORDS[rawToken] };
  return { type: 'noise' };
}

function tokenize(normalizedTranscript: string): TokenizationResult {
  const rawTokens = normalizedTranscript.split(' ').filter(Boolean);
  let unknownCount = 0;

  const tokens = rawTokens
    .map((rawToken) => {
      const token = toToken(rawToken);
      if (token.type === 'noise' && !IGNORE_WORDS.has(rawToken)) {
        unknownCount += 1;
      }
      return token;
    })
    .filter((token) => token.type !== 'noise');

  return { tokens, unknownCount, originalCount: rawTokens.length, rawTokens };
}

function hasTooMuchUnknownNoise(tokenization: TokenizationResult): boolean {
  if (tokenization.originalCount === 0) return false;
  return tokenization.unknownCount / tokenization.originalCount > 0.5;
}

function detectIntent(normalizedTranscript: string): DartsSpeechIntent {
  const rawTokens = normalizedTranscript.split(' ').filter(Boolean);

  if (rawTokens.some((token) => REMAINING_HINT_WORDS.has(token))) {
    return 'remaining_score';
  }

  if (rawTokens.some((token) => token in MULTIPLIER_WORDS || MISS_WORDS.has(token) || HALF_BULL_WORDS.has(token) || BULL_WORDS.has(token))) {
    return 'darts_sequence';
  }

  if (rawTokens.some((token) => SCORE_HINT_WORDS.has(token))) {
    return 'turn_score';
  }

  if (rawTokens.length > 0 && rawTokens.every((token) => /^\d+$/.test(token) || token in NUMBER_WORDS)) {
    if (rawTokens.length === 1) {
      return 'turn_score';
    }

    return 'darts_sequence';
  }

  return 'darts_sequence';
}

function parseSpokenNumber(tokens: string[]): number | null {
  if (!tokens.length) return null;

  let total = 0;
  let current = 0;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      if (tokens.length !== 1) return null;
      return Number(token);
    }

    const value = NUMBER_WORDS[token];
    if (value === undefined) return null;

    if (value === 100) {
      current = current === 0 ? 100 : current * 100;
      continue;
    }

    current += value;
  }

  total += current;
  return total;
}

function extractNumberTokens(normalizedTranscript: string, intent: DartsSpeechIntent): string[] {
  return normalizedTranscript
    .split(' ')
    .filter(Boolean)
    .filter((token) => {
      if (IGNORE_WORDS.has(token)) return false;
      if (intent === 'remaining_score' && REMAINING_HINT_WORDS.has(token)) return false;
      if (intent === 'turn_score' && SCORE_HINT_WORDS.has(token)) return false;
      return true;
    });
}

function classifyCoverage(dartsCount: number, context: NormalizedParseContext): DartsSpeechCoverage {
  if (dartsCount <= 0) return null;
  if (dartsCount === 1) return 'single_dart';
  if (context.dartsAlreadyThrown === 0 && dartsCount === context.maxDartsPerTurn) return 'full_turn';
  return 'partial_turn';
}

function buildScoredDart(score: number): ParsedDart {
  if (score === 0) {
    return { label: 'Miss', multiplier: 'single', value: 0, score: 0 };
  }

  return {
    label: `Score ${score}`,
    multiplier: 'single',
    value: score,
    score,
  };
}

function resolveResultTier(
  confidenceTier: VoiceConfidenceTier | null,
  options?: { ambiguous?: boolean; hadNormalizationAdjustment?: boolean; explicitOnly?: boolean },
): VoiceConfidenceTier | null {
  if (confidenceTier === 'low') return 'low';
  if (options?.ambiguous) return 'medium';
  if (options?.explicitOnly) return 'high';
  if (options?.hadNormalizationAdjustment) return 'medium';
  return confidenceTier ?? 'medium';
}

function validateScoreAgainstContext(score: number, context: NormalizedParseContext): string | null {
  if (score > 180) {
    return 'Score superieur a 180.';
  }

  if (context.currentRemainingScore > 0 && score > context.currentRemainingScore) {
    return 'Score annonce superieur au score restant.';
  }

  return null;
}

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
  const hasExplicitDartSyntax = tokenization.rawTokens.some((token) => (
    token in MULTIPLIER_WORDS
    || HALF_BULL_WORDS.has(token)
    || BULL_WORDS.has(token)
  ));

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

export function parseDartsSpeechTranscript(
  transcript: string,
  contextOrConfidence?: ParseDartsSpeechContext | number | null,
): DartsSpeechParseResult {
  const context = normalizeContext(contextOrConfidence);
  const normalizedTranscript = normalizeDartsTranscript(transcript);
  const confidenceTier = getConfidenceTier(context.confidence);
  const hadNormalizationAdjustment = normalizedTranscript !== transcript.toLowerCase().trim();

  if (!normalizedTranscript) {
    return buildResult(transcript, normalizedTranscript, {
      status: 'invalid',
      reason: 'Transcription vide.',
      confidence: context.confidence,
      confidenceTier,
    });
  }

  if (confidenceTier === 'low') {
    return buildResult(transcript, normalizedTranscript, {
      status: 'invalid',
      reason: 'Confiance Deepgram trop faible.',
      confidence: context.confidence,
      confidenceTier,
    });
  }

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
}
