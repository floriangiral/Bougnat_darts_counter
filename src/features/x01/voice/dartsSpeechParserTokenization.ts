import { IGNORE_WORDS, MISS_WORDS, MULTIPLIER_WORDS, NUMBER_WORDS, HALF_BULL_WORDS, BULL_WORDS } from './dartsSpeechParserLexicon';
import type { DartsSpeechParserToken } from './dartsSpeechParserToken';
import type { TokenizationResult } from './dartsSpeechParserShared';

const toToken = (rawToken: string): DartsSpeechParserToken => {
  if (!rawToken || IGNORE_WORDS.has(rawToken)) return { type: 'noise' };
  if (rawToken in MULTIPLIER_WORDS) return { type: 'multiplier', value: MULTIPLIER_WORDS[rawToken] };
  if (MISS_WORDS.has(rawToken)) return { type: 'miss' };
  if (HALF_BULL_WORDS.has(rawToken) || rawToken === 'outer bull') return { type: 'value', value: 25 };
  if (BULL_WORDS.has(rawToken)) return { type: 'value', value: 50 };
  if (/^\d+$/.test(rawToken)) return { type: 'value', value: Number(rawToken) };
  if (rawToken in NUMBER_WORDS) return { type: 'value', value: NUMBER_WORDS[rawToken] };
  return { type: 'noise' };
};

export const tokenize = (normalizedTranscript: string): TokenizationResult => {
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
};

export const hasTooMuchUnknownNoise = (tokenization: TokenizationResult): boolean => {
  if (tokenization.originalCount === 0) return false;
  return tokenization.unknownCount / tokenization.originalCount > 0.5;
};
