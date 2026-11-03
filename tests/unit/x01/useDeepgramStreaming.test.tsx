// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { useDeepgramStreaming } from '../../../src/features/x01/voice/useDeepgramStreaming';
import type { DeepgramUtterance } from '../../../src/features/x01/voice/dartsSpeechTypes';
import type { DeepgramMessage } from '../../../src/features/x01/voice/deepgramLiveTypes';
import { VOICE_SCORING_TIMEOUT_MS } from '../../../src/features/x01/voice/voiceConfig';
import { createFakeMediaStream, FakeAudioContext, FakeAudioWorkletNode, installAudioFakes } from './voiceBrowserFakes';

const boundary = vi.hoisted(() => ({ token: vi.fn(), connect: vi.fn() }));
vi.mock('../../../src/features/x01/voice/deepgramClient', () => ({
  fetchDeepgramAccessToken: boundary.token,
}));
vi.mock('@deepgram/sdk', () => ({
  DeepgramClient: class {
    listen = { v1: { connect: boundary.connect } };
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

class FakeConnection {
  readyState: number = WebSocket.CONNECTING;
  handlers = new Map<string, (payload?: unknown) => void>();
  on = vi.fn((event: string, handler: (payload?: unknown) => void) => {
    this.handlers.set(event, handler);
  });
  connect = vi.fn(() => {
    this.readyState = WebSocket.OPEN;
    this.emit('open');
    return this;
  });
  waitForOpen = vi.fn().mockResolvedValue(undefined);
  close = vi.fn(() => { this.readyState = WebSocket.CLOSED; });
  sendMedia = vi.fn<(payload: Int16Array) => void>();
  sendCloseStream = vi.fn();

  emit(event: string, payload?: unknown) {
    this.handlers.get(event)?.(payload);
  }
}

function renderVoice(options: { enabled?: boolean; sessionKey?: string; onUtterance?: Mock<(payload: DeepgramUtterance) => void> } = {}) {
  const onUtterance = options.onUtterance ?? vi.fn<(payload: DeepgramUtterance) => void>();
  const hook = renderHook(
    (props) => useDeepgramStreaming({ ...props, onUtterance }),
    { initialProps: { enabled: options.enabled ?? true, sessionKey: options.sessionKey ?? 'turn-1' } },
  );
  return { ...hook, onUtterance };
}

async function startVoice(result: ReturnType<typeof renderVoice>['result']) {
  await act(async () => { await result.current.start(); });
}

function results(transcript: string, extra: { is_final?: boolean; speech_final?: boolean; confidence?: number } = {}): DeepgramMessage {
  return {
    type: 'Results',
    is_final: extra.is_final,
    speech_final: extra.speech_final,
    channel: { alternatives: [{ transcript, confidence: extra.confidence ?? 0.9 }] },
  };
}

let connection: FakeConnection;
let media: ReturnType<typeof createFakeMediaStream>;
let getUserMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  installAudioFakes();
  media = createFakeMediaStream();
  getUserMedia = vi.fn().mockResolvedValue(media.stream);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  boundary.token.mockResolvedValue({ accessToken: 'short-lived-token', expiresIn: 60 });
  connection = new FakeConnection();
  boundary.connect.mockResolvedValue(connection);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useDeepgramStreaming startup and audio', () => {
  it('prewarms audio/token only when enabled and ignores a disabled start', async () => {
    const { result, rerender } = renderVoice({ enabled: false });
    expect(result.current.state).toBe('idle');
    expect(boundary.token).not.toHaveBeenCalled();
    expect(FakeAudioContext.instances).toHaveLength(0);
    await startVoice(result);
    expect(getUserMedia).not.toHaveBeenCalled();
    rerender({ enabled: true, sessionKey: 'turn-1' });
    expect(boundary.token).toHaveBeenCalledWith();
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('survives speculative prefetch failure and retries token acquisition on start', async () => {
    boundary.token.mockRejectedValueOnce(new Error('prefetch offline'));
    const { result } = renderVoice();
    await startVoice(result);
    expect(result.current.state).toBe('listening');
    expect(boundary.token).toHaveBeenCalledTimes(2);
  });

  it('starts capture with browser audio constraints, sends PCM and ignores duplicate starts', async () => {
    const { result } = renderVoice();
    await startVoice(result);
    expect(result.current.isListening).toBe(true);
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    const signal = boundary.token.mock.calls[1][0] as AbortSignal;
    expect(signal.aborted).toBe(false);
    expect(FakeAudioContext.instances[0].audioWorklet.addModule).toHaveBeenCalledWith('/pcmCaptureWorklet.js');
    act(() => FakeAudioWorkletNode.instances[0].emit(new Float32Array([1, 1, 1, -1, -1, -1])));
    expect(connection.sendMedia).toHaveBeenCalledWith(new Int16Array([32767, -32768]));
    await startVoice(result);
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(result.current.issue).toBeNull();
  });

  it('buffers bounded, copied PCM until open then flushes in order', async () => {
    const token = deferred<{ accessToken: string }>();
    boundary.token.mockImplementation((signal?: AbortSignal) => (
      signal ? token.promise : Promise.resolve({ accessToken: 'prefetch' })
    ));
    const { result } = renderVoice();
    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.start();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('listening');
    const worklet = FakeAudioWorkletNode.instances[0];
    act(() => {
      for (let index = 1; index <= 27; index += 1) {
        worklet.emit(new Float32Array([index / 100, index / 100, index / 100]));
      }
    });
    expect(connection.sendMedia).not.toHaveBeenCalled();
    await act(async () => {
      token.resolve({ accessToken: 'ready' });
      await pending;
    });
    expect(connection.sendMedia).toHaveBeenCalledTimes(24);
    expect(connection.sendMedia.mock.calls[0][0][0]).toBe(1310);
    expect(connection.sendMedia.mock.calls[23][0][0]).toBe(8847);
    act(() => connection.emit('open'));
    expect(connection.sendMedia).toHaveBeenCalledTimes(24);
  });

  it('stops cleanly despite a failed CloseStream and can restart with the same context', async () => {
    const { result } = renderVoice();
    await startVoice(result);
    connection.sendCloseStream.mockImplementationOnce(() => { throw new Error('socket gone'); });
    act(() => result.current.stop());
    expect(connection.sendCloseStream).toHaveBeenCalledWith({ type: 'CloseStream' });
    expect(connection.close).toHaveBeenCalledOnce();
    expect(media.track.stop).toHaveBeenCalledOnce();
    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(FakeAudioContext.instances[0].close).not.toHaveBeenCalled();
    const replacement = createFakeMediaStream();
    getUserMedia.mockResolvedValueOnce(replacement.stream);
    connection = new FakeConnection();
    boundary.connect.mockResolvedValueOnce(connection);
    await startVoice(result);
    expect(result.current.isListening).toBe(true);
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].audioWorklet.addModule).toHaveBeenCalledOnce();
  });
});

describe('useDeepgramStreaming transcripts', () => {
  it('updates interim text, combines final segments and emits once per speech turn', async () => {
    const { result, onUtterance } = renderVoice();
    await startVoice(result);
    act(() => connection.emit('message', results('  triple  ')));
    expect(result.current.liveTranscript).toBe('triple');
    act(() => connection.emit('message', results('triple vingt', { is_final: true, confidence: 0.8 })));
    act(() => connection.emit('message', results('double dix', { is_final: true, speech_final: true, confidence: 1 })));
    expect(onUtterance).toHaveBeenCalledWith({
      transcript: 'triple vingt double dix', confidence: 0.9, trigger: 'speech_final',
    });
    expect(result.current.liveTranscript).toBe('');
    expect(result.current.state).toBe('processing');
    act(() => connection.emit('message', { type: 'UtteranceEnd' }));
    expect(onUtterance).toHaveBeenCalledOnce();
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(0); }));
    expect(result.current.isListening).toBe(true);

    act(() => connection.emit('message', { type: 'SpeechStarted' }));
    act(() => connection.emit('message', results('bulle', { is_final: true, speech_final: true })));
    expect(onUtterance).toHaveBeenCalledTimes(2);
    expect(onUtterance.mock.calls[1][0].transcript).toBe('bulle');
  });

  it('emits interim-only text at utterance end and ignores empty or unknown messages', async () => {
    const { result, onUtterance } = renderVoice();
    await startVoice(result);
    act(() => {
      connection.emit('message', { type: 'Metadata' });
      connection.emit('message', { type: 'Results' });
      connection.emit('message', results('   ', { speech_final: true }));
      connection.emit('message', { type: 'UtteranceEnd' });
    });
    expect(onUtterance).not.toHaveBeenCalled();
    act(() => connection.emit('message', results('soixante', { confidence: 0.7 })));
    act(() => connection.emit('message', { type: 'UtteranceEnd' }));
    expect(onUtterance).toHaveBeenCalledWith({
      transcript: 'soixante', confidence: 0.7, trigger: 'utterance_end',
    });
  });

  it('defaults missing transcript confidence to zero', async () => {
    const { result, onUtterance } = renderVoice();
    await startVoice(result);
    act(() => connection.emit('message', {
      type: 'Results', is_final: true, speech_final: true,
      channel: { alternatives: [{ transcript: 'vingt' }] },
    }));
    expect(onUtterance.mock.calls[0][0].confidence).toBe(0);
  });

  it('turns consumer failures into transcript errors and releases capture/socket', async () => {
    const onUtterance = vi.fn(() => { throw new Error('cannot apply score'); });
    const { result } = renderVoice({ onUtterance });
    await startVoice(result);
    act(() => connection.emit('message', results('vingt', { is_final: true, speech_final: true })));
    expect(result.current.issue).toBe('transcript');
    expect(result.current.error).toBe('Transcription vocale trop ambigue.');
    expect(result.current.state).toBe('error');
    expect(result.current.liveTranscript).toBe('');
    expect(connection.close).toHaveBeenCalledOnce();
    expect(media.track.stop).toHaveBeenCalledOnce();
  });

  it('handles malformed provider transcripts without allowing them to escape the event handler', async () => {
    const { result } = renderVoice();
    await startVoice(result);
    act(() => connection.emit('message', {
      type: 'Results', channel: { alternatives: [{ transcript: 42 }] },
    }));
    expect(result.current.issue).toBe('transcript');
    expect(connection.close).toHaveBeenCalledOnce();
  });
});

describe('useDeepgramStreaming errors and timeout', () => {
  it.each([
    [new DOMException('Permission denied', 'NotAllowedError'), 'microphone', 'Micro indisponible ou refuse.'],
    [new Error('token service unavailable'), 'token', 'token service unavailable'],
    ['unknown failure', 'connection', 'Connexion vocale indisponible.'],
  ])('classifies a start failure %s and allows reset', async (failure, issue, message) => {
    getUserMedia.mockRejectedValueOnce(failure);
    const { result } = renderVoice();
    await startVoice(result);
    expect(result.current.state).toBe('error');
    expect(result.current.issue).toBe(issue);
    expect(result.current.error).toBe(message);
    expect(boundary.connect).not.toHaveBeenCalled();
    act(() => result.current.reset());
    expect(result.current.state).toBe('idle');
    expect(result.current.issue).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('surfaces unsupported audio after best-effort prewarming', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const { result } = renderVoice();
    await startVoice(result);
    expect(result.current.issue).toBe('audio');
    expect(result.current.error).toContain('AudioContext non supporte');
  });

  it('handles an aborted start without reporting a user-facing error', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
    const { result } = renderVoice();
    await startVoice(result);
    expect(result.current.error).toBeNull();
    expect(result.current.issue).toBeNull();
    expect(boundary.connect).not.toHaveBeenCalled();
  });

  it('cleans up microphone capture if token retrieval fails', async () => {
    boundary.token.mockImplementation((signal?: AbortSignal) => (
      signal ? Promise.reject(new Error('token rejected')) : Promise.resolve({ accessToken: 'warm' })
    ));
    const { result } = renderVoice();
    await startVoice(result);
    expect(result.current.issue).toBe('token');
    expect(media.track.stop).toHaveBeenCalledOnce();
    expect(FakeAudioWorkletNode.instances[0].port.close).toHaveBeenCalledOnce();
  });

  it('cleans up a socket that fails to open', async () => {
    connection.waitForOpen.mockRejectedValueOnce(new Error('network offline'));
    const { result } = renderVoice();
    await startVoice(result);
    expect(result.current.issue).toBe('connection');
    expect(result.current.error).toBe('network offline');
    expect(media.track.stop).toHaveBeenCalledOnce();
    expect(connection.close).toHaveBeenCalledOnce();
  });

  it.each([
    [{ type: 'Error', error: 'Provider quota exhausted' }, 'Provider quota exhausted'],
    [{ type: 'Error' }, 'Connexion vocale indisponible.'],
  ])('handles provider error payload %j', async (payload, message) => {
    const { result } = renderVoice();
    await startVoice(result);
    act(() => connection.emit('message', payload));
    expect(result.current.issue).toBe('connection');
    expect(result.current.error).toBe(message);
    expect(result.current.isListening).toBe(false);
    expect(connection.close).toHaveBeenCalledOnce();
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(VOICE_SCORING_TIMEOUT_MS); }));
    expect(result.current.issue).toBe('connection');
  });

  it('handles socket errors and disregards the resulting stale close/error events', async () => {
    const { result } = renderVoice();
    await startVoice(result);
    act(() => connection.emit('error', new Error('disconnected')));
    expect(result.current.issue).toBe('connection');
    expect(result.current.error).toBe('Connexion vocale indisponible.');
    act(() => {
      connection.emit('close', { code: 1006, reason: 'failed' });
      connection.emit('error', new Error('late error'));
    });
    expect(result.current.state).toBe('error');
    expect(connection.close).toHaveBeenCalledOnce();
  });

  it('handles audio delivery failures as an audio runtime issue', async () => {
    const { result } = renderVoice();
    await startVoice(result);
    connection.sendMedia.mockImplementationOnce(() => { throw new Error('send failed'); });
    act(() => FakeAudioWorkletNode.instances[0].emit(new Float32Array([1, 1, 1])));
    expect(result.current.issue).toBe('audio');
    expect(result.current.error).toBe('Capture audio indisponible.');
    expect(connection.close).toHaveBeenCalledOnce();
    expect(media.track.stop).toHaveBeenCalledOnce();
  });

  it.each([false, true])('times out with manual-entry feedback (pending transcript: %s)', async (hasTranscript) => {
    const { result, onUtterance } = renderVoice();
    await startVoice(result);
    if (hasTranscript) {
      act(() => connection.emit('message', results('quarante', { confidence: 0.6 })));
    }
    connection.sendCloseStream.mockImplementationOnce(() => { throw new Error('closed during timeout'); });
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(VOICE_SCORING_TIMEOUT_MS); }));
    expect(onUtterance).toHaveBeenCalledTimes(hasTranscript ? 1 : 0);
    if (hasTranscript) {
      expect(onUtterance).toHaveBeenCalledWith({ transcript: 'quarante', confidence: 0.6, trigger: 'utterance_end' });
    }
    expect(result.current.issue).toBe('timeout');
    expect(result.current.error).toContain('saisie manuelle');
    expect(result.current.state).toBe('error');
    expect(media.track.stop).toHaveBeenCalledOnce();
    expect(connection.close).toHaveBeenCalledOnce();
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(0); }));
    expect(result.current.state).toBe('error');
  });

  it('returns to idle and cancels timeout on normal socket close', async () => {
    const { result } = renderVoice();
    await startVoice(result);
    act(() => connection.emit('close', { code: 1000, reason: 'finished' }));
    expect(result.current.state).toBe('idle');
    expect(media.track.stop).toHaveBeenCalledOnce();
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(VOICE_SCORING_TIMEOUT_MS); }));
    expect(result.current.error).toBeNull();
    expect(connection.sendCloseStream).not.toHaveBeenCalled();
  });
});

describe('useDeepgramStreaming invalidation and cleanup races', () => {
  it('ignores a second start while microphone permission is pending and stops late tracks after reset', async () => {
    const request = deferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(request.promise);
    const { result } = renderVoice();
    let pending!: Promise<void>;
    await act(() => Promise.resolve().then(() => { pending = result.current.start(); }));
    expect(result.current.state).toBe('processing');
    await startVoice(result);
    expect(getUserMedia).toHaveBeenCalledOnce();
    const signal = boundary.token.mock.calls[1][0] as AbortSignal;
    act(() => result.current.reset());
    await act(async () => { request.resolve(media.stream); await pending; });
    expect(media.track.stop).toHaveBeenCalledOnce();
    expect(boundary.connect).not.toHaveBeenCalled();
    expect(FakeAudioWorkletNode.instances).toHaveLength(0);
    expect(result.current.state).toBe('idle');
    // The completed token request is already released; resetting must not depend on aborting it.
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('aborts pending token work and ignores a late token after session replacement', async () => {
    const token = deferred<{ accessToken: string }>();
    boundary.token.mockImplementation((signal?: AbortSignal) => (
      signal ? token.promise : Promise.resolve({ accessToken: 'warm' })
    ));
    const { result, rerender } = renderVoice();
    let pending!: Promise<void>;
    await act(async () => { pending = result.current.start(); await Promise.resolve(); });
    const signal = boundary.token.mock.calls[1][0] as AbortSignal;
    expect(signal.aborted).toBe(false);
    rerender({ enabled: true, sessionKey: 'turn-2' });
    expect(signal.aborted).toBe(true);
    expect(result.current.state).toBe('idle');
    await act(async () => { token.resolve({ accessToken: 'too-late' }); await pending; });
    expect(boundary.connect).not.toHaveBeenCalled();
    expect(media.track.stop).toHaveBeenCalledOnce();
  });

  it('discards late socket completion and all callbacks from an invalidated attempt', async () => {
    const opening = deferred<void>();
    connection.waitForOpen.mockReturnValueOnce(opening.promise);
    const { result, onUtterance } = renderVoice();
    let pending!: Promise<void>;
    await act(async () => { pending = result.current.start(); await Promise.resolve(); });
    const oldWorklet = FakeAudioWorkletNode.instances[0];
    act(() => result.current.stop());
    const sendsBefore = connection.sendMedia.mock.calls.length;
    act(() => {
      oldWorklet.emit(new Float32Array([1, 1, 1]));
      connection.emit('open');
      connection.emit('message', results('triple vingt', { is_final: true, speech_final: true }));
      connection.emit('error', new Error('late'));
      connection.emit('close', { code: 1006, reason: 'late' });
    });
    await act(async () => { opening.resolve(); await pending; });
    expect(connection.close).toHaveBeenCalledTimes(2);
    expect(connection.sendMedia).toHaveBeenCalledTimes(sendsBefore);
    expect(onUtterance).not.toHaveBeenCalled();
    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('ignores a late failure after the attempt was reset', async () => {
    const microphone = deferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(microphone.promise);
    const { result } = renderVoice();
    let pending!: Promise<void>;
    await act(() => Promise.resolve().then(() => { pending = result.current.start(); }));
    act(() => result.current.reset());
    await act(async () => {
      microphone.reject(new DOMException('Permission denied', 'NotAllowedError'));
      await pending;
    });
    expect(result.current.state).toBe('idle');
    expect(result.current.issue).toBeNull();
  });

  it('does not re-enter listening when post-transcript processing finishes after reset', async () => {
    const { result } = renderVoice();
    await startVoice(result);
    act(() => connection.emit('message', results('vingt', { is_final: true, speech_final: true })));
    expect(result.current.state).toBe('processing');
    act(() => result.current.reset());
    await act(() => Promise.resolve().then(() => { vi.advanceTimersByTime(0); }));
    expect(result.current.state).toBe('idle');
    expect(result.current.liveTranscript).toBe('');
  });

  it('disabling releases the full audio context and connection, and re-enabling prewarms afresh', async () => {
    const { result, rerender, unmount } = renderVoice();
    await startVoice(result);
    const context = FakeAudioContext.instances[0];
    rerender({ enabled: false, sessionKey: 'turn-1' });
    expect(result.current.state).toBe('idle');
    expect(context.close).toHaveBeenCalledOnce();
    expect(connection.close).toHaveBeenCalledOnce();
    expect(media.track.stop).toHaveBeenCalledOnce();
    rerender({ enabled: true, sessionKey: 'turn-1' });
    expect(FakeAudioContext.instances).toHaveLength(2);
    unmount();
    expect(FakeAudioContext.instances[1].close).toHaveBeenCalledOnce();
  });

  it('unmounting an active session closes capture, tracks and socket', async () => {
    const { result, unmount } = renderVoice();
    await startVoice(result);
    const worklet = FakeAudioWorkletNode.instances[0];
    unmount();
    expect(worklet.port.close).toHaveBeenCalledOnce();
    expect(worklet.disconnect).toHaveBeenCalledOnce();
    expect(media.track.stop).toHaveBeenCalledOnce();
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalledOnce();
    expect(connection.close).toHaveBeenCalledOnce();
  });
});
