import { afterEach, describe, expect, it, vi } from 'vitest';

import { logVoiceDebug, logVoiceError } from '../../../src/features/x01/voice/voiceStreamingLogger';

afterEach(() => vi.unstubAllEnvs());

describe('voiceStreamingLogger', () => {
  it('logs prefixed diagnostics with their metadata only in development', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.stubEnv('DEV', true);
    logVoiceDebug('socket ready', { elapsedMs: 42 });
    expect(debug).toHaveBeenCalledWith('[voice-scoring] socket ready', { elapsedMs: 42 });
    vi.stubEnv('DEV', false);
    logVoiceDebug('production event');
    expect(debug).toHaveBeenCalledOnce();
  });

  it('always reports prefixed errors even outside development and without metadata', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('DEV', false);
    logVoiceError('connection failed', { code: 1006 });
    logVoiceError('unknown failure');
    expect(error.mock.calls).toEqual([
      ['[voice-scoring] connection failed', { code: 1006 }],
      ['[voice-scoring] unknown failure', undefined],
    ]);
  });
});
