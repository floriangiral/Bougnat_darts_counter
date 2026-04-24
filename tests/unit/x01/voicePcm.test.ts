import { describe, expect, it } from 'vitest';

import { downsampleToLinear16, floatTo16BitPCM } from '../../../src/features/x01/voice/voicePcm';

describe('voice pcm conversion', () => {
  it('clamps float samples to signed 16 bit PCM', () => {
    const pcm = floatTo16BitPCM(new Float32Array([-2, -1, 0, 1, 2]));

    expect(Array.from(pcm)).toEqual([-32768, -32768, 0, 32767, 32767]);
  });

  it('keeps the sample count when sample rates match', () => {
    const pcm = downsampleToLinear16(new Float32Array([0, 0.5, -0.5]), 16000, 16000);

    expect(Array.from(pcm)).toEqual([0, 16383, -16384]);
  });

  it('averages samples when downsampling', () => {
    const pcm = downsampleToLinear16(new Float32Array([1, 1, -1, -1]), 32000, 16000);

    expect(Array.from(pcm)).toEqual([32767, -32768]);
  });
});
