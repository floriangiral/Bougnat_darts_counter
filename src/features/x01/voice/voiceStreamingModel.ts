import type { DeepgramUtterance } from './dartsSpeechTypes';

export type FinalChunk = {
  transcript: string;
  confidence: number;
};

export const appendBufferedPcmChunk = (
  bufferedChunks: Int16Array[],
  nextChunk: Int16Array,
  maxChunks: number,
): Int16Array[] => {
  const nextBufferedChunks = bufferedChunks.length >= maxChunks
    ? bufferedChunks.slice(1)
    : bufferedChunks.slice();

  nextBufferedChunks.push(nextChunk.slice());
  return nextBufferedChunks;
};

export const buildDeepgramUtterance = (
  finalChunks: FinalChunk[],
  liveTranscript: string,
  liveConfidence: number,
  trigger: DeepgramUtterance['trigger'],
): DeepgramUtterance | null => {
  const finalTranscript = finalChunks
    .map((chunk) => chunk.transcript.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  const transcript = finalTranscript || liveTranscript.trim();
  if (!transcript) {
    return null;
  }

  const totalConfidence = finalChunks.reduce((sum, chunk) => sum + chunk.confidence, 0);
  const confidence = finalChunks.length > 0
    ? totalConfidence / finalChunks.length
    : liveConfidence;

  return {
    transcript,
    confidence,
    trigger,
  };
};

export const describeCaughtError = (error: unknown) => (
  error instanceof Error ? error.message : 'Unknown error'
);