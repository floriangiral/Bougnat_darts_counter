// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cleanupAudioResources,
  createBrowserAudioContext,
  ensureAudioCaptureReady,
  type AudioCaptureRefs,
} from '../../../src/features/x01/voice/audioContextManager';
import { createFakeMediaStream, FakeAudioContext, FakeAudioWorkletNode, installAudioFakes } from './voiceBrowserFakes';

function createRefs(): AudioCaptureRefs {
  return {
    audioContextRef: { current: null },
    mediaStreamRef: { current: null },
    sourceRef: { current: null },
    workletNodeRef: { current: null },
    gainRef: { current: null },
    audioWorkletLoadedRef: { current: false },
    bufferedPcmChunksRef: { current: [] },
  };
}

function setup(refs = createRefs()) {
  const { stream, track } = createFakeMediaStream();
  const params = {
    refs,
    mediaStream: stream,
    onAudioChunk: vi.fn(),
    onRuntimeFailure: vi.fn(),
    onReady: vi.fn(),
    pcmCaptureWorkletPath: '/capture.js',
    targetSampleRate: 16000,
    logTiming: vi.fn(),
  };
  return { refs, params, track, ready: () => ensureAudioCaptureReady(params) };
}

beforeEach(installAudioFakes);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('audioContextManager', () => {
  it('uses the standard constructor, falls back to webkit, and reports unsupported browsers', () => {
    expect(createBrowserAudioContext()).toBeInstanceOf(FakeAudioContext);
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', FakeAudioContext);
    expect(createBrowserAudioContext()).toBeInstanceOf(FakeAudioContext);
    vi.stubGlobal('webkitAudioContext', undefined);
    expect(createBrowserAudioContext).toThrow('AudioContext non supporte');
  });

  it('resumes capture, loads the worklet, connects a silent graph and downsamples audio', async () => {
    const { refs, params, ready } = setup();
    await ready();
    const context = FakeAudioContext.instances[0];
    const worklet = FakeAudioWorkletNode.instances[0];
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.audioWorklet.addModule).toHaveBeenCalledWith('/capture.js');
    expect(refs.audioWorkletLoadedRef.current).toBe(true);
    expect(context.createMediaStreamSource).toHaveBeenCalledWith(params.mediaStream);
    expect(context.source.connect).toHaveBeenCalledWith(worklet);
    expect(worklet.connect).toHaveBeenCalledWith(context.gains[0]);
    expect(context.gains[0].connect).toHaveBeenCalledWith(context.gains[1]);
    expect(context.gains[1].connect).toHaveBeenCalledWith(context.destination);
    expect(context.gains.map((gain) => gain.gain.value)).toEqual([0, 0]);
    expect(params.onReady).toHaveBeenCalledOnce();

    worklet.emit(new Float32Array([1, 1, 1, -1, -1, -1]));
    expect(params.onAudioChunk).toHaveBeenCalledOnce();
    expect(params.onAudioChunk.mock.calls[0][0]).toEqual(new Int16Array([32767, -32768]));
    worklet.emit(new Float32Array());
    worklet.emit([1, 2, 3]);
    expect(params.onAudioChunk).toHaveBeenCalledOnce();
    params.onAudioChunk.mockImplementationOnce(() => { throw new Error('consumer failed'); });
    worklet.emit(new Float32Array([1, 1, 1]));
    expect(params.onRuntimeFailure).toHaveBeenCalledOnce();
  });

  it('reuses a running context and loaded module while replacing old capture resources', async () => {
    const first = setup();
    await first.ready();
    const oldWorklet = FakeAudioWorkletNode.instances[0];
    const second = setup(first.refs);
    await second.ready();
    expect(FakeAudioContext.instances).toHaveLength(1);
    const context = FakeAudioContext.instances[0];
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.audioWorklet.addModule).toHaveBeenCalledOnce();
    expect(second.params.logTiming).toHaveBeenCalledWith('audio-context-already-running', { state: 'running' });
    expect(first.track.stop).toHaveBeenCalledOnce();
    expect(oldWorklet.port.close).toHaveBeenCalledOnce();
    expect(oldWorklet.disconnect).toHaveBeenCalledOnce();
    expect(second.refs.mediaStreamRef.current).toBe(second.params.mediaStream);
  });

  it('reports a missing worklet or failed module before declaring capture ready', async () => {
    const first = setup();
    const context = new FakeAudioContext();
    first.refs.audioContextRef.current = context as unknown as AudioContext;
    Object.defineProperty(context, 'audioWorklet', { configurable: true, value: undefined });
    await expect(first.ready()).rejects.toThrow('AudioWorklet non supporte');
    expect(first.params.onReady).not.toHaveBeenCalled();

    const second = setup();
    const otherContext = new FakeAudioContext();
    otherContext.audioWorklet.addModule.mockRejectedValueOnce(new Error('module unavailable'));
    second.refs.audioContextRef.current = otherContext as unknown as AudioContext;
    await expect(second.ready()).rejects.toThrow('module unavailable');
    expect(second.refs.audioWorkletLoadedRef.current).toBe(false);
    expect(second.params.onReady).not.toHaveBeenCalled();
  });

  it('clears capture resources and buffers without closing the reusable context', async () => {
    const { refs, track, ready } = setup();
    await ready();
    const context = refs.audioContextRef.current;
    refs.bufferedPcmChunksRef.current = [new Int16Array([42])];
    cleanupAudioResources(refs);
    expect(track.stop).toHaveBeenCalledOnce();
    expect(refs.mediaStreamRef.current).toBeNull();
    expect(refs.workletNodeRef.current).toBeNull();
    expect(refs.sourceRef.current).toBeNull();
    expect(refs.gainRef.current).toBeNull();
    expect(refs.bufferedPcmChunksRef.current).toEqual([]);
    expect(refs.audioContextRef.current).toBe(context);
    expect(FakeAudioContext.instances[0].close).not.toHaveBeenCalled();
    expect(refs.audioWorkletLoadedRef.current).toBe(true);
    cleanupAudioResources(refs);
  });

  it('continues cleanup when browser resources throw and ignores asynchronous context close failures', async () => {
    const { refs, track, ready } = setup();
    await ready();
    const context = FakeAudioContext.instances[0];
    const worklet = FakeAudioWorkletNode.instances[0];
    const fail = () => { throw new Error('already disposed'); };
    worklet.port.close.mockImplementation(fail);
    worklet.disconnect.mockImplementation(fail);
    context.source.disconnect.mockImplementation(fail);
    context.gains[0].disconnect.mockImplementation(fail);
    track.stop.mockImplementation(fail);
    context.close.mockRejectedValueOnce(new Error('already closed'));
    expect(() => cleanupAudioResources(refs, { closeContext: true })).not.toThrow();
    await Promise.resolve();
    expect(context.close).toHaveBeenCalledOnce();
    expect(refs.audioContextRef.current).toBeNull();
    expect(refs.audioWorkletLoadedRef.current).toBe(false);
    expect(refs.mediaStreamRef.current).toBeNull();
    expect(refs.workletNodeRef.current).toBeNull();
    expect(refs.sourceRef.current).toBeNull();
    expect(refs.gainRef.current).toBeNull();
  });
});
