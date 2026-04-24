import type { DartMultiplier } from './dartsSpeechTypes';

export type DartsSpeechParserToken =
  | { type: 'multiplier'; value: DartMultiplier }
  | { type: 'value'; value: number }
  | { type: 'miss' }
  | { type: 'noise' };
