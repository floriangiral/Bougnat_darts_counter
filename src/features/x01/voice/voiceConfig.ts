export const VOICE_SCORING_TIMEOUT_MS = 6500;
export const DEEPGRAM_KEYTERMS = [
  'single',
  'double',
  'triple',
  'simple',
  'bulle',
  'bull',
  'bullseye',
  'outer bull',
  'demie bulle',
  'demi bulle',
  'manque',
  'miss',
  'rate',
  'ratee',
];

export function buildDeepgramListenConfig(authorization: string) {
  return {
    Authorization: authorization,
    diarize: 'false',
    encoding: 'linear16',
    endpointing: 300,
    interim_results: 'true',
    keyterm: DEEPGRAM_KEYTERMS,
    language: 'fr',
    model: 'nova-3',
    numerals: 'true',
    punctuate: 'false',
    sample_rate: 16000,
    smart_format: 'false',
    vad_events: 'true',
  } as const;
}
