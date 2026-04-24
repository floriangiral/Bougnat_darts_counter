import { BULL_WORDS, HALF_BULL_WORDS, IGNORE_WORDS, MISS_WORDS, MULTIPLIER_WORDS, NUMBER_WORDS, REMAINING_HINT_WORDS, SCORE_HINT_WORDS } from './dartsSpeechParserLexicon';
import type { DartsSpeechIntent } from './dartsSpeechTypes';

export const detectIntent = (normalizedTranscript: string): DartsSpeechIntent => {
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
};

export const parseSpokenNumber = (tokens: string[]): number | null => {
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
};

export const extractNumberTokens = (normalizedTranscript: string, intent: DartsSpeechIntent): string[] =>
  normalizedTranscript
    .split(' ')
    .filter(Boolean)
    .filter((token) => {
      if (IGNORE_WORDS.has(token)) return false;
      if (intent === 'remaining_score' && REMAINING_HINT_WORDS.has(token)) return false;
      if (intent === 'turn_score' && SCORE_HINT_WORDS.has(token)) return false;
      return true;
    });
