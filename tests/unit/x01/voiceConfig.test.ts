import { describe, expect, it } from 'vitest';

import { buildDeepgramListenConfig, DEEPGRAM_KEYTERMS, VOICE_SCORING_TIMEOUT_MS } from '../../../src/features/x01/voice/voiceConfig';

describe('voiceConfig', () => {
  it('configures French low-latency mono PCM recognition with darts vocabulary', () => {
    expect(buildDeepgramListenConfig('Bearer short-lived-token')).toEqual({
      Authorization: 'Bearer short-lived-token',
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
    });
    expect(DEEPGRAM_KEYTERMS).toEqual(expect.arrayContaining(['single', 'double', 'triple', 'bulle', 'miss']));
    expect(VOICE_SCORING_TIMEOUT_MS).toBe(6500);
  });

  it('builds independent request objects without retaining an earlier authorization', () => {
    const first = buildDeepgramListenConfig('Bearer first');
    const second = buildDeepgramListenConfig('Bearer second');
    expect(second).not.toBe(first);
    expect(first.Authorization).toBe('Bearer first');
    expect(second.Authorization).toBe('Bearer second');
  });
});
