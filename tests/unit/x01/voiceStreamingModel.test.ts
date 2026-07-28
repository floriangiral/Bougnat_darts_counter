import { describe, expect, it } from 'vitest';

import { appendBufferedPcmChunk, buildDeepgramUtterance, describeCaughtError } from '../../../src/features/x01/voice/voiceStreamingModel';

describe('voice streaming model', () => {
  it('keeps only the latest buffered pcm chunks', () => {
    const first = new Int16Array([1]);
    const second = new Int16Array([2]);
    const third = new Int16Array([3]);

    const buffered = appendBufferedPcmChunk([first, second], third, 2);

    expect(Array.from(buffered[0])).toEqual([2]);
    expect(Array.from(buffered[1])).toEqual([3]);
  });

  it('builds utterances from final chunks first, then live transcript fallback', () => {
    expect(buildDeepgramUtterance([
      { transcript: 'triple 20', confidence: 0.9 },
      { transcript: 'double 10', confidence: 0.7 },
    ], 'ignored', 0.2, 'speech_final')).toEqual({
      transcript: 'triple 20 double 10',
      confidence: 0.8,
      trigger: 'speech_final',
    });

    expect(buildDeepgramUtterance([], 'single 20', 0.55, 'utterance_end')).toEqual({
      transcript: 'single 20',
      confidence: 0.55,
      trigger: 'utterance_end',
    });

    expect(buildDeepgramUtterance([], '   ', 0.55, 'utterance_end')).toBeNull();
  });

  it('normalizes unknown caught errors to a stable message', () => {
    expect(describeCaughtError(new Error('boom'))).toBe('boom');
    expect(describeCaughtError('opaque')).toBe('Unknown error');
  });
});