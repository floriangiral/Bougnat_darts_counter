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
      mip_opt_out: 'true',
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

  it('opts every listening session out of the provider model improvement program (spec 080 FR-02)', () => {
    expect(buildDeepgramListenConfig('Bearer token').mip_opt_out).toBe('true');
  });

  it('never sends a player name or identifier to the provider (spec 080 RM-03, FR-06)', () => {
    // La configuration ne dépend que du jeton : aucun champ libre (`tag`, `extra`, `search`, `replace`…)
    // ne peut porter un prénom, et les keyterms restent le vocabulaire fixe des fléchettes.
    expect(buildDeepgramListenConfig).toHaveLength(1);
    const config = buildDeepgramListenConfig('Bearer token');
    expect(Object.keys(config).sort()).toEqual([
      'Authorization', 'diarize', 'encoding', 'endpointing', 'interim_results', 'keyterm', 'language',
      'mip_opt_out', 'model', 'numerals', 'punctuate', 'sample_rate', 'smart_format', 'vad_events',
    ]);
    expect(config.keyterm).toEqual([
      'single', 'double', 'triple', 'simple', 'bulle', 'bull', 'bullseye', 'outer bull',
      'demie bulle', 'demi bulle', 'manque', 'miss', 'rate', 'ratee',
    ]);
    const serialized = JSON.stringify(config).toLowerCase();
    ['alice', 'bruno', 'p1', 'team1', 'joueur'].forEach((identifier) => {
      expect(serialized).not.toContain(identifier);
    });
  });

  it('builds independent request objects without retaining an earlier authorization', () => {
    const first = buildDeepgramListenConfig('Bearer first');
    const second = buildDeepgramListenConfig('Bearer second');
    expect(second).not.toBe(first);
    expect(first.Authorization).toBe('Bearer first');
    expect(second.Authorization).toBe('Bearer second');
  });
});
